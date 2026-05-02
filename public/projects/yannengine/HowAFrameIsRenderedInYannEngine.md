# How a Frame Is Rendered in YannEngine

> Scope: This document walks through the **complete lifetime of a single frame** of `CTestLevel3D`, from process startup to the final pixel hitting the monitor, using the **DX12 RHI** backend and the **editor render path** (`CRenderMgr::render_editor`).
>
> Codebase: `YannEngineDX12RHI` (custom C++ engine, deferred PBR + IBL, DX12 / DX11 RHI).

---

## 0. The 10‑second summary

```
WinMain
  └─ CEngine::Init                  // RHI device + all managers
       └─ CRenderMgr::init          // build MRTs, IBL pre‑integration
  └─ CTestLevel3D::CreateTestLevel  // spawn lights, meshes, camera
  └─ Main loop:
       CEngine::Progress
         ├─ Tick   (Time / Key / Asset / Level / Collision)
         ├─ DX12Device::BeginFrame  // grab cmd list, rotate back buffer
         └─ CRenderMgr::render
              └─ render_editor  ── 11 GPU passes ──▶ HDRSceneTex ─▶ SWAPCHAIN
       DX12Device::Present          // submit + flip + GPU fence wait
```

Everything below is just an expansion of these eight lines.

---

## 1. Process bootstrap — `wWinMain` (`Project/Client/main.cpp`)

1. Register the Win32 window class and `CreateWindowW` a `1280×720` HWND.
2. `CEngine::GetInst()->Init(hWnd, {1280, 720})` — explained in §2.
3. `CEditorMgr::init()` and `CImGuiMgr::init(hWnd)` bring up the editor UI overlay (skipped in `GAME_RELEASE`).
4. `CTestLevel3D::CreateTestLevel()` populates the scene — explained in §3.
5. Enter the Win32 `PeekMessage` loop. As long as the window is not being resized, every iteration calls:
   - `CEngine::GetInst()->Progress()` — tick + render (§4–§7).
   - `CEditorMgr::tick()` / `CImGuiMgr::tick()` — editor + ImGui draw lists.
   - `RHI_DEVICE->Present()` — flip the swapchain (§8).

---

## 2. Engine initialization — `CEngine::Init` (`Project/Engine/CEngine.cpp`)

1. **Adjust window** to the requested resolution (`AdjustWindowRect` + `SetWindowPos`).
2. **Pick the RHI backend** through the `USE_DX12` / `USE_DX11` switch and store it in the global `g_pRHIDevice`. For DX12 this calls `DX12Device::GetInst()->init(hWnd, resolution)`, which:
   - Creates the `ID3D12Device`, `IDXGISwapChain` (triple‑buffered), the direct/copy/compute command queues and per‑frame fences.
   - Allocates the descriptor heap pools and the **graphics + compute root signatures**.
   - Wraps each back‑buffer in a `DX12RHITexture` exposed under the asset name **`RenderTargetTex`**.
3. **Initialize the manager singletons** (in this exact order — order matters because later managers query earlier ones):
   `CPathMgr → CTimeMgr → CKeyMgr → CAssetMgr → CRenderMgr → CLevelMgr` (`CFontMgr` only on DX11).

### 2.1 `CRenderMgr::init` (`CRenderMgr_Init.cpp`)

Two things happen here, both run **once at startup**:

#### a) `CreateRenderTargetSet()` — build all Multi‑Render‑Target sets

| `MRT_TYPE`        | Render targets (format)                                                                                                    | Depth        | Used in pass |
|-------------------|-----------------------------------------------------------------------------------------------------------------------------|--------------|--------------|
| `SWAPCHAIN`       | `RenderTargetTex` (back buffer, R8G8B8A8)                                                                                   | `DepthStencilTex` (D24S8) | Tone‑map output, final UI |
| `DEFERRED`        | `GBuffer_Color` (R16G16B16A16F), `GBuffer_Normal` (R32×4F), `GBuffer_Position` (R32×4F), `GBuffer_Emmisive`, `GBuffer_CustomData` | shared D24S8 | G‑Buffer pass |
| `DEFERRED_DECAL`  | aliases `GBuffer_Color` + `GBuffer_Emmisive`                                                                                 | —            | Decal pass    |
| `SSAO` / `SSAO_BLUR` | `SSAOTexture` / `SSAOBlurTex` (R8_UNORM), cleared to **white** so ambient ≠ 0 when SSAO is off                            | —            | SSAO          |
| `DEFERRED_LIGHT`  | `GBuffer_Diffuse`, `GBuffer_Specular` (R32×4F)                                                                              | —            | Lighting accumulation |
| `HDR_SCENE`       | `HDRSceneTex` (R16G16B16A16F)                                                                                               | shared D24S8 | Merge + forward pass |

A separate `RenderTargetTexCopy` (R8G8B8A8) is also allocated for post‑process read‑back.

#### b) `CIBLManager::init()` — pre‑bake Image‑Based Lighting

This is wrapped in its own `BeginFrame / EndFrame` because it must execute on the GPU before the first frame ever runs:

1. Create a `512×512 R16G16` UAV texture **`IBL_BRDFLut`**.
2. Dispatch `CBRDFLutCS` once → fills the split‑sum BRDF LUT.

The full irradiance + prefiltered specular cubemaps (`IBL_Irradiance`, `IBL_Prefilter`) are produced later by `GenerateFromEquirect` / `GenerateFromCubemap` when an HDR / cubemap is loaded by the level. After that `m_bReady = true` and `CIBLManager::Binding()` will bind:

| Slot | Texture            | Purpose                                          |
|------|--------------------|--------------------------------------------------|
| t5   | `IBL_BRDFLut`      | Pre‑integrated BRDF (split‑sum)                  |
| t6   | env cubemap        | Bound separately by `CSkyBox`                    |
| t7   | `IBL_Irradiance`   | Diffuse IBL (32×32 cubemap)                      |
| t8   | `IBL_Prefilter`    | Specular IBL (256×256, 5 mips, roughness‑filtered) |

---

## 3. Scene construction — `CTestLevel3D::CreateTestLevel`

Builds a `CLevel` with three named layers (`Default`, `Player`, `Monster`) and adds the directional `Dir Light` (`CLight3D`, `LIGHT_TYPE::DIRECTIONAL`, shadow casting **enabled**), the test meshes (Gothic tracery ruins etc.) with `CMaterialInstance`s on top of the parent material `Std3DDeferredPBRMaterial`, and the editor camera (registered via `CRenderMgr::RegisterEditorCamera`). After this call the level becomes the *current level* of `CLevelMgr`.

`CEditorMgr::init()` flips the render path so the engine uses `render_editor` instead of `render_play` (`CRenderMgr::ChangeRenderMode(RENDER_MODE::EDITOR)`).

---

## 4. The frame entry — `CEngine::Progress`

Called once per `PeekMessage` idle iteration. It is a clean separation between **CPU simulation** and **GPU recording**:

```cpp
// 1) CPU‑side tick
CTimeMgr::tick();      // dt, FPS
CKeyMgr::tick();       // input edges
CAssetMgr::tick();     // hot reloads
CLevelMgr::tick();     // CLevel::tick() → script tick + finaltick(matrices, frustum)
CCollisionManager::tick();

// 2) GPU recording
DX12Device::BeginFrame();   // §5
CRenderMgr::render();        // §6 + §7
```

`DX12Device::BeginFrame` (`DX12Device.cpp:346`) acquires a `DX12CommandList` from the direct queue, sets the graphics + compute root signatures, sets the viewport / scissor to the current render resolution, syncs the wrapper `DX12RHICommandList`, and **rebinds `RenderTargetTex` to the current back‑buffer index** (triple‑buffered swap chain).

---

## 5. The frame skeleton — `CRenderMgr::render`

```cpp
if (!CLevelMgr::GetCurrentLevel()) return;
m_NumDrawCalls = 0;

ClearRenderTargetSet();   // clear SWAPCHAIN, DEFERRED, DEFERRED_LIGHT, SSAO, SSAO_BLUR
DataBinding();            // upload globals, 2D & 3D light SBs
(this->*RenderFunc)();    // → render_editor
DataClear();              // clear light vectors + unbind PS SRV slots 0..15
```

`DataBinding` packs the per‑frame constants:

- `GLOBAL` constant buffer (`Light2DCount`, `Light3DCount`, time, …) bound to both **VS/PS** and **CS** root parameters.
- 2D and 3D light arrays uploaded into structured buffers and bound at **t15** and **t16** respectively (only when non‑empty).

`DataClear` is critical for safety: it drops the per‑frame light vectors (lights re‑register every frame in `CLight3D::finaltick`) and **unbinds PS SRV slots 0–15** so that the next frame's G‑Buffer pass cannot hit a render‑target‑vs‑SRV hazard from the merge pass.

---

## 6. The 11 passes of `render_editor`

This is the heart of the document. Every step below is one `OMSet` + draw / dispatch group inside `CRenderMgr::render_editor`.

### Pass 0 — Shadow maps (`render_shadowmap`)

For each `CLight3D` whose `GetIsRenderShadow()` is true, call `RenderShadowMap()`:

- Build a snapped orthographic projection (texel snap to kill shimmer).
- Push the **light's** view/proj into `g_Trans`.
- `pLightCam->SortObjects_ShadowMap()` then `render_shadowmap()` issues depth‑only draws into the light's `m_ShadowMapMRT`.

The directional light's shadow map is later sampled in the lighting pass (bound at TEX_4 by `CLight3D::Binding()`).

### Pass 1 — Camera transforms + scene sort

```cpp
g_Trans.matView    = m_EditorCam->GetViewMat();
g_Trans.matViewInv = m_EditorCam->GetViewMatInv();
g_Trans.matProj    = m_EditorCam->GetProjMat();
g_Trans.matProjInv = m_EditorCam->GetProjMatInv();
m_EditorCam->SortObjects();
```

`CCamera::SortObjects()` walks every layer the camera observes, runs **frustum culling** (AABB or bounding sphere) and bins objects per `SHADER_DOMAIN`:
`DOMAIN_DEFFERED`, `DOMAIN_DEFERRED_DECAL`, `DOMAIN_OPAQUE`, `DOMAIN_MASKED`, `DOMAIN_TRANSPARENT`, `DOMAIN_PARTICLE`, `DOMAIN_POSTPROCESS`.

Sub‑meshes can each have a different material, so an object can land in **several** lists at once.

### Pass 2 — Bind IBL

`CIBLManager::Binding()` re‑binds `IBL_BRDFLut` (t5), `IBL_Irradiance` (t7) and `IBL_Prefilter` (t8) for every shader that needs them downstream.

### Pass 3 — Deferred G‑Buffer

```cpp
m_MRT[(UINT)MRT_TYPE::DEFERRED]->OMSet();
m_EditorCam->render_deferred();
```

Each deferred object is rendered with `std3d_deferred_pbr.fx`. The pixel shader writes the standard PBR G‑Buffer:

| RT | Texture            | Contents                                                                |
|----|--------------------|-------------------------------------------------------------------------|
| 0  | `GBuffer_Color`    | Albedo (RGB) — sRGB→linear handled here, multiplied by `baseColorFactor`|
| 1  | `GBuffer_Normal`   | View‑space normal (TBN‑resolved if normal map present)                   |
| 2  | `GBuffer_Position` | View‑space position; `.a = 1.0` flags "geometry written"                |
| 3  | `GBuffer_Emmisive` | Emissive (with `emissiveFactor`)                                        |
| 4  | `GBuffer_CustomData` | `R = Metallic, G = Roughness, B = AO, A = 1.0` (PBR flag)             |

The shader supports both **ORM** (`R=AO,G=Rough,B=Metal`) and **glTF MR** (`G=Rough,B=Metal`) packing via `g_int_2`, alpha cutout via `g_int_0`, and a "linear albedo" path via `g_int_3` — see the header comment in `std3d_deferred_pbr.fx`.

### Pass 4 — Decals

```cpp
m_MRT[(UINT)MRT_TYPE::DEFERRED_DECAL]->OMSet();   // aliases Color + Emissive
m_EditorCam->render_deferred_decal();
```

Decals project onto the existing G‑Buffer color / emissive without rewriting normals or depth.

### Pass 5 — SSAO *(currently disabled)*

`render_ssao()` is wired up but commented out. When enabled it does two full‑screen passes (generation → bilateral blur) over a `RectMesh` and binds the blurred result at **t17** for the lighting pass.

### Pass 6 — Deferred lighting

```cpp
m_MRT[(UINT)MRT_TYPE::DEFERRED_LIGHT]->OMSet();   // → GBuffer_Diffuse + GBuffer_Specular
for (CLight3D* L : m_vecLights3D)
    L->ApplyLighting();
```

`CLight3D::ApplyLighting()` simply binds the light and renders its **volume mesh** (`RectMesh` for directional, sphere for point, etc.). Inside `Binding()`:

- For **directional** lights, the shadow map is bound at TEX_4 and the snapped `view × proj` matrix at `MAT_0`.
- The deferred lighting material is bound, then **IBL is rebound** (the material binding clears unused slots), then **SSAO is rebound** at t17.

The lighting shader reads the G‑Buffer as SRVs and writes diffuse / specular accumulation into `GBuffer_Diffuse` / `GBuffer_Specular`.

### Pass 7 — Merge

```cpp
m_MRT[(UINT)MRT_TYPE::HDR_SCENE]->OMSet();
DeferredMergingMaterial: TEX_0..4 = Color/Diffuse/Specular/Emissive/CustomData
                          TEX_5  = optional debug‑view target
                          INT_0  = debug‑view flag
RectMesh.render();
```

Combines the lit diffuse/specular with base color and emissive into `HDRSceneTex`. If the editor enabled the G‑Buffer debug view (`SetDeferredDebugView`), the shader instead bypasses the math and outputs the user‑selected G‑Buffer texture only.

### Pass 8 — Forward passes

Still bound to `HDR_SCENE` (so forward objects share depth + HDR target with the deferred result):

```cpp
m_EditorCam->render_opaque();
m_EditorCam->render_masked();
m_EditorCam->render_transparent();
m_EditorCam->render_particle();
```

Each one iterates the matching domain list, sets `m_CurRenderDomain`, and calls `GameObject::render()`.

### Pass 9 — Tone mapping (HDR → LDR back buffer)

```cpp
m_MRT[(UINT)MRT_TYPE::SWAPCHAIN]->OMSet();
ToneMappingMaterial: TEX_0   = HDRSceneTex
                     FLOAT_0 = 0.6   // Exposure
                     INT_0   = 0     // 0 = ACES, 1 = Reinhard, 2 = Uncharted2
RectMesh.render();
```

This is the first time the swapchain back buffer is written this frame.

### Pass 10 — Post‑process

`CCamera::render_postprocess()` does:

1. `CRenderMgr::CopyRenderTarget()` — copies `RenderTargetTex` → `RenderTargetTexCopy` so post‑process shaders can sample the previous output.
2. Iterates `m_vecPostProcessObjects` and renders each.

### Pass 11 — Cleanup

```cpp
CIBLManager::Clear();                         // unbind t5, t7, t8
m_MRT[(UINT)MRT_TYPE::SWAPCHAIN]->OMSet();   // back buffer was COPY_SOURCE; transition back
                                              // so CDbgRenderMgr / ImGui can draw on top
```

After `render_editor` returns, control falls back to `CRenderMgr::render` which calls `DataClear()` (§5) and the engine moves on to `CTaskMgr::tick()` for queued asset/object operations.

---

## 7. Editor + ImGui overlay

Back in `wWinMain`, after `CEngine::Progress`:

- `CEditorMgr::tick()` draws gizmos / outliner / debug widgets onto the back buffer.
- `CImGuiMgr::tick()` records the ImGui draw list onto the same back buffer (using `ImGui_ImplDX12`).
- `CAssetMgr::ClearAssetsChangedFlag()` resets per‑frame asset dirty bits.

Because Pass 11 has just transitioned the back buffer back to `RENDER_TARGET`, all of this just works as a normal additional draw on top of the tone‑mapped scene.

---

## 8. Frame submission — `DX12Device::Present`

The last call of every iteration. From `DX12Device.cpp:153`:

1. Transition the current back buffer to `D3D12_RESOURCE_STATE_PRESENT`.
2. `commandQueue->ExecuteCommandList(m_CurrentCmdList)` — submit everything that was recorded since `BeginFrame`.
3. **Detach** the wrapper `DX12RHICommandList` from the executed CL (prevents the same CL from being submitted twice through `Resize → Flush`).
4. `m_SwapChain->Present(syncInterval, presentFlags)` — flip; tearing is allowed when VSync is off.
5. Signal a fence value, advance `m_CurrentBackBufferIndex`, and **wait for the new back buffer's previous fence** to make sure the GPU is done with it.
6. `++ms_FrameCount; ReleaseStaleDescriptors(ms_FrameCount);` — recycle descriptor heap slots whose owning frame has retired.

The next iteration of the message loop then starts the cycle again at `CEngine::Progress`.

---

## 9. Resize handling (sidebar)

`WM_EXITSIZEMOVE` / `WM_SIZE` (in `main.cpp`) call `CRenderMgr::Resize(w, h)` which:

1. `SetResizing(true)` → `CEngine::Progress` short‑circuits (no rendering during resize).
2. `Flush()` the GPU.
3. Delete every `CRenderTargetSet` and every G‑Buffer / HDR / depth texture from `CAssetMgr`.
4. `g_pRHIDevice->ResizeSwapChain(w, h)` — DXGI `ResizeBuffers` + new viewport + new back‑buffer textures.
5. Rebuild every MRT via `CreateRenderTargetSet()` (§2.1a).
6. `SetResizing(false)`.

---

## 10. End‑to‑end frame timeline (one picture)

```
CPU                                            GPU
───                                            ───
CTimeMgr/Key/Asset/Level/Collision tick
DX12Device::BeginFrame  ────────────────▶ acquire CL, set RS+VP, rotate back buffer
CRenderMgr::render
 ├─ ClearRenderTargetSet                ──▶ clear SWAPCHAIN/DEFERRED/LIGHT/SSAO
 ├─ DataBinding (CB+SBs)                ──▶ upload globals + light arrays
 └─ render_editor
     0  shadow maps                     ──▶ depth‑only draws into shadow MRTs
     1  sort objects (CPU)
     2  IBL bind
     3  G‑Buffer pass                   ──▶ Color / Normal / Position / Emissive / CustomData
     4  Decal pass                      ──▶ Color + Emissive (alias)
     5  (SSAO — disabled)
     6  Lighting pass                   ──▶ Diffuse + Specular accumulation
     7  Merge pass (full‑screen quad)   ──▶ HDRSceneTex
     8  Forward (opaque/masked/trans/particle)
     9  Tone mapping (HDR → LDR)        ──▶ SWAPCHAIN back buffer
     10 Post‑process (+ CopyRenderTarget)
     11 Clear IBL + rebind SWAPCHAIN
CEditorMgr::tick + CImGuiMgr::tick      ──▶ overlay onto back buffer
DX12Device::Present                     ──▶ transition→PRESENT, submit, flip, fence wait
```

That is exactly what happens, every ~16 ms, when `CTestLevel3D` is the active level and the engine is in editor mode.

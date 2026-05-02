# YannEngine — Engineering Highlights

> A custom C++ game/rendering engine built from scratch as a portfolio project for tech‑art / graphics‑programming roles.
> Targets Windows + Direct3D 12 (with a parallel Direct3D 11 path) through a thin custom RHI.
>
> Code lives under `Project/Engine/` (engine), `Project/Client/` (host app + editor + ImGui) and `Project/Scripts/` (gameplay).

---

## 1. Architecture at a glance

- **Custom RHI abstraction** (`Project/Engine/RHI/`)
  - `IRHIDevice`, `IRHICommandList`, `IRHITexture`, `IRHIBuffer`, `IRHIPipelineState`, `IRHIGraphicsShader`, `IRHIComputeShader`.
  - Two concrete back‑ends behind the same interface, switched at compile time with `USE_DX12` / `USE_DX11`:
    - **DX12** (`Project/Engine/DX12/…`) — primary path.
    - **DX11** (`Project/Engine/DX11/…`) — legacy path kept working as a sanity check on the abstraction.
- **Manager singletons** (`CEngine::Init` order):
  `CPathMgr → CTimeMgr → CKeyMgr → CAssetMgr → CRenderMgr → CLevelMgr → CCollisionManager → CTaskMgr` (+ `CFontMgr` on DX11).
- **Scene model:** `CLevel` → 32 `CLayer`s → `CGameObject`s composed of `CComponent`s (`CTransform`, `CMeshRenderer`, `CCamera`, `CLight3D`, `CLight2D`, `CCollider2D`, `CParticleSystem`, `CDecal`, `CSkyBox`, `CBoundingBox`, `CScript`…).
- **Asset system** (`CAssetMgr`) with reference counting (`Ptr<>`), hot‑reload flag, and FBX/glTF mesh import via Assimp (`CModelImporter`).
- **Editor + ImGui overlay** (`Project/Client/ImGui/`) running on top of every frame, gated by `GAME_RELEASE`.

---

## 2. DX12 backend — what was built by hand

Everything below sits in `Project/Engine/DX12/`. The point of this section is that the DX12 plumbing is not "wrap a tutorial": it is a self‑contained mini‑framework.

| System                                 | Files                                                                 | What it does |
|----------------------------------------|-----------------------------------------------------------------------|--------------|
| Device, swap chain, frame fences       | `DX12Device.{h,cpp}`                                                  | Triple‑buffered swap chain with tearing support, per‑frame fences, back‑buffer rotation, viewport/scissor management, `BeginFrame`/`Present` cycle. |
| Command queues + lists                 | `DX12CommandQueue.{h,cpp}`, `DX12CommandList.{h,cpp}`                 | Direct/Compute/Copy queues; pooled command lists; `Flush`, `Signal`, `WaitForFenceValue`. |
| Resource state tracking                | `DX12ResourceStateTracker.{h,cpp}`                                    | Per‑resource and per‑subresource state machine with **pending barrier resolution** at command‑list submit (the standard "two‑pass" trick). |
| Descriptor heap allocators             | `DX12DescriptorAllocator(Page).{h,cpp}`, `DX12DescriptorAllocation.*` | CPU descriptor heap pages with free‑list, frame‑deferred release (`ReleaseStaleDescriptors`). |
| Dynamic shader‑visible heap            | `DX12DynamicDescriptorHeap.{h,cpp}`                                   | Stages CBV/SRV/UAV/sampler descriptors per draw and copies them into the GPU‑visible heap on commit. |
| Root signatures                        | `DX12RootSignature.{h,cpp}`                                           | Shared graphics + compute root signatures created once at device init. |
| PSO cache                              | `DX12PipelineState.{h,cpp}`                                           | PSO objects keyed off shader + render‑state. |
| Buffer types                           | `DX12VertexBuffer`, `DX12IndexBuffer`, `DX12ConstantBuffer`, `DX12StructuredBuffer`, `DX12ByteAddressBuffer`, `DX12UploadBuffer` | Typed buffers with upload/default heap split. |
| Texture + RT                           | `DX12Texture`, `DX12RenderTarget`, `DX12RHITexture`                   | UAV/SRV/RTV/DSV view caching, mip handling, “create from existing” for back‑buffer wrapping. |
| Helper PSOs                            | `DX12GenerateMipsPSO`, `DX12PanoToCubemapPSO`                         | Stand‑alone compute PSOs for utility work. |
| RHI bridge                             | `DX12RHICommandList`, `DX12RHIBuffer`, `DX12RHITexture`               | Adapts the DX12 objects to the engine‑level `IRHI*` interfaces. |

Notable correctness work shipped during development:
- Triple‑buffered back buffer is **rebound to the asset name `RenderTargetTex` every `BeginFrame`**, so the rest of the engine doesn’t need to know about back‑buffer rotation.
- `Present` detaches the wrapper command list after submit so a `Resize → Flush` path cannot double‑submit the same CL.
- After every frame, `CRenderMgr::DataClear` unbinds PS SRV slots 0–15 to prevent the classic deferred‑renderer **render‑target‑vs‑SRV hazard** when next frame’s G‑Buffer pass reuses those textures as RTs.

---

## 3. Renderer

A **physically‑based deferred renderer with a forward path layered on top**, all driven by a single `CRenderMgr` and a per‑frame `MRT_TYPE` table. The full editor frame walks 11 GPU passes (see *“How a frame is rendered in YannEngine”*).

### 3.1 Multi‑Render‑Target sets (`CRenderMgr_Init.cpp`)

| MRT             | Targets                                                                                                                                       |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `SWAPCHAIN`     | back buffer (R8G8B8A8) + D24S8                                                                                                                |
| `DEFERRED`      | `Color` (R16G16B16A16F), `Normal` (R32×4F), `Position` (R32×4F), `Emissive` (R32×4F), `CustomData` (R32×4F = M/R/AO/flag) + shared D24S8       |
| `DEFERRED_DECAL`| aliases `Color` + `Emissive` so decals modify only those channels                                                                              |
| `SSAO`/`SSAO_BLUR` | R8_UNORM, cleared to white so ambient ≠ 0 when SSAO is off                                                                                 |
| `DEFERRED_LIGHT`| `Diffuse` + `Specular` accumulation (R32×4F)                                                                                                  |
| `HDR_SCENE`     | R16G16B16A16F + shared D24S8 — receives merge + forward + transparency                                                                         |

### 3.2 PBR G‑Buffer (`std3d_deferred_pbr.fx`)

Metal/rough PBR shader designed to consume real DCC assets without per‑texture conversion code:

- Albedo with optional sRGB→linear (skip flag for already‑linear textures), `baseColorFactor` multiplier.
- Tangent‑space normal mapping with a **TBN** built from interpolated tangent/binormal/normal in view space, plus a flip‑Y switch.
- **Two ORM packing modes** selectable per material:
  - Unreal `ORM` (R=AO, G=Rough, B=Metal),
  - glTF `MR` (G=Rough, B=Metal, no AO).
- Alpha cutout (`MASK` domain) using `clip()` against `albedo.a * baseColorFactor.a`.
- Emissive map with `emissiveFactor`, sRGB→linear handled.
- Roughness clamped to `[0.04, 1]`, metallic saturated.
- Outputs five render targets in one draw — view‑space normal/position avoids matrix re‑multiplication in the lighting pass.

### 3.3 Deferred lighting (`deferred_lighting.fx`, `CLight3D::ApplyLighting`)

- One **draw per light**, light‑volume meshes (`RectMesh` for directional, sphere for point, cone for spot).
- Reads the G‑Buffer via SRVs, writes diffuse + specular into separate RTs (allows debug views and selective post effects).
- Cook‑Torrance BRDF (GGX + Smith + Schlick‑Fresnel).
- Lighting buffer: 3D light array uploaded to a **structured buffer at t16** every frame; per‑light index passed via `INT_0`.
- Directional lights bind their **PCF shadow map at TEX_4** plus the snapped `view×proj` matrix at `MAT_0`.
- Optionally consumes the SSAO blur target at **t17**.
- Re‑binds **IBL SRVs after material binding** (the material binder clears unused slots), keeping `t5/t7/t8` valid for the lighting shader.

### 3.4 Image‑Based Lighting (`CIBLManager`, `ibl_*_cs.fx`, `brdf_lut_cs.fx`)

A complete from‑equirect IBL pipeline, all **GPU compute**, all done at load time:

1. **`EquirectToCubeCS`** — projects an HDR equirectangular into a 1024² R16G16B16A16F cubemap.
2. **`GenMipsCubemapCS`** — builds the env‑cubemap mip chain through a scratch cubemap to avoid SRV/UAV aliasing.
3. **`IBLIrradianceCS`** — convolves to a 32² diffuse irradiance cubemap (Lambertian).
4. **`IBLPrefilterCS`** — split‑sum specular pre‑integration, 256² with 5 mips, importance‑sampled GGX (per‑mip roughness).
5. **`BRDFLutCS`** — bakes the 512² R16G16 split‑sum BRDF LUT once at engine init.

Bound globally to `t5` (BRDF LUT), `t6` (env), `t7` (irradiance), `t8` (specular prefilter) so any shader can sample IBL without per‑material plumbing.

### 3.5 Decals (`deferred_decal.fx`, `CDecal`)

Screen‑space deferred decals projected after the G‑Buffer pass; the decal MRT *aliases* `Color` and `Emissive` so projection‑driven changes only touch those channels and don’t corrupt normals/positions.

### 3.6 Shadow mapping (`shadowmap.fx`, `CLight3D::RenderShadowMap`)

- Directional shadow maps with **texel‑snapped orthographic projection** (kills shimmer when the camera moves).
- A separate per‑light "shadow camera" runs `SortObjects_ShadowMap` + a depth‑only `render_shadowmap` pass into the light’s own depth target.
- Sample‑side filtering done in the deferred lighting shader.

### 3.7 SSAO (wired, currently off — `ssao.fx`, `ssao_blur.fx`)

Two‑pass screen‑space AO over a noise texture, followed by a bilateral blur, result bound to `t17` for the lighting pass.

### 3.8 Merge + Forward + Tone‑map (`deferred_merging.fx`, `tonemapping.fx`)

- **Merge pass** combines deferred diffuse/specular with base color and emissive into `HDR_SCENE`. A **G‑Buffer debug view** mode lets the editor pipe any single G‑Buffer texture straight to the screen.
- **Forward pass** for `OPAQUE`/`MASKED`/`TRANSPARENT`/`PARTICLE` domains shares the HDR target + depth so things like the glass shader (`std3d_forward_pbr_glass.fx`) integrate naturally with the deferred result.
- **Tone mapping** does HDR→LDR into the swap‑chain back buffer with selectable operator (`0 = ACES`, `1 = Reinhard`, `2 = Uncharted2`) and exposure scalar.

### 3.9 Post‑process

`CCamera::render_postprocess` copies `RenderTargetTex → RenderTargetTexCopy` (`CRenderMgr::CopyRenderTarget`) so post FX can sample the pre‑post image while writing back to the swap chain.

### 3.10 Skybox (`skybox.fx`, `CSkyBox`)

Cubemap skybox driven by the same env cubemap that feeds IBL — one source of truth for lighting + background.

### 3.11 Particles (`particle.fx`, `particletick.fx`, `CParticleSystem`, `CParticleTickCS`)

GPU particle system: per‑frame **compute‑shader tick** updates the particle buffer in place; render pass draws from the same buffer. Lives in the `PARTICLE` domain so it shares the HDR pipeline.

### 3.12 Frustum culling + sub‑mesh sort (`CCamera::SortObjects`, `CFrustum`)

- Per‑object AABB / bounding‑sphere frustum test using `CBoundingBox` data baked at import time.
- An object can land in **multiple domain buckets at once** because each sub‑mesh can have a different material (e.g. a model with both opaque stone and transparent glass sub‑meshes correctly hits both passes).
- Camera priority ordering with collision detection (asserts on duplicate priorities).

---

## 4. Material system

- **`CShader` / `CGraphicsShader` / `CComputeShader`** — compiled shader objects with explicit pipeline state (`SHADER_DOMAIN`, blend, depth, rasterizer, topology).
- **`SHADER_DOMAIN`** — render‑graph routing tag (`DEFFERED`, `DEFERRED_DECAL`, `OPAQUE`, `MASKED`, `TRANSPARENT`, `PARTICLE`, `POSTPROCESS`).
- **`CMaterial`** — holds the shader, four texture slots (`TEX_0..N`) and named scalar slots (`INT_0..3`, `FLOAT_0..3`, `VEC4_0..3`, `MAT_0..3`) wired to a per‑material constant buffer.
- **`CMaterialInstance`** — UE‑style parent/instance: only stores *overrides*; everything not overridden inherits from the parent. The test scene uses this heavily (`CTestLevel3D` builds one parent `Std3DDeferredPBRMaterial` and dozens of instances per surface type).
- Asset hot‑reload through `CAssetMgr::tick` + per‑asset *changed* flag.

---

## 5. Compute shaders (`Project/Engine/`, *.fx + matching `C*CS.h`)

| CS                          | Purpose                                                            |
|-----------------------------|--------------------------------------------------------------------|
| `EquirectToCubeCS`          | HDR equirect → cubemap                                             |
| `GenMipsCubemapCS`          | Cubemap mip chain (with scratch swap to avoid SRV/UAV aliasing)    |
| `GenMipsTexture2DCS`        | 2D mip generation                                                  |
| `IBLIrradianceCS`           | Diffuse irradiance convolution                                     |
| `IBLPrefilterCS`            | Specular prefilter (split‑sum, importance‑sampled GGX, per‑mip)    |
| `BRDFLutCS`                 | Split‑sum BRDF LUT bake                                            |
| `ParticleTickCS`            | GPU particle simulation                                            |

All driven through the same RHI `IRHIComputeShader` interface so they work on both backends.

---

## 6. Scene + gameplay scaffolding

- **Component framework** (`CComponent`, `components.h`): `CTransform`, `CMeshRenderer`, `CCamera`, `CLight2D/3D`, `CCollider2D`, `CParticleSystem`, `CDecal`, `CSkyBox`, `CBoundingBox`, `CAnimator2D`, `CTileMap`, `CScript` …
- **Script base** (`CScript`) with project‑side concrete scripts (`CPlayerScript`, `CMonsterScript`, `CCameraMoveScript`, `CDirLightScript`).
- **Level (de)serialization** — `CCamera::SaveToLevelFile / LoadFromLevelFile` style, used by the editor.
- **Prefabs** (`CPrefab`) — clonable game‑object templates.
- **2D collision** (`CCollisionManager`, `CCollider2D`) with layer matrix.
- **Per‑frame timing** (`CTimeMgr`) and edge‑detected input (`CKeyMgr`).
- **Task manager** (`CTaskMgr`) for deferred/cross‑frame engine operations.

---

## 7. Editor

`Project/Client` hosts the editor:
- **Dear ImGui** integrated through both the Win32 + DX12 (and DX11) backends.
- **Editor camera** (`RegisterEditorCamera`) drives `render_editor` instead of game cameras (`render_play`).
- **G‑Buffer debug view** — `SetDeferredDebugView(bool, RT)` lets the editor pipe any single G‑Buffer (Color / Normal / Position / Emissive / CustomData) directly through the merge shader to the back buffer.
- Built‑in **draw‑call counter, FPS readout and camera‑position HUD** (`display_numdrawcalls`, `display_fps`, `display_camerapos`).
- **Bounding‑box debug rendering** toggle (`SetShowBoundingBox`).
- Live **window resize** path (`CRenderMgr::Resize`) that flushes the GPU, tears down all MRTs/G‑Buffer textures, calls `ResizeSwapChain`, and rebuilds them — no leaks, no flicker.

---

## 8. Asset / content pipeline

- **Assimp** (`External/assimp`) integrated through `CModelImporter` to load FBX / glTF meshes, materials and skeletons.
- Texture loading (DDS / PNG / JPG / HDR) through DirectXTex, with HDR equirect feeding the IBL pipeline.
- Mesh sub‑material support so a single FBX can carry multiple PBR materials per sub‑mesh.

---

## 9. Things that make it portfolio‑worth (TL;DR for a recruiter)

- **Two RHI backends behind one interface (DX12 primary, DX11 reference).** Demonstrates API abstraction and the ability to ship a non‑trivial DX12 stack (descriptor heaps, dynamic heap, resource state tracker, root sigs, fences, triple buffering).
- **From‑scratch deferred PBR renderer with IBL.** Five‑target G‑Buffer, light‑volume deferred lighting, split‑sum IBL baked entirely on the GPU at load, ACES/Reinhard/Uncharted2 tone mapping, HDR pipeline.
- **Render graph in spirit, not in name.** A deterministic 11‑pass editor frame with explicit MRT routing, sub‑mesh domain sorting, and forward + transparency layered on top of the deferred result.
- **Production‑style material system.** Parent material + material‑instance overrides, hot‑reload, glTF *and* Unreal ORM packing supported in the same shader.
- **Tooling.** Editor with ImGui, G‑Buffer debug views, draw‑call/FPS HUDs, live window resize.
- **Real DX12 hazard handling.** Per‑frame SRV slot clearing to avoid RT/SRV aliasing, scratch‑cubemap mip generation to avoid UAV aliasing, command‑list detach in `Present` to prevent double‑submit on resize.
- **GPU compute used for what it’s good at.** IBL convolution, BRDF LUT, mip generation, particle simulation — not just graphics on the graphics queue.

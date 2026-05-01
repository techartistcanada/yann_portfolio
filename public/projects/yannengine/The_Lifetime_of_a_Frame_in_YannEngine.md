# The Lifetime of a Frame in YannEngine

> 一个像素是怎么诞生的?——以 `CTestLevel3D` 为出发点,完整追踪一帧从 `wWinMain` 到 `Present()` 的旅程。

YannEngine 是一个支持 DX11/DX12 双 RHI 的延迟渲染引擎。它的渲染流水线以 PBR + IBL 为核心,辅以 SSAO、Cascade-less Shadow Map、HDR Tone Mapping 与 Forward 透明叠加。本文以 `Project/Client/CTestLevel3D.cpp` 中搭建的 Sponza 场景为案例,把"打开窗口 → 看见图像"这条路一寸一寸走完。

---

## 0. 故事开始的地方:`wWinMain`

入口在 `Project/Client/main.cpp`。这里只做了三件事:

1. 注册 Win32 窗口类、`CreateWindowW` 创建主窗口。
2. `CEngine::GetInst()->Init(hWnd, Vec2(1280, 720))` —— 引擎自启动。
3. `CTestLevel3D::CreateTestLevel()` —— 把场景塞进 `CLevel`,然后进入消息循环。

```cpp
// main.cpp:110
while (true)
{
    if (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) { /* 处理消息 */ }
    else
    {
        if (!RHI_DEVICE->IsResizing())
        {
            CEngine::GetInst()->Progress();   // 一帧的全部逻辑 + 渲染
            CEditorMgr::GetInst()->tick();
            CImGuiMgr::GetInst()->tick();
            RHI_DEVICE->Present();            // 把后缓冲递给 DXGI
        }
    }
}
```

一帧 = `Progress()` + `Present()`。`Progress()` 里再分 "Tick"(逻辑) 和 "Render"(渲染)。

---

## 1. 启动一次性的初始化:`CEngine::Init`

`CEngine::Init` 在每个进程生命周期里只跑一次,但它决定了之后每一帧能用什么资源。

### 1.1 创建 RHI 设备

`Project/Engine/CEngine.cpp:60` 根据宏开关二选一:

```cpp
#ifdef USE_DX12
    g_pRHIDevice = DX12Device::GetInst();
    DX12Device::GetInst()->init(m_hMainHwnd, m_Resolution);
#else
    g_pRHIDevice = DX11Device::GetInst();
    DX11Device::GetInst()->init(...);
#endif
```

以 DX12 路径为例(`DX12Device::init`,`DX12Device.cpp:41`),它依次完成:

| 步骤 | 做了什么 |
|------|---------|
| 1 | 启用 D3D12 Debug Layer(Debug 构建) |
| 2 | 枚举显存最大的硬件 Adapter,创建 `ID3D12Device2` |
| 3 | 创建 `DIRECT / COMPUTE / COPY` 三条 `DX12CommandQueue` |
| 4 | 创建 SwapChain(`DXGI_SWAP_EFFECT_FLIP_DISCARD`,3-back-buffer,允许 Tearing) |
| 5 | 为四种描述符堆类型各分配一个 `DX12DescriptorAllocator`,并预创建 Null SRV/UAV(防止未绑定槽报错) |
| 6 | 把三张 BackBuffer 资源注册进 `ResourceStateTracker`,并把当前 BackBuffer 包装成 `CTexture(L"RenderTargetTex")` —— 引擎层后续就只认这个名字 |
| 7 | 创建 Graphics / Compute Root Signature(布局见下) |
| 8 | 创建 4 个全局常量缓冲区 `tTransform / tMaterialConst / tAnim2DInfo / tGlobalData` |
| 9 | 实例化 `DX12RHICommandList`(对外暴露的 `IRHICommandList*`) |
| 10–11 | 预生成所有光栅化、深度模板、混合状态的 `D3D12_*_DESC` 模板,供 PSO 装配复用 |

Root Signature 的布局是整套渲染的"宪法":

```
[0] CBV b0 — TRANSFORM     (W/V/P 等矩阵)
[1] CBV b1 — MATERIAL      (vec4_*, float_*, int_*, bTex[])
[2] CBV b2 — ANIMATION
[3] CBV b3 — GLOBAL DATA   (vResolution, lightCount, time...)
[4] Descriptor Table — 32 SRVs (t0–t31)
[5] Descriptor Table — 8 UAVs  (u0–u7)
Static Samplers: s0 aniso/wrap, s1 point/wrap, s2 linear/clamp
```

所有 Shader 共用同一个 Root Signature —— 这是 DX12 端做"DX11 风格命名绑定"的关键:t0–t31 是固定语义槽(`g_tex_0..g_tex_31` / `g_texcube_0..`),材质和管线只需要往这些槽里塞 SRV。

### 1.2 创建各路 Manager

```cpp
CPathMgr::init();   CTimeMgr::init();   CKeyMgr::init();
CAssetMgr::init();  CRenderMgr::init(); CLevelMgr::init();
```

其中 `CAssetMgr::init` 会注册引擎内置资产 —— Mesh(`RectMesh / SphereMesh / ConeMesh / CubeMesh`)、Shader(`Std3DDeferredPBRShader / DeferredDirLightingShader / SSAOShader / ToneMappingShader / IBL 计算着色器...`)、默认材质(`Std3DDeferredPBRMaterial / DeferredDirLightingMaterial / SSAOMaterial / SSAOBlurMaterial / DeferredMergingMaterial / ToneMappingMaterial`)。

### 1.3 `CRenderMgr::init`:搭建 7 个 MRT

`CRenderMgr_Init.cpp` 一次性创建后续每帧都要复用的 7 个 `CRenderTargetSet`:

| MRT | 颜色目标 | 格式 | 用途 |
|-----|---------|------|------|
| `SWAPCHAIN` | RenderTargetTex | R8G8B8A8_UNORM | 最终呈现到窗口 |
| `DEFERRED` | Color / Normal / Position / Emissive / CustomData(5 张) | RGBA16F + RGBA32F×4 | G-Buffer |
| `SSAO` | SSAOTexture | R8_UNORM | SSAO 原始 AO |
| `SSAO_BLUR` | SSAOBlurTex | R8_UNORM | 双边模糊后的 AO |
| `DEFERRED_LIGHT` | GBuffer_Diffuse / GBuffer_Specular | RGBA32F×2 | 累计直接光照 + IBL |
| `DEFERRED_DECAL` | GBuffer_Color / GBuffer_Emissive | (复用 G-Buffer) | Decal 在 G-Buffer 上盖章 |
| `HDR_SCENE` | HDRSceneTex | RGBA16F | Merge 后的 HDR + Forward 通道目标 |

> G-Buffer Position 用 `R32G32B32A32_FLOAT` 直接存视空间坐标 —— 简单直观,但代价是带宽,后续优化方向是从深度重建。

### 1.4 `CIBLManager::init`:把 BRDF LUT 烘出来

`CIBLManager::init` 抓取 5 个 IBL 计算着色器(`EquirectToCubeCS / IBLIrradianceCS / IBLPrefilterCS / BRDFLutCS / GenMipsCubemapCS`),然后:

```cpp
DX12Device::GetInst()->BeginFrame();   // 开一条 CL
GenerateBRDFLut();                     // 512x512 RG16F,view-independent
DX12Device::GetInst()->EndFrame();     // 提交 + WaitForFenceValue
```

BRDF LUT 与具体环境无关,只与 `(NdotV, roughness)` 有关,**整个进程只算一次**。Irradiance Map 与 Prefilter Map 要等到 SkyBox 设置贴图时才生成(下一节)。

---

## 2. 场景搭建:`CTestLevel3D::CreateTestLevel`

回到 `Project/Client/CTestLevel3D.cpp`。这是用户视角能修改最多的地方,也是引擎"输入"的来源。

### 2.1 Layer 与 Object

```cpp
CLevel* pLevel = new CLevel;
pLevel->GetLayer(0)->SetName(L"Default");
pLevel->GetLayer(1)->SetName(L"Player");
pLevel->GetLayer(2)->SetName(L"Monster");
```

`CLevel` 内部有 `MAX_LAYER`(32) 个 `CLayer`,每个 Layer 持有一组 `CGameObject*`。`CCamera::m_LayerCheck` 是一个位图,决定相机看哪几层 —— `CCamera::SortObjects` 就靠它筛选物体。

### 2.2 Directional Light

```cpp
CGameObject* pLight = new CGameObject;
pLight->AddComponent(new CTransform);
pLight->AddComponent(new CLight3D);
pLight->Light3D()->SetLightType(LIGHT_TYPE::DIRECTIONAL);
pLight->Light3D()->SetIsRenderShadow(true);
pLight->Transform()->SetRelativePos(Vec3(-157.f, 1916.f, -88.f));
pLight->Transform()->SetRelativeRotation(Vec3(XM_PI / 3.f, 0.f, 0.f));
```

`CLight3D::SetLightType(DIRECTIONAL)`(`CLight3D.cpp:155`)有副作用:

- 把光体网格设为 `RectMesh`(全屏 quad);
- 把延迟光照材质指向 `DeferredDirLightingMaterial`(对应 `deferred_lighting.fx` 的 `VS_DirLight / PS_DirLight`);
- 创建 ShadowMap 专用的 `CRenderTargetSet`(2048×2048 R32_FLOAT + D24S8),clear color 设为 1(最大深度);
- 给该光准备一个独立 `CCamera` —— `m_LightCamObj`,投影类型为正交,负责 ShadowMap 渲染。

### 2.3 Sponza Knight 与 PBR Material Instance

`pSponzaKnight` 上挂 `CTransform / CMeshRenderer / CBoundingBox`,网格走 Assimp 加载。多 SubMesh(7 段)分别赋 7 个 `CMaterialInstance`,共享同一个 `Std3DDeferredPBRMaterial` 的 Shader 与默认参数,只覆写贴图与标量:

```cpp
CMaterialInstance* pMI_Armor = new CMaterialInstance;
pMI_Armor->SetParentMaterial(pPBRParent);
pMI_Armor->SetScalarOverride(SCALAR_PARAM::INT_3, 1);    // TEX_0 已是线性空间
pMI_Armor->SetTexOverride(TEX_PARAM::TEX_0, texMetalD);  // BaseColor
pMI_Armor->SetScalarOverride(SCALAR_PARAM::FLOAT_0, 1.0f);  // metallic
pMI_Armor->SetScalarOverride(SCALAR_PARAM::FLOAT_1, 0.3f);  // roughness
pSponzaKnight->MeshRenderer()->SetMaterial(pMI_Armor, 0);
```

`SCALAR_PARAM::INT_2` 用于切换 ORM 和 glTF MR 打包格式,`INT_3` 控制是否跳过 sRGB→linear。这些 int / float 槽位的语义在 `std3d_deferred_pbr.fx` 的注释顶部已经写明。

### 2.4 SkyBox + IBL 触发

```cpp
pSkyBox->SkyBox()->SetSkyBoxType(SKYBOX_TYPE::SPHERE);
pSkyBox->SkyBox()->SetSkyBoxTexture(
    CAssetMgr::GetInst()->Load<CTexture>(L"plains_sunset_4k",
                                         L"texture\\SkyBox\\venice_sunset_4k.hdr"));
```

`CSkyBox::SetSkyBoxTexture`(`CSkyBox.cpp:47`)对 `SPHERE` 类型(equirect HDR)会 **同步** 地启动 IBL 离线烘焙:

```cpp
DX12Device::GetInst()->BeginFrame();
CIBLManager::GetInst()->GenerateFromEquirect(m_SkyBoxTexture);
DX12Device::GetInst()->EndFrame();   // ExecuteCommandList + Wait
```

`GenerateFromEquirect` 内部一气呵成跑完 4 步 Compute:

1. `CEquirectToCubeCS` — 1024² ×6 面 RGBA16F 立方体贴图,带完整 mip 链;
2. `CGenMipsCubemapCS` — 手动生成 mip(替代 DX11 的硬件 GenerateMips);
3. `CIBLIrradianceCS` — 卷积成 32² 的辐照度 Cubemap(漫反射 IBL);
4. `CIBLPrefilterCS` — 256² 5 mip 的预过滤 Cubemap(各 mip 对应不同 roughness);

烘焙完毕后 `m_bReady = true`,后续每帧 `Binding()` 会把它们 bind 到 t5(BRDF LUT)、t7(Irradiance)、t8(Prefilter)。

### 2.5 Sponza & Sponza Curtains

```cpp
CGameObject* pSponza = CModelImporter::Load(L"mesh\\sponza\\NewSponza_Main_glTF_003.gltf");
pSponza->Transform()->SetRelativeScale(Vec3(100.f, 100.f, 100.f));
pLevel->AddObject(0, pSponza);
```

`CModelImporter::Load` 读 glTF,递归创建 `CGameObject` 树,自动按材质拆分 SubMesh,并为每个 SubMesh 实例化好 PBR 材质 —— 用户不需要手动写贴图绑定。

最后 `ChangeLevel(pLevel, LEVEL_STATE::STOP)` 把 level 推送给 `CLevelMgr`。`STOP` 状态意味着脚本不 tick,但 `finaltick / 渲染` 全套照走 —— 这是编辑器模式的默认。

---

## 3. 一帧的 Tick 阶段:`CEngine::Progress`

```cpp
// CEngine.cpp:91
void CEngine::Progress()
{
    CTimeMgr::tick();      // 累加 dt,计 FPS
    CKeyMgr::tick();       // 拉一次 GetAsyncKeyState
    CAssetMgr::tick();     // hot-reload(检测文件改动)
    CLevelMgr::tick();     // ★ Level → Layer → Object → Component 的两段式 tick
    CCollisionManager::tick();

#ifdef USE_DX12
    DX12Device::GetInst()->BeginFrame();
#endif
    CRenderMgr::GetInst()->render();
    CTaskMgr::tick();
}
```

`CLevelMgr::tick` 内部分两段:

```cpp
m_CurLevel->tick();              // (PLAY 状态) 调脚本 tick
m_CurLevel->ClearRegisteredObjects();
m_CurLevel->finaltick();         // 永远走 —— 更新矩阵 / 注册到 Camera 与 RenderMgr
```

`CCamera::finaltick`(`CCamera.cpp:59`)在这里完成:

1. 用 `Transform` 的 R/U/F 装出旋转矩阵,合成 `m_matView` 和 `m_matViewInv`;
2. 透视/正交 + `m_FOV / m_AspectRatio / m_Far` 算 `m_matProj` + 逆;
3. `m_Frustum.finaltick()` 把 6 个平面方程更新好,供 `SortObjects` 阶段做 AABB/Sphere 剔除。

`CLight3D::finaltick`(`CLight3D.cpp:52`)做的事:

- 把 `WorldPos / WorldDir` 同步进 `tLightInfo`;
- `RegisterLight3D` 把自己塞进 `CRenderMgr::m_vecLights3D`;
- 把灯光 `Transform` **拷贝**到自带的 ShadowMap 相机,然后 `finaltick` 一次该相机。

到 `BeginFrame` 调用前,所有"逻辑面"已经定型:相机、灯、物体的世界变换矩阵全是新的;待渲染队列一片空白,等着 `render()` 来扫场。

### 3.1 `DX12Device::BeginFrame`

```cpp
m_CurrentCmdList = commandQueue->GetCommandList();   // 从 pool 复用一条 CL
m_CurrentCmdList->SetComputeRootSignature(...);
m_CurrentCmdList->SetGraphicsRootSignature(...);
m_CurrentCmdList->SetViewport(vp);
m_CurrentCmdList->SetScissorRect(sr);
static_cast<DX12RHICommandList*>(m_pCommandList)->SetCommandList(m_CurrentCmdList);

// ★ 关键: 把 "RenderTargetTex" 重新指向当前 BackBuffer
ComPtr<ID3D12Resource> currentBB = m_BackBufferTextures[m_CurrentBackBufferIndex].GetD3D12Resource();
static_cast<DX12RHITexture*>(pRTTex->GetRHITexture())->CreateFromExisting(
    currentBB, RHI_BIND_FLAG::RENDER_TARGET);
```

最后那一步是 DX12 端 Triple-buffering 的精髓:引擎层面只认一张 `RenderTargetTex`,但每帧它的底层 `ID3D12Resource` 会跟着 `m_CurrentBackBufferIndex` 滚动。所有 MRT、所有材质都不用感知这件事。

---

## 4. `CRenderMgr::render`:本帧主菜

```cpp
void CRenderMgr::render()
{
    m_NumDrawCalls = 0;
    ClearRenderTargetSet();   // 清各 MRT 颜色 + DSV
    DataBinding();            // 上传 GLOBAL CB + Light2D/Light3D 结构化缓冲
    (this->*RenderFunc)();    // ★ 编辑器走 render_editor;游戏走 render_play
    DataClear();              // 解绑 SRV 槽,清灯光数组
}
```

我们走 `CTestLevel3D` 在编辑器模式下的路径 —— `render_editor`。它就是这篇文章的主线。

### 4.1 全局 CB + 灯光 SBO 上传

`DataBinding`(`CRenderMgr.cpp:292`)把 `g_GlobalData(分辨率/灯光数/时间)` 写进 b3 的 `tGlobalData` 常量缓冲;然后把这一帧的 `tLightInfo` 数组(2D 与 3D)上传到 `m_Light2DBuffer / m_Light3DBuffer` 两个 SRV-only 结构化缓冲,绑到 t15、t16,后续 lighting 着色器靠下标取 `g_Light3D[Light3D_Idx]`。

### 4.2 Pass 0:Shadow Map

`CRenderMgr::render_shadowmap` → `CLight3D::RenderShadowMap`:

```cpp
m_ShadowMapMRT->ClearTargets();
m_ShadowMapMRT->ClearDepthStencil();
m_ShadowMapMRT->OMSet();        // 切到 2048×2048 单 RT + DSV

// Texel snapping:把光相机的投影矩阵微调,让阴影边缘随相机移动时不再"游泳"
float fHalfRes = SHADOWMAP_RESOLUTION_HIGH * 0.5f;
Vec4 vOrigin = XMVector4Transform(XMVectorSet(0,0,0,1), matView * matProj);
float snappedX = roundf(vOrigin.x * fHalfRes) / fHalfRes;
float snappedY = roundf(vOrigin.y * fHalfRes) / fHalfRes;
matProj._41 -= (vOrigin.x - snappedX);
matProj._42 -= (vOrigin.y - snappedY);

g_Trans.matView = matView;
g_Trans.matProj = matProj;       // ★ 用 light camera 的 V/P 覆盖全局矩阵
pLightCam->SortObjects_ShadowMap();
pLightCam->render_shadowmap();   // 用 shadowmap.fx 的 VS_ShadowMap / PS_ShadowMap
```

ShadowMap PS 极简:把 `clip.z / clip.w` 写进单通道 R32F。这就是后面 PCF 用的深度。

### 4.3 Pass 1:写入相机视角的 V/P + 排序场景

```cpp
g_Trans.matView    = m_EditorCam->GetViewMat();
g_Trans.matViewInv = m_EditorCam->GetViewMatInv();
g_Trans.matProj    = m_EditorCam->GetProjMat();
g_Trans.matProjInv = m_EditorCam->GetProjMatInv();
m_EditorCam->SortObjects();
```

`SortObjects`(`CCamera.cpp:122`)遍历所有打开的 Layer,先做 frustum culling,再按每个 SubMesh 的 Shader Domain 把对象**重复**塞进 `m_vecDeferredObjects / m_vecDeferredDecalObjects / m_vecOpaqueObjects / m_vecMaskedObjects / m_vecTransparentObjects / m_vecParticleObjects / m_vecPostProcessObjects` 七个桶里。

> 同一个 Object 可能因为 SubMesh 分别用了不透明 PBR 与玻璃 Forward 着色器,而同时出现在多个桶里 —— 这是引擎支持"一个 mesh 多种渲染域"的关键。

### 4.4 Pass 2:绑定 IBL

`CIBLManager::Binding()` 把 BRDF LUT(t5)、Irradiance Cubemap(t7)、Prefilter Cubemap(t8) 推到对应槽位。这三张图在整帧里被反复使用,所以提前一次性绑好。

### 4.5 Pass 3:G-Buffer Geometry Pass

```cpp
m_MRT[(UINT)MRT_TYPE::DEFERRED]->OMSet();   // 5 RT + DSV
m_EditorCam->render_deferred();
```

`render_deferred` 遍历 `m_vecDeferredObjects`,对每个对象 call `obj->render()`(`CGameObject::render` 转发到 `CRenderComponent::render` → `CMeshRenderer::render`):

```cpp
// CMeshRenderer.cpp:29
Transform()->Binding();             // ★ 写 W/V/P/WV/WVP 到 b0 (TRANSFORM CB)
SHADER_DOMAIN eCurDomain = CRenderMgr::GetCurRenderDomain();
for (UINT i = 0; i < subCount; ++i)
{
    Ptr<CMaterial> pMtrl = GetMaterial(i);
    if (pMtrl->GetShader()->GetDomain() != eCurDomain) continue;  // 跨域跳过
    pMtrl->Binding();
    GetMesh()->render_submesh(i);
}
```

`CMaterial::Binding()` 三步走:

1. `m_Shader->Binding()` —— DX12 端会拼装 PSO(包括 InputLayout、RS/DS/BS、5 个 RT 格式),并把 PSO + Root Signature 绑定到 CL。这里是 PSO 缓存命中的位置。
2. 遍历 `TEX_PARAM::TEX_0..TEX_END`,有名字的就当帧重新 `FindAsset`(支持 Resize 后纹理重建无感),把 SRV `Binding(i)` 到对应 t 槽,并写 `m_Const.bText[i] = true` 让着色器知道哪些通道存在。
3. 把 `tMaterialConst`(`int[4] / float[4] / vec2[4] / vec4[4] / mat[4] / bTex[N]`)上传到 b1。

最后 `CMesh::render_submesh` 设 VB/IB,发起 `DrawIndexed(IndexCount, IndexStart, 0)`。

GPU 那边运行的就是 `Project/Engine/std3d_deferred_pbr.fx`:

- VS 把位置、法线、切线、双切线全转成 **view space**(注意 G-Buffer Position 与 Normal 都在 view space —— 所以后续 Lighting 不需要再做世界→视空间的变换);
- PS 写出 5 张 RT:
  - `SV_Target0` Albedo(线性空间;`g_int_3` 控制是否要 sRGB→linear、`g_vec4_0` 是 baseColor factor);
  - `SV_Target1` View-space Normal(可被法线贴图 + TBN 修正);
  - `SV_Target2` View-space Position(Alpha=1 标记几何体存在,采样器据此判断是否是天空);
  - `SV_Target3` Emissive;
  - `SV_Target4` `(Metallic, Roughness, AO, 1.0)` —— Alpha=1 的语义是"这是 PBR 像素",Blinn-Phong 路径会把它写 0。

### 4.6 Pass 4:Decal Pass

```cpp
m_MRT[(UINT)MRT_TYPE::DEFERRED_DECAL]->OMSet();   // 直接附着 GBuffer_Color + GBuffer_Emissive
m_EditorCam->render_deferred_decal();
```

Decal 不写新 RT,而是用 `BS_TYPE::DECAL_BLEND` 把投影盒子里的像素**叠加**回 G-Buffer 的颜色和 emissive 通道。`CTestLevel3D` 当前注释掉了 decal,但 pass 还是会跑(空 loop)。

### 4.7 Pass 5:SSAO

`render_ssao` 两步:

```cpp
// 1) 生成
m_MRT[SSAO]->OMSet();
pSSAOMat->SetTexParam(TEX_0, GBuffer_Position);
pSSAOMat->SetTexParam(TEX_1, GBuffer_Normal);
pSSAOMat->SetTexParam(TEX_2, ssao_noise);
pSSAOMat->Binding();
pRectMesh->render();

// 2) 双边模糊
m_MRT[SSAO_BLUR]->OMSet();
pBlurMat->SetTexParam(TEX_0, SSAOTexture);
pBlurMat->Binding();
pRectMesh->render();

// 3) bind blur 结果到 t17,等下游 lighting pass 用
pSSAOBlurTex->Binding(17);
```

`ssao.fx` 用 32 个 cosine-weighted hemisphere 样本,`g_matProj` 把 view-space 偏移投回屏幕 UV,采样位置的 `GBuffer_Position.z`,与样本点深度做带 BIAS 的比较累计 occlusion。Sky 像素(`alpha < 0.5`)被显式跳过,避免边缘黑边。`ssao_blur.fx` 是 4×4 单通道权重模糊,把噪声压平。

### 4.8 Pass 6:Deferred Lighting

```cpp
m_MRT[DEFERRED_LIGHT]->OMSet();   // GBuffer_Diffuse + GBuffer_Specular
for (auto* pLight : m_vecLights3D)
    pLight->ApplyLighting();
```

`CLight3D::ApplyLighting`:

```cpp
Binding();           // ★ 给 DeferredDirLightingMaterial 设 light idx / shadow / IBL / SSAO
m_VolumeMesh->render();   // Directional → 全屏 quad;Point → 球;Spot → 锥
```

`CLight3D::Binding`(`CLight3D.cpp:123`)把灯光在数组中的下标写到材质的 INT_0,把 shadow map 绑到 TEX_4,把 `LightView * SnappedProj` 写到 MAT_0。`m_DeferredLightingMaterial->Binding()` 上传后再补一次 `CIBLManager::Binding()` —— 因为材质 `Binding()` 会清空未使用的 SRV 槽,IBL 必须放后面。

GPU 在 `deferred_lighting.fx` 的 `PS_DirLight` 里干这件事:

1. 从 `GBuffer_Position` 拿视空间位置(α=0 直接 discard 天空);
2. **Shadow Sampling** —— 把 view-space → world-space → light-clip-space,经 `vShadowUV` 与 5×5 PCF 算 `ShadowPower`。bias 是 slope-scaled `max(0.005*(1-NdotL), 0.001)`,避免阴影 acne;
3. 看 `GBuffer_Data.a`:
   - `> 0.5` 走 **PBR 路径**:`CalcLight3D_PBR` 用 Cook-Torrance(GGX D + Smith G + Schlick F)算直接光 `Lo`,然后:
     - **Diffuse IBL**: 把视空间法线转回世界空间,采样 `Irradiance_Map`,乘 `kD * albedo`;
     - **Specular IBL**: 反射方向 `R = reflect(-V, N)` 转世界空间,按 `roughness * 4` 选 mip 采 `Prefiltered_Map`,再乘 `BRDFLut` 上采到的 `(F * scale + bias)`;
     - 乘 SSAO blur 后的 AO 得到 ambient;
     - `output.vDiffuse.rgb = directLight * (1 - shadow) + ambient`;
   - `≤ 0.5` 走老 Blinn-Phong 路径(`CalcLight3D`),分别写 `vDiffuse / vSpecular`。

每盏灯都画一次,**结果叠加**进 `GBuffer_Diffuse / GBuffer_Specular`。`output.vDiffuse.a = position.z` 这个小细节是为了点光后续做体积深度比较时省采样。

### 4.9 Pass 7:Merge → HDR

```cpp
m_MRT[HDR_SCENE]->OMSet();      // R16G16B16A16_FLOAT
pMergingMat->SetTexParam(TEX_0..TEX_4, GBuffer_*);
pMergingMat->Binding();
pRectMesh->render();
```

`deferred_merging.fx` 在 PBR 路径下只取 `Diffuse + Emissive`(specular 已经被 `Lo` 吃掉了),Blinn-Phong 路径走经典 `Color * Diffuse + Specular + Emissive`。Debug View 时直接把所选 RT 拷到屏幕。

> 注意此时输出还是 HDR(超 1.0 的浮点数),色调映射在 Pass 9 之后做。

### 4.10 Pass 8:Forward 透明 / 蒙版 / 粒子

```cpp
m_EditorCam->render_opaque();       // DOMAIN_OPAQUE  —— 例如 SkyBox(写 HDR)
m_EditorCam->render_masked();       // DOMAIN_MASKED  —— alpha cutout
m_EditorCam->render_transparent();  // DOMAIN_TRANSPARENT —— PBR Glass
m_EditorCam->render_particle();
```

SkyBox 走 `DOMAIN_OPAQUE`:在 HDR_SCENE RT 上,深度被推到 1.0、关闭深度写入,把 venice_sunset_4k 的 equirect 直接 sample 出来,作为远景。这样 SkyBox 的高动态范围信息和 PBR 物体共用 HDR Buffer。

PBR Glass 等透明材质走 `DOMAIN_TRANSPARENT`,Alpha-blend 上去。

### 4.11 Pass 9:Tone Mapping → SwapChain

```cpp
m_MRT[SWAPCHAIN]->OMSet();    // ★ 切回 BackBuffer
pToneMapMat->SetTexParam(TEX_0, HDRSceneTex);
pToneMapMat->SetScalarParam(FLOAT_0, 0.6f);  // exposure
pToneMapMat->SetScalarParam(INT_0, 0);       // 0=ACES, 1=Reinhard, 2=Uncharted2
pToneMapMat->Binding();
pRectMesh->render();
```

`tonemapping.fx` 简单粗暴:乘 exposure → 选一个 operator(默认 ACES filmic) → `pow(mapped, 1/2.2)` 做线性→sRGB 的 gamma。这是 HDR → R8G8B8A8_UNORM 的最后一道关。

### 4.12 Pass 10–11:Postprocess + Cleanup

```cpp
m_EditorCam->render_postprocess();   // 内部先 CopyRenderTarget(BackBuffer → RenderTargetTexCopy)
                                     // 让 postprocess shader 既能读"前一帧帧缓冲"又能写当前帧
CIBLManager::GetInst()->Clear();     // 解绑 t5/t7/t8
m_MRT[SWAPCHAIN]->OMSet();           // ★ Postprocess 把 BackBuffer 转成了 COPY_SOURCE,这里转回 RT
```

`CopyRenderTarget` 用 `IRHICommandList::CopyTexture(RenderTargetTexCopy, RenderTargetTex)` 完成。COPY 之后的状态切换在 `m_MRT[SWAPCHAIN]->OMSet()` 里被 `DX12ResourceStateTracker` 自动转回 `RENDER_TARGET`。

### 4.13 `DataClear`

```cpp
m_vecLights2D.clear();
m_vecLights3D.clear();
for (UINT i = 0; i < 16; ++i)
    pCmdList->ClearTextureSRV(i);   // 防止下帧 G-Buffer RT/SRV hazard
```

延迟管线最容易踩坑的就是 **同一个纹理上一帧作为 SRV、这一帧又作为 RT** 触发 D3D12 的资源状态冲突。引擎在每帧末手动把 PS 的前 16 个 SRV 槽全部 unbind,避免下一帧 `OMSetRenderTargets` 时 GBuffer 还作为 SRV 挂着。

---

## 5. ImGui 与编辑器 UI

`render()` 跑完后,`main.cpp` 接着调:

```cpp
CEditorMgr::tick();          // 更新编辑器相机移动等
CImGuiMgr::tick();           // ImGui::NewFrame → 绘制面板 → Render → 提交 ImGui draw data
```

ImGui 用单独的 shader-visible CBV/SRV/UAV heap(`DX12Device::InitImGuiSrvHeap`,128 个槽,槽 0 留给字体)。UI 的所有 SRV 由 `AllocateImGuiSrvSlot` 分配并 `CopyToImGuiSrvHeap` 拷过来。最后渲染到 BackBuffer(`PrepareBackBufferForImGui` 重设 RT)。

---

## 6. `Present`:把 BackBuffer 交还 DXGI

```cpp
// DX12Device::Present  (DX12Device.cpp:154)
auto& backBuffer = m_BackBufferTextures[m_CurrentBackBufferIndex];
m_CurrentCmdList->TransitionBarrier(backBuffer, D3D12_RESOURCE_STATE_PRESENT);
commandQueue->ExecuteCommandList(m_CurrentCmdList);   // 提交本帧所有命令
m_CurrentCmdList.reset();

m_SwapChain->Present(syncInterval, presentFlags);     // ★ 翻页
m_FenceValues[m_CurrentBackBufferIndex] = commandQueue->Signal();
m_CurrentBackBufferIndex = m_SwapChain->GetCurrentBackBufferIndex();
commandQueue->WaitForFenceValue(m_FenceValues[m_CurrentBackBufferIndex]);

++ms_FrameCount;
ReleaseStaleDescriptors(ms_FrameCount);   // 释放已"飞过 GPU"的描述符
```

最后两件事是 GPU/CPU 同步的优雅细节:

- 用 fence 记下"本帧提交之后我用过哪个 BackBuffer",下一帧拿到同一个 BackBuffer 之前等到对应 fence 完成 —— 这正是 triple-buffering 的核心约束。
- `ReleaseStaleDescriptors` 把上几帧已经 Present 完成的 descriptor allocation 回收 —— 配合 `Allocate / Free` 的延迟回收策略,DescriptorAllocator 不会泄漏也不会过早释放正在被 GPU 使用的 descriptor。

到这里,屏幕上才真正出现一帧画面。然后回到 `while(true)`,从 `CEngine::Progress` 重新开始。

---

## 7. 整帧时序图

```
┌─ wWinMain ────────────────────────────────────────────────────────────┐
│                                                                       │
│  CEngine::Init                                                        │
│    └─ DX12Device::init  (SwapChain / RootSig / CB / Sampler ...)      │
│    └─ CRenderMgr::init  → CreateRenderTargetSet (7 个 MRT)            │
│    └─ CIBLManager::init → 烘焙 BRDF LUT (一次性)                     │
│  CTestLevel3D::CreateTestLevel                                        │
│    └─ Light, Knight (PBR MaterialInstance), Sponza (glTF), SkyBox     │
│        └─ SkyBox 触发 CIBLManager::GenerateFromEquirect (Compute x4)  │
│                                                                       │
│  while (true) {                                                       │
│    Progress()                                                         │
│      ├─ TimeMgr / KeyMgr / AssetMgr / LevelMgr (tick + finaltick)     │
│      │      └─ CCamera::finaltick   (V/P + Frustum)                   │
│      │      └─ CLight3D::finaltick  (Register + Light Camera)         │
│      ├─ DX12Device::BeginFrame    (CL / RootSig / RenderTargetTex 滚动)│
│      └─ CRenderMgr::render → render_editor                            │
│           ├─ Pass 0  Shadow Map         (Light Camera, R32_FLOAT)     │
│           ├─       SortObjects + Frustum Culling                      │
│           ├─       CIBLManager::Binding   (t5/t7/t8)                  │
│           ├─ Pass 3  G-Buffer Geometry  (Albedo/Normal/Pos/Em/MRO)    │
│           ├─ Pass 4  Decal              (Blend on Color + Emissive)   │
│           ├─ Pass 5  SSAO + Bilateral Blur                            │
│           ├─ Pass 6  Deferred Lighting  (PBR Cook-Torrance + IBL+PCF) │
│           ├─ Pass 7  Merge → HDR_SCENE                                │
│           ├─ Pass 8  Forward (Sky / Masked / Glass / Particle)        │
│           ├─ Pass 9  Tone Mapping → SwapChain (ACES + sRGB Gamma)     │
│           └─ Pass 10 Postprocess + Cleanup                            │
│    EditorMgr::tick + ImGuiMgr::tick                                   │
│    DX12Device::Present  (Transition→PRESENT, Execute, Swap, Fence)    │
│  }                                                                    │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 8. 一些值得记住的设计选择

1. **Root Signature 大一统**:不分 PSO 切 Root Sig,全引擎共享一套 CBV+SRV table+UAV table,极大简化材质/Pass 切换的成本。代价是绑定颗粒度粗一些 —— 用 descriptor copy 而不是 root descriptor。
2. **G-Buffer Position 直接存 view-space xyz**:节省了"从深度重建位置"的代码量,但浪费 R32G32B32A32 的带宽。`TODO` 注释里已经记录了改造方向。
3. **`GBuffer_Data.a` 当作 PBR/Blinn-Phong 路径标志**:同一个 deferred lighting 着色器在两条路径之间分支,允许引擎在同场景里混用旧管线对象与 PBR 对象。
4. **Light Camera + Texel Snapping**:Directional Light 把灯光 `Transform` 整个拷到一个隐藏相机来复用整套 V/P 装配逻辑;Texel Snapping 让 ShadowMap 边缘随相机移动不再"游泳"。
5. **IBL 是同步烘焙**:`SetSkyBoxTexture` 会内联 `BeginFrame / EndFrame` —— 是因为 BRDF LUT、Irradiance、Prefilter 在一帧内必须可读。这意味着切换天空盒会有一次 GPU stall,但只发生在场景加载时。
6. **每帧手动 `ClearTextureSRV(0..15)`**:避免上一帧的 G-Buffer SRV 还挂在 PS,与下一帧的 OMSetRenderTargets 撞资源状态 —— 延迟管线的高发雷区。
7. **`RenderTargetTex` 的"逻辑别名"**:DX12 端每帧把 `RenderTargetTex` 的底层资源指向当前 BackBuffer,引擎层完全不感知 triple-buffering。

---

> 一帧从 `wWinMain` 走到 `Present`,中间穿过 **逻辑 tick → 阴影烘焙 → 5 张 G-Buffer → SSAO → Cook-Torrance + IBL Lighting → Merge → 透明 Forward → Tone Map → Postprocess** 这十多道关,最终被 DXGI 翻页给屏幕。理解这条路径,基本就掌握了 YannEngine 在做什么,也大致清楚了"想加一个新效果"该从哪一段切入。


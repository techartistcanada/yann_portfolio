# PBR + IBL 完整工作流程详解

> 本文档详细解释 YannEngineDX12RHI 中 **PBR (Physically Based Rendering)** 与 **IBL (Image Based Lighting)** 的完整渲染管线，从离线预计算到实时着色，逐步解析每一阶段的原理、算法和数学公式。

---

## 目录

1. [总体流程概览](#1-总体流程概览)
2. [理论基础：渲染方程与 Cook-Torrance BRDF](#2-理论基础渲染方程与-cook-torrance-brdf)
3. [离线预计算阶段（IBL Precomputation）](#3-离线预计算阶段ibl-precomputation)
   - 3.1 [Equirectangular → Cubemap 转换](#31-equirectangular--cubemap-转换)
   - 3.2 [Cubemap Mipmap 生成（Karis Average）](#32-cubemap-mipmap-生成karis-average)
   - 3.3 [Irradiance Map（漫反射 IBL）](#33-irradiance-map漫反射-ibl)
   - 3.4 [Prefiltered Map（镜面 IBL）](#34-prefiltered-map镜面-ibl)
   - 3.5 [BRDF LUT（双向反射分布函数查找表）](#35-brdf-lut双向反射分布函数查找表)
4. [GBuffer 阶段（几何信息打包）](#4-gbuffer-阶段几何信息打包)
5. [延迟光照阶段（Deferred Lighting）](#5-延迟光照阶段deferred-lighting)
   - 5.1 [直接光照 Cook-Torrance](#51-直接光照-cook-torrance)
   - 5.2 [间接光照 IBL（Split-Sum）](#52-间接光照-iblsplit-sum)
6. [CIBLManager 资源调度](#6-ciblmanager-资源调度)
7. [关键数据流图](#7-关键数据流图)

---

## 1. 总体流程概览

PBR + IBL 渲染管线分为两大部分：

### 离线（每个 HDR 环境贴图加载一次）

```
HDR Equirect (.hdr)
        │
        ▼  CS_EquirectToCube
EnvCubemap mip 0 (1024×1024×6)
        │
        ▼  CS_GenerateMipsCubemap (per-mip Karis)
EnvCubemap full mip chain
        │
        ├──▶ CS_Irradiance       ──▶  IrradianceMap   (32×32×6,    diffuse  IBL)
        ├──▶ CS_Prefilter (×5)   ──▶  PrefilterMap    (256×256×6, 5 mips, specular IBL)
        └──▶ (one-time)
              CS_BRDFLut         ──▶  BRDFLut         (512×512, R16G16, env-BRDF)
```

### 实时（每帧）

```
Mesh ─▶ VS/PS_Std3D_Deferred_PBR ─▶ GBuffer (Albedo/Normal/Position/Emissive/Data)
                                         │
                                         ▼
                  PS_DirLight  =  Direct Light (Cook-Torrance)
                              + Indirect IBL (Irradiance + Prefilter*BRDFLut)
                              − Shadow (5×5 PCF)
```

涉及到的核心源文件：

| 文件 | 角色 |
|---|---|
| `Project/Engine/CIBLManager.cpp` | C++ 调度：管理资源、按顺序调度 CS、屏障与 mip 生成 |
| `Project/Engine/equirect_to_cubemap_cs.fx` | 将经纬度 HDR 投影到立方体六面 |
| `Project/Engine/generate_mips_cubemap_cs.fx` | 立方体贴图 mip 生成（HDR 安全） |
| `Project/Engine/ibl_irradiance_cs.fx` | 漫反射卷积 |
| `Project/Engine/ibl_prefilter_cs.fx` | GGX 重要性采样的镜面预滤波 |
| `Project/Engine/brdf_lut_cs.fx` | 环境 BRDF 二维 LUT |
| `Project/Engine/std3d_deferred_pbr.fx` | GBuffer 写入 |
| `Project/Engine/deferred_lighting.fx` | 直接 + 间接光合成 |
| `Project/Engine/pbr.fx` | 公共 BRDF 工具：D / G / F |
| `Project/Engine/func.fx` | `CalcLight3D_PBR` 直接光封装 |

---

## 2. 理论基础：渲染方程与 Cook-Torrance BRDF

### 2.1 渲染方程

Kajiya 的渲染方程描述了某点 `p` 沿出射方向 `ωo` 的辐射亮度：

```
Lo(p, ωo) = Le(p, ωo) + ∫_Ω fr(p, ωi, ωo) · Li(p, ωi) · (n · ωi) dωi
```

PBR 的目标是用一个**物理合理**的 BRDF `fr` 来近似真实世界材质的反射行为。

### 2.2 Cook-Torrance BRDF

材质的双向反射函数被拆为漫反射 + 镜面反射两项：

```
fr = kD · (c / π) + kS · fr_spec
```

其中：

```
                 D(h) · F(v,h) · G(v,l)
fr_spec = ─────────────────────────────────
                4 · (n·v) · (n·l)
```

- **D — Normal Distribution Function (GGX/Trowbridge-Reitz)**：描述微表面法线集中度。
- **G — Geometry Function (Smith + Schlick-GGX)**：描述微表面互相遮蔽/阴影。
- **F — Fresnel (Schlick approximation)**：随入射角变化的反射比例。

代码实现（`pbr.fx`）：

```hlsl
// D：a = roughness² ；GGX/Trowbridge-Reitz
float DistributionGGX(float3 N, float3 H, float roughness){
    float a = roughness*roughness, a2 = a*a;
    float NdotH = max(dot(N,H),0);
    float denom = NdotH*NdotH*(a2-1) + 1;
    return a2 / (PI * denom * denom);
}

// G：Smith + Schlick (k = (r+1)²/8 的直接光版本)
float GeometrySchlickGGX(float NdotV, float roughness){
    float r = roughness + 1.0;
    float k = (r*r) / 8.0;
    return NdotV / (NdotV*(1-k)+k);
}

// F：Schlick 近似
float3 FresnelSchlick(float cosTheta, float3 F0){
    return F0 + (1-F0) * pow(saturate(1-cosTheta), 5);
}
```

> ⚠️ 注意：直接光使用 `k = (r+1)²/8`，IBL（`brdf_lut_cs.fx`）使用 `k = a²/2`。这是 Disney/UE4 推荐的两套不同的 `k` 取值，分别针对点光与环境光。

### 2.3 能量守恒

`F` 既代表镜面反射比例又是 `kS`，所以 `kD = (1 - F) · (1 - metallic)`。
金属（metallic=1）没有漫反射；非金属保留 `(1 - F0)` 的能量去做漫反射。

---

## 3. 离线预计算阶段（IBL Precomputation）

IBL 的核心思想：将"环境光照"作为一个无穷远处的球面光源。把渲染方程中**漫反射**和**镜面反射**两部分的环境积分**预计算**到贴图里，运行时只需采样。

### 3.1 Equirectangular → Cubemap 转换

**目的**：把磁带式（lat-lon）HDR 全景图重新参数化为立方体六面，使得任意方向 `dir` 的采样成本恒定且无极点失真。

**输入**：`Texture2D<float4>` 等距矩形 HDR (e.g. 4096×2048)
**输出**：`RWTexture2DArray<float4>` 1024×1024×6 立方体面

**核心算法** (`equirect_to_cubemap_cs.fx`)：

1. 由 `(face, uv)` 还原 3D 方向 `dir`：

```hlsl
case 0: dir = float3( 1, cy,-cx); // +X
case 1: dir = float3(-1, cy, cx); // -X
case 2: dir = float3( cx, 1,-cy); // +Y
case 3: dir = float3( cx,-1, cy); // -Y
case 4: dir = float3( cx, cy, 1); // +Z
case 5: dir = float3(-cx, cy,-1); // -Z
```

2. 用球面坐标转换出经纬度采样位置：

```
φ = atan2(dir.z, dir.x)           // [-π, π]
θ = asin(clamp(dir.y, -1, 1))     // [-π/2, π/2]
u = φ / (2π) + 0.5
v = 1 - (θ / π + 0.5)
```

3. **HDR 软钳制（Soft Clamp）**：太阳盘亮度可能 > 50,000，会让后续 prefilter 出现严重的「萤火虫」伪影。这里用 Reinhard 风格在亮度通道上压缩，**保持色相**：

```hlsl
float3 SoftClampHDR(float3 color, float threshold){
    float lum = max(color.r, max(color.g, color.b));
    if (lum > threshold){
        float compressed = threshold + (lum-threshold)/(1+(lum-threshold)/threshold);
        color *= compressed / lum;
    }
    return color;
}
```

阈值 `64` 是经验值：保留天空梯度，抑制太阳的灾难性亮度。

### 3.2 Cubemap Mipmap 生成（Karis Average）

**为什么不用硬件自动生成？**
- D3D12 不支持对 cubemap 的 `GenerateMips`。
- HDR 用普通盒滤波会出现**萤火虫**（一个 50,000 像素和三个 1.0 像素混合后仍是 12,501）。

**Karis Average**（来自 UE4 的 SIGGRAPH 2013 报告，bloom 同款）：用亮度倒数加权，让暗像素相对获得更多贡献：

```hlsl
float KarisWeight(float3 c){
    float luma = dot(c, float3(0.2126, 0.7152, 0.0722));
    return 1.0 / (1.0 + luma);
}
result = (c00*w00 + c10*w10 + c01*w01 + c11*w11) / (w00+w10+w01+w11);
```

**调度策略**（`CIBLManager::GenerateFromEquirect` 中循环）：
- **不能**让一次 dispatch 同时把 mip N-1 当作 SRV、mip N 当作 UAV 写入同一资源（D3D12 资源状态不允许 SRV 和 UAV 同时存在）。
- 解决方案：**scratch cubemap**。`Copy(env mip N-1) → scratch mip N-1 → CS reads scratch, writes env mip N`。
- scratch 与 env 共享同样的 mip 数量与尺寸，因此一份 scratch 涵盖所有 mip 级别。

```cpp
for (UINT mip = 1; mip < mipLevels; ++mip){
    pCmdList->CopySubresourceMip(scratch, mip-1, env, mip-1, 6);
    m_pGenMipsCubemapCS->SetSrcMipTex(scratch); SetSrcMip(mip-1);
    m_pGenMipsCubemapCS->SetDstCubemap(env);   SetDstMip(mip);
    m_pGenMipsCubemapCS->Execute();
}
```

### 3.3 Irradiance Map（漫反射 IBL）

**目标**：对每个法线方向 `N`，预积分入射光在半球内的余弦加权积分：

```
E(N) = ∫_Ω Li(ωi) · (N · ωi) dωi
```

漫反射部分 BRDF 是 `c/π`，所以渲染时直接 `diffuseIBL = (c/π) · E(N) · π = c · E(N)`（吸收 π）。

**算法** (`ibl_irradiance_cs.fx`)：均匀球面采样（不需要重要性采样，因为漫反射 PDF 接近常数）。

```hlsl
for(φ = 0; φ < 2π; φ += δ)
  for(θ = 0; θ < π/2; θ += δ){
      tangentSample = (sinθ cosφ, sinθ sinφ, cosθ);
      sampleVec = TangentToWorld(tangentSample);
      irradiance += Li(sampleVec) * cosθ * sinθ;   // sinθ 来自球面雅可比
      n++;
  }
irradiance = π · irradiance / n;
```

为何乘 `cos(θ) · sin(θ)`？
- `cos(θ)` = `N · ωi`（兰伯特余弦项）
- `sin(θ)` = 球面坐标 `dω = sinθ dθ dφ` 的雅可比
- 最后乘 `π` 等价于 `2π · π/2 / n` 的归一化常数。

输出尺寸只需 32×32×6——漫反射的频率非常低（半球积分极度模糊）。

### 3.4 Prefiltered Map（镜面 IBL）

镜面项无法只靠法线 `N` 表达，因为它依赖视角 `V`、粗糙度 `r`。Karis 提出 **Split-Sum 近似**：

```
∫ Li · fr · (n·l) dω
   ≈ (∫ Li(l) dω 加权)  ·  (∫ fr · (n·l) dω 加权)
   =  PrefilteredColor(R, r)        ·  EnvBRDF(NdotV, r)
```

> 假设 1：`V = R = N`（即把 `Lr = reflect(-V,N)` 视作主反射方向，这样就可以让左积分只依赖 `R` 和 `r`）。
> 假设 2：把整体积分拆为两个独立积分的乘积。

**Prefiltered Cubemap**：把"环境光在以 `R` 为中心的 GGX lobe 内的加权平均"预计算到一张 cubemap 的多 mip 级中。`mip = roughness · MAX_LOD`（本工程 5 个 mip，level 0=镜面、level 4=粗糙）。

**算法** (`ibl_prefilter_cs.fx`)：GGX 重要性采样：

```hlsl
for(i=0; i<1024; ++i){
    Xi = Hammersley(i, 1024);              // 低差异序列 [0,1)²
    H  = ImportanceSampleGGX(Xi, N, r);    // 在 GGX 分布下抽 H
    L  = reflect(-V, H);                   // V=R=N 假设
    if(NdotL > 0){
        // 解决欠采样的高频走样：根据 PDF 选 mip
        D     = DistributionGGX(NdotH, r);
        pdf   = D · NdotH / (4 · HdotV);
        saSample = 1 / (SAMPLE_COUNT · pdf);
        saTexel  = 4π / (6 · res²);
        mipLevel = 0.5 · log2(saSample / saTexel);

        prefilteredColor += Li(L, mipLevel) · NdotL;
        totalWeight += NdotL;
    }
}
prefilteredColor /= totalWeight;
```

**Hammersley + Van der Corput**：低差异序列让 1024 个样本均匀覆盖 `[0,1)²`，远好于均匀随机。

**ImportanceSampleGGX**：从均匀样本 `Xi` 反演 GGX 累积分布函数得到与 NDF 成正比的 `H`，从而把方差集中到对积分贡献大的方向。

**Mip 选择技巧**（Krivanek 2007，UE4 沿用）：当样本的 PDF 较低时（即此样本在采样域中较"稀疏"），单次采样代表的"立体角"较大，应当读取更模糊的 mip 级别——这样有限的 1024 个样本就近似覆盖了整个 lobe，避免出现亮点闪烁。这正是为什么 cubemap 必须有完整的 mip 链（§3.2）。

### 3.5 BRDF LUT（双向反射分布函数查找表）

Split-Sum 第二项：

```
EnvBRDF(NdotV, r) = ∫_Ω fr · (n·l) dω
```

把 `F = F0 + (1-F0) · (1-VdotH)^5` 展开后能整理为：

```
∫ ≈ F0 · A(NdotV, r) + B(NdotV, r)
```

其中 `A`、`B` 与 `F0` 无关，仅依赖 `NdotV` 和 `r`，因此可预计算成 2D 纹理（512×512 R16G16）。运行时直接：

```hlsl
float2 brdf = BRDFLut.Sample(g_Sam_Clamp, float2(NdotV, roughness)).rg;
specularIBL = prefilteredColor * (F * brdf.x + brdf.y);
```

**算法** (`brdf_lut_cs.fx`)：

```hlsl
for(i=0;i<1024;i++){
    Xi = Hammersley(i, 1024);
    H  = ImportanceSampleGGX(Xi, N=(0,0,1), r);
    L  = reflect(-V, H);
    if(L.z>0){
        G  = GeometrySmith(N, V, L, r);     // 注意 IBL 版 k = a²/2
        G_Vis = G * VdotH / (NdotH · NdotV);
        Fc = (1-VdotH)^5;
        A += (1 - Fc) * G_Vis;              // 拆 F0 系数
        B += Fc * G_Vis;
    }
}
g_OutBRDFLut[xy] = float2(A, B) / 1024;
```

> 这就是把 `F = F0(1-Fc) + Fc` 代入后再合并 `(1-F0)·G·V_term` 与 `F0·G·V_term`，得到的 A/B 系数。

输出格式 `R16G16_FLOAT` 足够精度（值都在 [0,1]），坐标系 `(NdotV, roughness)`。

---

## 4. GBuffer 阶段（几何信息打包）

`std3d_deferred_pbr.fx` 是延迟管线的 GBuffer pass，把材质属性写入 5 个 RT：

| RT | 含义 | 格式建议 |
|----|----|----|
| `SV_Target0` `vColor` | Albedo (linear) | RGBA8 sRGB 或 R11G11B10 |
| `SV_Target1` `vNormal` | View-space normal | R10G10B10A2 / RGBA16F |
| `SV_Target2` `vPosition` | View-space position, A=geom flag | RGBA16F |
| `SV_Target3` `vEmissive` | Emissive (linear) | RGBA16F |
| `SV_Target4` `vCustomData` | R=Metallic G=Roughness B=AO A=PBR flag | RGBA8 |

### 关键细节

**1. sRGB → Linear**：
```hlsl
if (!g_int_3) vAlbedo.rgb = pow(abs(vAlbedo.rgb), 2.2f);
```
所有光照计算必须在线性空间内进行。`g_int_3 = 1` 用于贴图本身已是线性（数据贴图、normal、ORM 等）。

**2. ORM vs glTF MR 双格式支持**：
```
ORM (Unreal):  R=AO, G=Roughness, B=Metallic
glTF MR:       R=unused, G=Roughness, B=Metallic   (+ 标量乘 g_float_0/1)
```

**3. 法线贴图 TBN**：
```hlsl
vNormalMap.y = -vNormalMap.y;          // 默认 OpenGL 风格 normal map
if (g_int_1) vNormalMap.y = -vNormalMap.y; // 二次反向 = DirectX 风格
TBN = (T, B, N) in view space;
vNormalInView = normalize(mul(vNormalMap, TBN));
```

**4. PBR 标志位**：`vCustomData.a = 1.0` 告诉延迟光照走 PBR 路径；为 0 走 Blinn-Phong 兼容路径。

---

## 5. 延迟光照阶段（Deferred Lighting）

`deferred_lighting.fx` 的 `PS_DirLight`/`PS_PointLight` 在屏幕空间逐像素累加光照。

### 5.1 直接光照 Cook-Torrance

封装在 `func.fx::CalcLight3D_PBR`：

```hlsl
F0 = lerp(0.04, Albedo, Metallic);     // 非金属 4% / 金属用 albedo
NDF = DistributionGGX(N, H, r);
G   = GeometrySmith(N, V, L, r);       // 直接光 k = (r+1)²/8
F   = FresnelSchlick(HdotV, F0);

specular = (NDF * G * F) / (4 * NdotV * NdotL + ε);
kS = F;
kD = (1 - kS) * (1 - Metallic);
diffuse = kD * Albedo / π;

Lo = (diffuse + specular) * Radiance * NdotL;
```

`Radiance` 即 `LightInfo.Light.vDiffuse * attenuation`。点光源用余弦衰减：
```
attenuation = cos((dist/Range) * π/2)
```

### 5.2 间接光照 IBL（Split-Sum）

在 `PS_DirLight` 的 PBR 分支：

```hlsl
float3 N = normalize(vNormal);
float3 V = -normalize(vPosition);                // view space
float3 F0 = lerp(0.04, albedo, metallic);
float  NdotV = max(dot(N,V), 0);

// Roughness-aware Fresnel (Lazarov 2013)
float3 F_ibl = FresnelSchlickRoughness(NdotV, F0, roughness);
float3 kS_ibl = F_ibl;
float3 kD_ibl = (1 - kS_ibl) * (1 - metallic);

// --- Diffuse IBL ---
float3 N_world = mul(float4(N,0), g_matViewInv).xyz;
float3 irradiance = Irradiance_Map.Sample(g_Sam_0, N_world).rgb;
float3 diffuseIBL = kD_ibl * irradiance * albedo;

// --- Specular IBL (Split-Sum) ---
float3 R_view  = reflect(-V, N);
float3 R_world = mul(float4(R_view,0), g_matViewInv).xyz;
float  MAX_LOD = 4.0;
float3 prefiltered = Prefiltered_Map.SampleLevel(g_Sam_0, R_world, roughness * MAX_LOD).rgb;
float2 brdf  = BRDFLut.Sample(g_Sam_Clamp, float2(NdotV, roughness)).rg;
float3 specularIBL = prefiltered * (F_ibl * brdf.x + brdf.y);

float3 ambient = (diffuseIBL + specularIBL) * AO * 0.5;
output.vDiffuse.rgb = light.vDiffuse * (1 - shadow) + ambient;
```

### 关键点

1. **视图空间法线必须转回世界空间再采样 cubemap**——立方体贴图在世界空间中烘焙，所以 `N_world = (matViewInv) · N_view`。
2. **`FresnelSchlickRoughness`**（pbr.fx）：在粗糙表面上 Fresnel 应趋向于较亮的菲涅尔反射（避免粗糙金属边缘看起来太暗），用 `max(1-r, F0)` 替代经典 Schlick 中的 `1`。
3. **`g_Sam_Clamp`** 对 BRDFLut 是必须的：边界 wrap 会读到对侧错误数据。
4. **MAX_REFLECTION_LOD = 4**：对应 5 mip 级（0..4），与 `PREFILTER_MIP_LEVELS = 5` 一致。
5. 阴影使用 **5×5 PCF** + slope-scaled bias `max(0.005·(1-NdotL), 0.001)`，仅作用于直接光，IBL 不受阴影影响（这是常见近似，更精确需要 SSGI 或 Bent Normal）。

---

## 6. CIBLManager 资源调度

`CIBLManager::GenerateFromEquirect` 是 CPU 侧的核心调度器：

```cpp
// (1) 创建所有资源 - BeginFrame 之前
m_EnvCubemap    = Create(1024, mips=0);   // 0 = 全 mip 链
m_IrradianceMap = Create(32);
m_PrefilterMap  = Create(256, mips=5);
scratch         = Create(1024, mips);

// (2) 一帧内完成所有命令
DX12Device::BeginFrame();
    pCmdList = device->GetCommandList();

    // 2a. Equirect → Env mip 0
    m_pEquirectToCubeCS->SetEquirectTexture(hdr);
    m_pEquirectToCubeCS->SetOutputCubeMapTex(env, 1024);
    m_pEquirectToCubeCS->Execute();

    // 2b. Env mip chain (Karis)
    for (mip=1..mipLevels){
        Copy(env mip-1 → scratch mip-1, 6 faces);
        m_pGenMipsCubemapCS->SetSrcMipTex(scratch); SetSrcMip(mip-1);
        m_pGenMipsCubemapCS->SetDstCubemap(env);    SetDstMip(mip);
        m_pGenMipsCubemapCS->Execute();
    }

    // 2c. Diffuse IBL
    m_pIrradianceCS->Execute();

    // 2d. Specular IBL (5 mips)
    for (mip=0..4){
        m_pPrefilterCS->SetMipLevel(size>>mip, mip, mip/4.0);
        m_pPrefilterCS->Execute();
    }
DX12Device::EndFrame();   // GPU 完成后才能释放 scratch

// (3) 释放 scratch
DeleteAsset(L"IBL_EnvCubemapScratch");
m_bReady = true;
```

**BRDF LUT 在 `init()` 中只生成一次**（与场景无关，永远不变）。

### 资源屏障的隐含约定

每个 `Execute()` 在 RHI 内部会：
1. 把输入 SRV 资源转到 `NON_PIXEL_SHADER_RESOURCE`；
2. 把输出 UAV 资源转到 `UNORDERED_ACCESS`；
3. dispatch；
4. 之后在下一次绑定时再转换。

由于 cubemap mip generation 必须**资源不同**才能避免 SRV/UAV 冲突，所以才需要 scratch（§3.2）。

### 运行时绑定

`Binding()` 在每帧光照前调用：

```cpp
m_BRDFLutTex   ->Binding(5);   // t5
m_IrradianceMap->Binding(7);   // t7
m_PrefilterMap ->Binding(8);   // t8
// t6 (env cubemap) 由 CSkyBox 绑定
```

槽位与 `deferred_lighting.fx` 的宏定义对应：
```
#define BRDFLut          g_tex_5
#define Irradiance_Map   g_texcube_1   (=t7)
#define Prefiltered_Map  g_texcube_2   (=t8)
```

---

## 7. 关键数据流图

```
┌───────────────────────────── OFFLINE ─────────────────────────────┐
│                                                                   │
│  HDR.hdr                                                          │
│     │                                                             │
│     ▼ CS_EquirectToCube                                           │
│  EnvCubemap mip0 ──┐                                              │
│                    │ for each mip:                                │
│                    │   Copy + CS_GenerateMipsCubemap (Karis)      │
│                    ▼                                              │
│  EnvCubemap full mip chain ─────────────┐                         │
│                    │                    │                         │
│       ┌────────────┴──────────┐         │                         │
│       ▼                       ▼         │                         │
│   CS_Irradiance         CS_Prefilter (mip 0..4)                   │
│       │                       │                                   │
│       ▼                       ▼                                   │
│   IrradianceMap         PrefilterMap                              │
│   (32×32×6)             (256×256×6, 5 mips)                       │
│                                                                   │
│  (one-time)                                                       │
│   CS_BRDFLut ─▶ BRDFLut (512×512 R16G16)                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────────── PER FRAME ────────────────────────────┐
│                                                                   │
│   Mesh + Material                                                 │
│        │                                                          │
│        ▼  VS/PS_Std3D_Deferred_PBR                                │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │ GBuffer:                                                 │    │
│   │  RT0 Albedo  RT1 Normal  RT2 Position                    │    │
│   │  RT3 Emissive  RT4 (Metallic, Roughness, AO, PBRflag)    │    │
│   └──────────────────────────────────────────────────────────┘    │
│        │                                                          │
│        ▼  PS_DirLight (Light Pass)                                │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │ Direct  : Cook-Torrance (D·G·F) + Lambert (kD·c/π)       │    │
│   │ Shadow  : 5×5 PCF on shadow map                          │    │
│   │ Indirect:                                                │    │
│   │   Diffuse  IBL = kD · IrradianceMap(N_world) · Albedo    │    │
│   │   Specular IBL = Prefilter(R_world, r·LOD)               │    │
│   │                  · (F · BRDFLut.x + BRDFLut.y)           │    │
│   │ Ambient = (DiffuseIBL + SpecularIBL) · AO · 0.5          │    │
│   └──────────────────────────────────────────────────────────┘    │
│        │                                                          │
│        ▼  Merging / Postprocess / Tonemap → Final image           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 附录：常见问题排查

| 现象 | 可能原因 |
|---|---|
| 镜面 IBL 出现"萤火虫"亮点 | EnvCubemap 没生成 mip 链；或 prefilter 没用 `mipLevel = 0.5·log2(saSample/saTexel)`；或 HDR 没 SoftClamp |
| 粗糙金属边缘发黑 | Fresnel 用了普通 Schlick 而不是 `FresnelSchlickRoughness` |
| 漫反射 IBL 偏色 / 太亮 | 忘记除以采样数；或忘了乘 `cos(θ)·sin(θ)` 雅可比；或两次 sRGB 转线性 |
| BRDF LUT 边缘异常 | 没用 `Clamp` 采样器，wrap 越界 |
| Cubemap 旋转后接缝 | `_world` 转换矩阵写错；或忘了对 `R_world` 用同样的 Y 轴旋转 |
| GBuffer 法线贴图方向错 | OpenGL/DirectX 法线 Y 翻转标志 `g_int_1` 配反了 |
| GenerateMips D3D12 报错"resource state" | 缺少 scratch cubemap（参见 §3.2） |

---

> **完。** 本管线的物理真实性来自三块基石：
> 1. **Cook-Torrance 微表面 BRDF**（D·G·F / 4nv·nl） — 解决材质响应；
> 2. **Karis Split-Sum** — 把不可解析的环境光积分拆为可预计算的两项；
> 3. **GGX 重要性采样 + 低差异序列 + Mip-LOD trick** — 用 1024 个样本逼近无穷采样的结果。

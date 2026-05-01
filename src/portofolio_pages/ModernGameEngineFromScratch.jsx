import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowLeft,
  Box,
  Github,
  Clock,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

const sections = [
  { id: "intro", num: "0", title: "故事开始的地方:wWinMain" },
  { id: "engine-init", num: "1", title: "启动一次性的初始化:CEngine::Init" },
  { id: "scene-build", num: "2", title: "场景搭建:CTestLevel3D" },
  { id: "tick", num: "3", title: "一帧的 Tick 阶段:Progress" },
  { id: "render", num: "4", title: "CRenderMgr::render — 本帧主菜" },
  { id: "imgui", num: "5", title: "ImGui 与编辑器 UI" },
  { id: "present", num: "6", title: "Present:把 BackBuffer 交还 DXGI" },
  { id: "timeline", num: "7", title: "整帧时序图" },
  { id: "design", num: "8", title: "值得记住的设计选择" },
];

const codeStyle = {
  margin: 0,
  padding: "1.25rem 1.5rem",
  borderRadius: "12px",
  background: "rgba(13, 20, 27, 0.85)",
  fontSize: "0.85rem",
  border: "1px solid rgba(32,178,166,0.18)",
};

const Code = ({ language = "cpp", children }) => (
  <div className="my-5">
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={codeStyle}
    >
      {children}
    </SyntaxHighlighter>
  </div>
);

const SectionHeading = ({ num, id, children }) => (
  <h2
    id={id}
    className="scroll-mt-28 mt-20 mb-8 flex items-baseline gap-4 font-bold text-3xl md:text-4xl"
  >
    <span className="font-mono text-primary text-lg md:text-xl tracking-widest opacity-70">
      {String(num).padStart(2, "0")}
    </span>
    <span className="text-foreground">{children}</span>
  </h2>
);

const SubHeading = ({ children }) => (
  <h3 className="mt-12 mb-4 text-xl md:text-2xl font-semibold text-primary/95 flex items-center gap-2">
    <span className="w-1 h-5 bg-primary rounded-full" />
    {children}
  </h3>
);

const Para = ({ children }) => (
  <p className="text-[0.97rem] leading-[1.85] text-foreground/85 my-4">
    {children}
  </p>
);

const InlineCode = ({ children }) => (
  <code className="px-1.5 py-0.5 mx-0.5 rounded text-[0.85em] font-mono text-primary bg-primary/10 border border-primary/15">
    {children}
  </code>
);

const Callout = ({ children }) => (
  <div
    className="my-6 rounded-xl px-5 py-4 flex gap-3 items-start text-[0.95rem] leading-[1.8] text-foreground/85"
    style={{
      background: "rgba(32,178,166,0.06)",
      borderLeft: "3px solid #20b2a6",
    }}
  >
    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-1.5" />
    <div>{children}</div>
  </div>
);

const FancyTable = ({ headers, rows }) => (
  <div className="my-6 overflow-x-auto rounded-xl glass">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-primary/20">
          {headers.map((h, i) => (
            <th
              key={i}
              className="px-4 py-3 text-left text-primary font-semibold tracking-wide text-xs uppercase"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className="border-b border-border/30 last:border-b-0 hover:bg-primary/5 transition-colors"
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                className="px-4 py-3 text-foreground/85 align-top leading-relaxed"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OrderedList = ({ items }) => (
  <ol className="my-4 space-y-2 list-none">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3 items-start text-foreground/85 leading-[1.8] text-[0.95rem]">
        <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-mono text-primary">
          {i + 1}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

const BulletList = ({ items }) => (
  <ul className="my-4 space-y-2 list-none">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3 items-start text-foreground/85 leading-[1.8] text-[0.95rem]">
        <span className="mt-2.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const PassBadge = ({ pass, title }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
    <span className="font-mono text-xs text-primary">PASS {pass}</span>
    <span className="w-px h-3 bg-primary/30" />
    <span className="text-xs text-muted-foreground tracking-wide">{title}</span>
  </div>
);

export const ModernGameEngineFromScratch = ({ onBack, onNavigatePBR }) => {
  const [activeId, setActiveId] = useState(sections[0].id);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -65% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
          <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase hidden sm:inline">
            YannEngine · Devlog
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background grid + gradient */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#20b2a6 1px, transparent 1px), linear-gradient(90deg, #20b2a6 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #20b2a6, transparent 70%)" }}
        />

        <div className="relative container mx-auto px-6 pt-20 pb-16 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-primary mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Featured Personal Project · Devlog 01
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              <span className="text-primary glow-text">The Lifetime</span>
              <br />
              <span className="font-serif italic font-normal text-white">of a Frame</span>
              <br />
              <span className="text-foreground/80 text-3xl md:text-4xl lg:text-5xl">
                in YannEngine
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              一个像素是怎么诞生的？以 <InlineCode>CTestLevel3D</InlineCode> 为出发点,
              完整追踪一帧从 <InlineCode>wWinMain</InlineCode> 到{" "}
              <InlineCode>Present()</InlineCode> 的旅程。
            </p>

            {/* Meta row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>~ 25 min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span>DX11 / DX12 · PBR Deferred</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>11 Render Passes</span>
              </div>
            </div>

            {/* Tag chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "C++20",
                "DirectX 12",
                "DirectX 11",
                "PBR + IBL",
                "Cook-Torrance",
                "SSAO",
                "Shadow Map",
                "ImGui",
                "HLSL",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-mono text-primary"
                  style={{
                    background: "rgba(32,178,166,0.08)",
                    border: "1px solid rgba(32,178,166,0.22)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body: TOC + content */}
      <section className="container mx-auto px-6 pb-32 max-w-7xl">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-4">
                Contents
              </p>
              <nav className="flex flex-col gap-1 border-l border-border/40">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`relative pl-4 py-2 text-sm transition-colors ${
                      activeId === s.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {activeId === s.id && (
                      <span className="absolute -left-px top-2 bottom-2 w-[2px] bg-primary rounded-full" />
                    )}
                    <span className="font-mono text-xs opacity-60 mr-2">
                      {String(s.num).padStart(2, "0")}
                    </span>
                    {s.title.split(":")[0]}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 max-w-3xl">
            {onNavigatePBR && (
              <button
                onClick={onNavigatePBR}
                className="group w-full text-left mb-8 p-5 rounded-2xl transition-colors cursor-pointer"
                style={{
                  background: "rgba(32,178,166,0.06)",
                  border: "1px solid rgba(32,178,166,0.25)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-primary tracking-widest uppercase mb-1">
                      深度解析 · PBR + IBL
                    </p>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      完整 PBR + IBL 工作流程详解 →
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      从渲染方程、Cook-Torrance BRDF 到 Split-Sum 近似、GGX 重要性采样——
                      逐公式、逐行 HLSL 解析这套光照管线的物理基础。
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            )}
            <Para>
              YannEngine 是一个支持 <InlineCode>DX11/DX12</InlineCode> 双 RHI
              的延迟渲染引擎。它的渲染流水线以 PBR + IBL 为核心,辅以 SSAO、Cascade-less
              Shadow Map、HDR Tone Mapping 与 Forward 透明叠加。本文以{" "}
              <InlineCode>Project/Client/CTestLevel3D.cpp</InlineCode>{" "}
              中搭建的 Sponza 场景为案例,把"打开窗口 → 看见图像"这条路一寸一寸走完。
            </Para>

            {/* ===== 0 ===== */}
            <SectionHeading num={0} id="intro">
              故事开始的地方:<InlineCode>wWinMain</InlineCode>
            </SectionHeading>
            <Para>
              入口在 <InlineCode>Project/Client/main.cpp</InlineCode>。这里只做了三件事:
            </Para>
            <OrderedList
              items={[
                <>注册 Win32 窗口类、<InlineCode>CreateWindowW</InlineCode> 创建主窗口。</>,
                <>
                  <InlineCode>CEngine::GetInst()-&gt;Init(hWnd, Vec2(1280, 720))</InlineCode> ——
                  引擎自启动。
                </>,
                <>
                  <InlineCode>CTestLevel3D::CreateTestLevel()</InlineCode> ——
                  把场景塞进 <InlineCode>CLevel</InlineCode>,然后进入消息循环。
                </>,
              ]}
            />
            <Code>{`while (true)
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
}`}</Code>
            <Para>
              一帧 = <InlineCode>Progress()</InlineCode> +{" "}
              <InlineCode>Present()</InlineCode>。<InlineCode>Progress()</InlineCode>{" "}
              里再分 "Tick"(逻辑) 和 "Render"(渲染)。
            </Para>

            {/* ===== 1 ===== */}
            <SectionHeading num={1} id="engine-init">
              启动一次性的初始化:<InlineCode>CEngine::Init</InlineCode>
            </SectionHeading>
            <Para>
              <InlineCode>CEngine::Init</InlineCode>{" "}
              在每个进程生命周期里只跑一次,但它决定了之后每一帧能用什么资源。
            </Para>

            <SubHeading>1.1 创建 RHI 设备</SubHeading>
            <Para>
              <InlineCode>CEngine.cpp:60</InlineCode> 根据宏开关二选一:
            </Para>
            <Code>{`#ifdef USE_DX12
    g_pRHIDevice = DX12Device::GetInst();
    DX12Device::GetInst()->init(m_hMainHwnd, m_Resolution);
#else
    g_pRHIDevice = DX11Device::GetInst();
    DX11Device::GetInst()->init(...);
#endif`}</Code>
            <Para>
              以 DX12 路径为例(<InlineCode>DX12Device::init</InlineCode>),它依次完成:
            </Para>
            <FancyTable
              headers={["步骤", "做了什么"]}
              rows={[
                ["1", "启用 D3D12 Debug Layer (Debug 构建)"],
                ["2", <>枚举显存最大的硬件 Adapter,创建 <InlineCode>ID3D12Device2</InlineCode></>],
                ["3", <>创建 <InlineCode>DIRECT / COMPUTE / COPY</InlineCode> 三条命令队列</>],
                ["4", "创建 SwapChain (FLIP_DISCARD,3-back-buffer,允许 Tearing)"],
                ["5", "为四种描述符堆类型各分配一个 DescriptorAllocator,预创建 Null SRV/UAV"],
                ["6", <>把三张 BackBuffer 注册进 ResourceStateTracker,包装成 <InlineCode>CTexture(L"RenderTargetTex")</InlineCode></>],
                ["7", "创建 Graphics / Compute Root Signature"],
                ["8", <>创建 4 个全局常量缓冲区 <InlineCode>tTransform / tMaterialConst / tAnim2DInfo / tGlobalData</InlineCode></>],
                ["9", <>实例化 <InlineCode>DX12RHICommandList</InlineCode>(对外暴露的 <InlineCode>IRHICommandList*</InlineCode>)</>],
                ["10–11", "预生成所有光栅化、深度模板、混合状态模板,供 PSO 装配复用"],
              ]}
            />

            <Para>Root Signature 的布局是整套渲染的"宪法":</Para>
            <Code language="text">{`[0] CBV b0 — TRANSFORM     (W/V/P 等矩阵)
[1] CBV b1 — MATERIAL      (vec4_*, float_*, int_*, bTex[])
[2] CBV b2 — ANIMATION
[3] CBV b3 — GLOBAL DATA   (vResolution, lightCount, time...)
[4] Descriptor Table — 32 SRVs (t0–t31)
[5] Descriptor Table — 8 UAVs  (u0–u7)
Static Samplers: s0 aniso/wrap, s1 point/wrap, s2 linear/clamp`}</Code>
            <Para>
              所有 Shader 共用同一个 Root Signature —— 这是 DX12 端做"DX11 风格命名绑定"的关键:
              t0–t31 是固定语义槽 (<InlineCode>g_tex_0..g_tex_31</InlineCode> /{" "}
              <InlineCode>g_texcube_0..</InlineCode>),材质和管线只需要往这些槽里塞 SRV。
            </Para>

            <SubHeading>1.2 创建各路 Manager</SubHeading>
            <Code>{`CPathMgr::init();   CTimeMgr::init();   CKeyMgr::init();
CAssetMgr::init();  CRenderMgr::init(); CLevelMgr::init();`}</Code>
            <Para>
              <InlineCode>CAssetMgr::init</InlineCode> 会注册引擎内置资产 —— Mesh
              (<InlineCode>RectMesh / SphereMesh / ConeMesh / CubeMesh</InlineCode>)、
              Shader (<InlineCode>Std3DDeferredPBRShader / DeferredDirLightingShader / SSAOShader / ToneMappingShader / IBL 计算着色器…</InlineCode>)、
              默认材质 (<InlineCode>Std3DDeferredPBRMaterial</InlineCode> 等)。
            </Para>

            <SubHeading>1.3 CRenderMgr::init — 搭建 7 个 MRT</SubHeading>
            <Para>
              <InlineCode>CRenderMgr_Init.cpp</InlineCode> 一次性创建后续每帧都要复用的
              7 个 <InlineCode>CRenderTargetSet</InlineCode>:
            </Para>
            <FancyTable
              headers={["MRT", "颜色目标", "格式", "用途"]}
              rows={[
                ["SWAPCHAIN", "RenderTargetTex", "R8G8B8A8_UNORM", "最终呈现到窗口"],
                ["DEFERRED", "Color / Normal / Position / Emissive / CustomData", "RGBA16F + RGBA32F×4", "G-Buffer"],
                ["SSAO", "SSAOTexture", "R8_UNORM", "SSAO 原始 AO"],
                ["SSAO_BLUR", "SSAOBlurTex", "R8_UNORM", "双边模糊后的 AO"],
                ["DEFERRED_LIGHT", "GBuffer_Diffuse / GBuffer_Specular", "RGBA32F×2", "累计直接光照 + IBL"],
                ["DEFERRED_DECAL", "GBuffer_Color / GBuffer_Emissive", "(复用 G-Buffer)", "Decal 在 G-Buffer 上盖章"],
                ["HDR_SCENE", "HDRSceneTex", "RGBA16F", "Merge 后的 HDR + Forward 通道目标"],
              ]}
            />
            <Callout>
              G-Buffer Position 用 <InlineCode>R32G32B32A32_FLOAT</InlineCode>{" "}
              直接存视空间坐标 —— 简单直观,但代价是带宽,后续优化方向是从深度重建。
            </Callout>

            <SubHeading>1.4 CIBLManager::init — 把 BRDF LUT 烘出来</SubHeading>
            <Para>
              <InlineCode>CIBLManager::init</InlineCode> 抓取 5 个 IBL 计算着色器
              (<InlineCode>EquirectToCubeCS / IBLIrradianceCS / IBLPrefilterCS / BRDFLutCS / GenMipsCubemapCS</InlineCode>),然后:
            </Para>
            <Code>{`DX12Device::GetInst()->BeginFrame();   // 开一条 CL
GenerateBRDFLut();                     // 512x512 RG16F,view-independent
DX12Device::GetInst()->EndFrame();     // 提交 + WaitForFenceValue`}</Code>
            <Para>
              BRDF LUT 与具体环境无关,只与 <InlineCode>(NdotV, roughness)</InlineCode>{" "}
              有关,<strong className="text-primary">整个进程只算一次</strong>。
              Irradiance Map 与 Prefilter Map 要等到 SkyBox 设置贴图时才生成。
            </Para>
            {onNavigatePBR && (
              <Callout>
                想深入了解 PBR + IBL 每一步的数学原理与 HLSL 实现？
                {" "}
                <button
                  onClick={onNavigatePBR}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
                >
                  查看完整 PBR + IBL 工作流程详解
                  <ChevronRight className="w-3 h-3" />
                </button>
              </Callout>
            )}

            {/* ===== 2 ===== */}
            <SectionHeading num={2} id="scene-build">
              场景搭建:<InlineCode>CTestLevel3D</InlineCode>
            </SectionHeading>
            <Para>
              回到 <InlineCode>Project/Client/CTestLevel3D.cpp</InlineCode>。
              这是用户视角能修改最多的地方,也是引擎"输入"的来源。
            </Para>

            <SubHeading>2.1 Layer 与 Object</SubHeading>
            <Code>{`CLevel* pLevel = new CLevel;
pLevel->GetLayer(0)->SetName(L"Default");
pLevel->GetLayer(1)->SetName(L"Player");
pLevel->GetLayer(2)->SetName(L"Monster");`}</Code>
            <Para>
              <InlineCode>CLevel</InlineCode> 内部有 <InlineCode>MAX_LAYER (32)</InlineCode>{" "}
              个 <InlineCode>CLayer</InlineCode>,每个 Layer 持有一组{" "}
              <InlineCode>CGameObject*</InlineCode>。<InlineCode>CCamera::m_LayerCheck</InlineCode>{" "}
              是一个位图,决定相机看哪几层。
            </Para>

            <SubHeading>2.2 Directional Light</SubHeading>
            <Code>{`CGameObject* pLight = new CGameObject;
pLight->AddComponent(new CTransform);
pLight->AddComponent(new CLight3D);
pLight->Light3D()->SetLightType(LIGHT_TYPE::DIRECTIONAL);
pLight->Light3D()->SetIsRenderShadow(true);
pLight->Transform()->SetRelativePos(Vec3(-157.f, 1916.f, -88.f));
pLight->Transform()->SetRelativeRotation(Vec3(XM_PI / 3.f, 0.f, 0.f));`}</Code>
            <Para>
              <InlineCode>CLight3D::SetLightType(DIRECTIONAL)</InlineCode> 有副作用:
            </Para>
            <BulletList
              items={[
                <>把光体网格设为 <InlineCode>RectMesh</InlineCode>(全屏 quad);</>,
                <>把延迟光照材质指向 <InlineCode>DeferredDirLightingMaterial</InlineCode>;</>,
                <>创建 ShadowMap 专用的 <InlineCode>CRenderTargetSet</InlineCode>(2048×2048 R32_FLOAT + D24S8),clear color 设为 1;</>,
                <>给该光准备一个独立 <InlineCode>CCamera</InlineCode> —— <InlineCode>m_LightCamObj</InlineCode>,投影类型为正交,负责 ShadowMap 渲染。</>,
              ]}
            />

            <SubHeading>2.3 Sponza Knight 与 PBR Material Instance</SubHeading>
            <Para>
              <InlineCode>pSponzaKnight</InlineCode> 上挂{" "}
              <InlineCode>CTransform / CMeshRenderer / CBoundingBox</InlineCode>,
              网格走 Assimp 加载。多 SubMesh(7 段)分别赋 7 个{" "}
              <InlineCode>CMaterialInstance</InlineCode>,共享同一个{" "}
              <InlineCode>Std3DDeferredPBRMaterial</InlineCode> 的 Shader 与默认参数,
              只覆写贴图与标量:
            </Para>
            <Code>{`CMaterialInstance* pMI_Armor = new CMaterialInstance;
pMI_Armor->SetParentMaterial(pPBRParent);
pMI_Armor->SetScalarOverride(SCALAR_PARAM::INT_3, 1);    // TEX_0 已是线性空间
pMI_Armor->SetTexOverride(TEX_PARAM::TEX_0, texMetalD);  // BaseColor
pMI_Armor->SetScalarOverride(SCALAR_PARAM::FLOAT_0, 1.0f);  // metallic
pMI_Armor->SetScalarOverride(SCALAR_PARAM::FLOAT_1, 0.3f);  // roughness
pSponzaKnight->MeshRenderer()->SetMaterial(pMI_Armor, 0);`}</Code>
            <Para>
              <InlineCode>SCALAR_PARAM::INT_2</InlineCode> 用于切换 ORM 和 glTF MR 打包格式,
              <InlineCode>INT_3</InlineCode> 控制是否跳过 sRGB→linear。这些 int / float
              槽位的语义在 <InlineCode>std3d_deferred_pbr.fx</InlineCode> 的注释顶部已写明。
            </Para>

            <SubHeading>2.4 SkyBox + IBL 触发</SubHeading>
            <Code>{`pSkyBox->SkyBox()->SetSkyBoxType(SKYBOX_TYPE::SPHERE);
pSkyBox->SkyBox()->SetSkyBoxTexture(
    CAssetMgr::GetInst()->Load<CTexture>(L"plains_sunset_4k",
                                         L"texture\\\\SkyBox\\\\venice_sunset_4k.hdr"));`}</Code>
            <Para>
              <InlineCode>CSkyBox::SetSkyBoxTexture</InlineCode> 对 SPHERE 类型(equirect HDR)
              会<strong className="text-primary"> 同步 </strong>地启动 IBL 离线烘焙:
            </Para>
            <Code>{`DX12Device::GetInst()->BeginFrame();
CIBLManager::GetInst()->GenerateFromEquirect(m_SkyBoxTexture);
DX12Device::GetInst()->EndFrame();   // ExecuteCommandList + Wait`}</Code>
            <Para>
              <InlineCode>GenerateFromEquirect</InlineCode> 内部一气呵成跑完 4 步 Compute:
            </Para>
            <OrderedList
              items={[
                <><InlineCode>CEquirectToCubeCS</InlineCode> — 1024² ×6 面 RGBA16F 立方体贴图,带完整 mip 链;</>,
                <><InlineCode>CGenMipsCubemapCS</InlineCode> — 手动生成 mip(替代 DX11 的硬件 GenerateMips);</>,
                <><InlineCode>CIBLIrradianceCS</InlineCode> — 卷积成 32² 的辐照度 Cubemap(漫反射 IBL);</>,
                <><InlineCode>CIBLPrefilterCS</InlineCode> — 256² 5 mip 的预过滤 Cubemap(各 mip 对应不同 roughness);</>,
              ]}
            />
            <Para>
              烘焙完毕后 <InlineCode>m_bReady = true</InlineCode>,后续每帧{" "}
              <InlineCode>Binding()</InlineCode> 会把它们 bind 到 t5 (BRDF LUT)、
              t7 (Irradiance)、t8 (Prefilter)。
            </Para>

            <SubHeading>2.5 Sponza & Sponza Curtains</SubHeading>
            <Code>{`CGameObject* pSponza = CModelImporter::Load(L"mesh\\\\sponza\\\\NewSponza_Main_glTF_003.gltf");
pSponza->Transform()->SetRelativeScale(Vec3(100.f, 100.f, 100.f));
pLevel->AddObject(0, pSponza);`}</Code>
            <Para>
              <InlineCode>CModelImporter::Load</InlineCode> 读 glTF,递归创建{" "}
              <InlineCode>CGameObject</InlineCode> 树,自动按材质拆分 SubMesh,
              并为每个 SubMesh 实例化好 PBR 材质 —— 用户不需要手动写贴图绑定。
            </Para>
            <Para>
              最后 <InlineCode>ChangeLevel(pLevel, LEVEL_STATE::STOP)</InlineCode> 把 level
              推送给 <InlineCode>CLevelMgr</InlineCode>。STOP 状态意味着脚本不 tick,
              但 finaltick / 渲染全套照走 —— 这是编辑器模式的默认。
            </Para>

            {/* ===== 3 ===== */}
            <SectionHeading num={3} id="tick">
              一帧的 Tick 阶段:<InlineCode>CEngine::Progress</InlineCode>
            </SectionHeading>
            <Code>{`void CEngine::Progress()
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
}`}</Code>
            <Para>
              <InlineCode>CLevelMgr::tick</InlineCode> 内部分两段:
            </Para>
            <Code>{`m_CurLevel->tick();              // (PLAY 状态) 调脚本 tick
m_CurLevel->ClearRegisteredObjects();
m_CurLevel->finaltick();         // 永远走 —— 更新矩阵 / 注册到 Camera 与 RenderMgr`}</Code>
            <Para>
              <InlineCode>CCamera::finaltick</InlineCode> 在这里完成:
            </Para>
            <OrderedList
              items={[
                <>用 Transform 的 R/U/F 装出旋转矩阵,合成 <InlineCode>m_matView</InlineCode> 和 <InlineCode>m_matViewInv</InlineCode>;</>,
                <>透视/正交 + <InlineCode>m_FOV / m_AspectRatio / m_Far</InlineCode> 算 <InlineCode>m_matProj</InlineCode> + 逆;</>,
                <><InlineCode>m_Frustum.finaltick()</InlineCode> 把 6 个平面方程更新好,供 SortObjects 阶段做 AABB/Sphere 剔除。</>,
              ]}
            />
            <Para>
              <InlineCode>CLight3D::finaltick</InlineCode> 做的事:把{" "}
              <InlineCode>WorldPos / WorldDir</InlineCode> 同步进{" "}
              <InlineCode>tLightInfo</InlineCode>;<InlineCode>RegisterLight3D</InlineCode>{" "}
              把自己塞进 <InlineCode>CRenderMgr::m_vecLights3D</InlineCode>;
              把灯光 Transform <strong className="text-primary">拷贝</strong>到自带的
              ShadowMap 相机,然后 finaltick 一次该相机。
            </Para>

            <SubHeading>3.1 DX12Device::BeginFrame</SubHeading>
            <Code>{`m_CurrentCmdList = commandQueue->GetCommandList();   // 从 pool 复用一条 CL
m_CurrentCmdList->SetComputeRootSignature(...);
m_CurrentCmdList->SetGraphicsRootSignature(...);
m_CurrentCmdList->SetViewport(vp);
m_CurrentCmdList->SetScissorRect(sr);

// ★ 关键: 把 "RenderTargetTex" 重新指向当前 BackBuffer
ComPtr<ID3D12Resource> currentBB = m_BackBufferTextures[m_CurrentBackBufferIndex].GetD3D12Resource();
static_cast<DX12RHITexture*>(pRTTex->GetRHITexture())->CreateFromExisting(
    currentBB, RHI_BIND_FLAG::RENDER_TARGET);`}</Code>
            <Callout>
              这是 DX12 端 Triple-buffering 的精髓:引擎层面只认一张{" "}
              <InlineCode>RenderTargetTex</InlineCode>,但每帧它的底层{" "}
              <InlineCode>ID3D12Resource</InlineCode> 会跟着{" "}
              <InlineCode>m_CurrentBackBufferIndex</InlineCode> 滚动。
              所有 MRT、所有材质都不用感知这件事。
            </Callout>

            {/* ===== 4 ===== */}
            <SectionHeading num={4} id="render">
              <InlineCode>CRenderMgr::render</InlineCode> — 本帧主菜
            </SectionHeading>
            <Code>{`void CRenderMgr::render()
{
    m_NumDrawCalls = 0;
    ClearRenderTargetSet();   // 清各 MRT 颜色 + DSV
    DataBinding();            // 上传 GLOBAL CB + Light2D/Light3D 结构化缓冲
    (this->*RenderFunc)();    // ★ 编辑器走 render_editor;游戏走 render_play
    DataClear();              // 解绑 SRV 槽,清灯光数组
}`}</Code>
            <Para>
              我们走 <InlineCode>CTestLevel3D</InlineCode> 在编辑器模式下的路径 ——
              <InlineCode>render_editor</InlineCode>。它就是这篇文章的主线。
            </Para>

            <SubHeading>4.1 全局 CB + 灯光 SBO 上传</SubHeading>
            <Para>
              <InlineCode>DataBinding</InlineCode> 把{" "}
              <InlineCode>g_GlobalData</InlineCode>(分辨率/灯光数/时间)写进 b3 的{" "}
              <InlineCode>tGlobalData</InlineCode> 常量缓冲;然后把这一帧的{" "}
              <InlineCode>tLightInfo</InlineCode> 数组上传到{" "}
              <InlineCode>m_Light2DBuffer / m_Light3DBuffer</InlineCode> 两个 SRV-only
              结构化缓冲,绑到 t15、t16,后续 lighting 着色器靠下标取{" "}
              <InlineCode>g_Light3D[Light3D_Idx]</InlineCode>。
            </Para>

            <PassBadge pass="0" title="Shadow Map" />
            <SubHeading>4.2 阴影烘焙</SubHeading>
            <Code>{`m_ShadowMapMRT->ClearTargets();
m_ShadowMapMRT->ClearDepthStencil();
m_ShadowMapMRT->OMSet();        // 切到 2048×2048 单 RT + DSV

// Texel snapping:让阴影边缘随相机移动时不再"游泳"
float fHalfRes = SHADOWMAP_RESOLUTION_HIGH * 0.5f;
Vec4 vOrigin = XMVector4Transform(XMVectorSet(0,0,0,1), matView * matProj);
float snappedX = roundf(vOrigin.x * fHalfRes) / fHalfRes;
float snappedY = roundf(vOrigin.y * fHalfRes) / fHalfRes;
matProj._41 -= (vOrigin.x - snappedX);
matProj._42 -= (vOrigin.y - snappedY);

g_Trans.matView = matView;
g_Trans.matProj = matProj;       // ★ 用 light camera 的 V/P 覆盖全局矩阵
pLightCam->SortObjects_ShadowMap();
pLightCam->render_shadowmap();   // 用 shadowmap.fx 的 VS_ShadowMap / PS_ShadowMap`}</Code>
            <Para>
              ShadowMap PS 极简:把 <InlineCode>clip.z / clip.w</InlineCode>{" "}
              写进单通道 R32F。这就是后面 PCF 用的深度。
            </Para>

            <PassBadge pass="1" title="Camera V/P + Sort" />
            <SubHeading>4.3 写入相机视角的 V/P + 排序场景</SubHeading>
            <Code>{`g_Trans.matView    = m_EditorCam->GetViewMat();
g_Trans.matViewInv = m_EditorCam->GetViewMatInv();
g_Trans.matProj    = m_EditorCam->GetProjMat();
g_Trans.matProjInv = m_EditorCam->GetProjMatInv();
m_EditorCam->SortObjects();`}</Code>
            <Para>
              <InlineCode>SortObjects</InlineCode> 遍历所有打开的 Layer,先做 frustum culling,
              再按每个 SubMesh 的 Shader Domain 把对象<strong className="text-primary">重复</strong>塞进
              7 个桶里:Deferred / DeferredDecal / Opaque / Masked / Transparent / Particle / PostProcess。
            </Para>
            <Callout>
              同一个 Object 可能因为 SubMesh 分别用了不透明 PBR 与玻璃 Forward 着色器,
              而同时出现在多个桶里 —— 这是引擎支持"一个 mesh 多种渲染域"的关键。
            </Callout>

            <PassBadge pass="2" title="Bind IBL" />
            <SubHeading>4.4 IBL 三件套绑定</SubHeading>
            <Para>
              <InlineCode>CIBLManager::Binding()</InlineCode> 把 BRDF LUT (t5)、
              Irradiance Cubemap (t7)、Prefilter Cubemap (t8) 推到对应槽位。
              这三张图在整帧里被反复使用,所以提前一次性绑好。
            </Para>

            <PassBadge pass="3" title="G-Buffer Geometry" />
            <SubHeading>4.5 G-Buffer Geometry Pass</SubHeading>
            <Code>{`m_MRT[(UINT)MRT_TYPE::DEFERRED]->OMSet();   // 5 RT + DSV
m_EditorCam->render_deferred();`}</Code>
            <Code>{`Transform()->Binding();             // ★ 写 W/V/P/WV/WVP 到 b0 (TRANSFORM CB)
SHADER_DOMAIN eCurDomain = CRenderMgr::GetCurRenderDomain();
for (UINT i = 0; i < subCount; ++i)
{
    Ptr<CMaterial> pMtrl = GetMaterial(i);
    if (pMtrl->GetShader()->GetDomain() != eCurDomain) continue;
    pMtrl->Binding();
    GetMesh()->render_submesh(i);
}`}</Code>
            <Para>
              <InlineCode>CMaterial::Binding()</InlineCode> 三步走:
            </Para>
            <OrderedList
              items={[
                <><InlineCode>m_Shader-&gt;Binding()</InlineCode> —— DX12 端会拼装 PSO(InputLayout、RS/DS/BS、5 个 RT 格式),并把 PSO + Root Signature 绑定到 CL。这里是 PSO 缓存命中的位置。</>,
                <>遍历 <InlineCode>TEX_PARAM::TEX_0..TEX_END</InlineCode>,有名字的就当帧重新 FindAsset,把 SRV Binding(i) 到对应 t 槽,并写 <InlineCode>m_Const.bText[i] = true</InlineCode>。</>,
                <>把 <InlineCode>tMaterialConst</InlineCode>(int[4] / float[4] / vec2[4] / vec4[4] / mat[4] / bTex[N])上传到 b1。</>,
              ]}
            />
            <Para>
              GPU 那边运行的就是 <InlineCode>std3d_deferred_pbr.fx</InlineCode>:
            </Para>
            <BulletList
              items={[
                <>VS 把位置、法线、切线、双切线全转成 <strong className="text-primary">view space</strong> —— G-Buffer Position 与 Normal 都在 view space,后续 Lighting 不需要再做世界→视空间的变换;</>,
                <>PS 写出 5 张 RT:<InlineCode>SV_Target0</InlineCode> Albedo;<InlineCode>SV_Target1</InlineCode> View-space Normal;<InlineCode>SV_Target2</InlineCode> View-space Position(Alpha=1 标记几何体存在);<InlineCode>SV_Target3</InlineCode> Emissive;<InlineCode>SV_Target4</InlineCode> (Metallic, Roughness, AO, 1.0)。</>,
              ]}
            />

            <PassBadge pass="4" title="Decal" />
            <SubHeading>4.6 Decal Pass</SubHeading>
            <Code>{`m_MRT[(UINT)MRT_TYPE::DEFERRED_DECAL]->OMSet();   // 直接附着 GBuffer_Color + GBuffer_Emissive
m_EditorCam->render_deferred_decal();`}</Code>
            <Para>
              Decal 不写新 RT,而是用 <InlineCode>BS_TYPE::DECAL_BLEND</InlineCode>{" "}
              把投影盒子里的像素<strong className="text-primary">叠加</strong>回 G-Buffer
              的颜色和 emissive 通道。
            </Para>

            <PassBadge pass="5" title="SSAO + Blur" />
            <SubHeading>4.7 SSAO</SubHeading>
            <Code>{`// 1) 生成
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
pSSAOBlurTex->Binding(17);`}</Code>
            <Para>
              <InlineCode>ssao.fx</InlineCode> 用 32 个 cosine-weighted hemisphere 样本,
              <InlineCode>g_matProj</InlineCode> 把 view-space 偏移投回屏幕 UV,
              采样位置的 <InlineCode>GBuffer_Position.z</InlineCode>,与样本点深度做带 BIAS
              的比较累计 occlusion。Sky 像素 (alpha &lt; 0.5) 被显式跳过,避免边缘黑边。
            </Para>

            <PassBadge pass="6" title="Deferred Lighting" />
            <SubHeading>4.8 Cook-Torrance + IBL + Shadow PCF</SubHeading>
            <Code>{`m_MRT[DEFERRED_LIGHT]->OMSet();   // GBuffer_Diffuse + GBuffer_Specular
for (auto* pLight : m_vecLights3D)
    pLight->ApplyLighting();`}</Code>
            <Code>{`Binding();           // ★ 给 DeferredDirLightingMaterial 设 light idx / shadow / IBL / SSAO
m_VolumeMesh->render();   // Directional → 全屏 quad;Point → 球;Spot → 锥`}</Code>
            <Para>
              GPU 在 <InlineCode>deferred_lighting.fx</InlineCode> 的{" "}
              <InlineCode>PS_DirLight</InlineCode> 里干这件事:
            </Para>
            <OrderedList
              items={[
                <>从 <InlineCode>GBuffer_Position</InlineCode> 拿视空间位置(α=0 直接 discard 天空);</>,
                <><strong className="text-primary">Shadow Sampling</strong> —— 把 view-space → world-space → light-clip-space,经 5×5 PCF 算 ShadowPower。bias 是 slope-scaled <InlineCode>max(0.005*(1-NdotL), 0.001)</InlineCode>;</>,
                <>看 <InlineCode>GBuffer_Data.a</InlineCode>:&gt; 0.5 走 <strong className="text-primary">PBR 路径</strong>(Cook-Torrance: GGX D + Smith G + Schlick F),叠加 Diffuse IBL(Irradiance × kD × albedo)与 Specular IBL(Prefiltered × BRDFLut),乘 SSAO blur 后的 AO 得到 ambient;≤ 0.5 走旧 Blinn-Phong 路径。</>,
              ]}
            />
            <Para>
              每盏灯都画一次,<strong className="text-primary">结果叠加</strong>进{" "}
              <InlineCode>GBuffer_Diffuse / GBuffer_Specular</InlineCode>。
            </Para>

            <PassBadge pass="7" title="Merge → HDR" />
            <SubHeading>4.9 Merge to HDR_SCENE</SubHeading>
            <Code>{`m_MRT[HDR_SCENE]->OMSet();      // R16G16B16A16_FLOAT
pMergingMat->SetTexParam(TEX_0..TEX_4, GBuffer_*);
pMergingMat->Binding();
pRectMesh->render();`}</Code>
            <Para>
              <InlineCode>deferred_merging.fx</InlineCode> 在 PBR 路径下只取
              Diffuse + Emissive(specular 已经被 Lo 吃掉了),
              Blinn-Phong 路径走经典 <InlineCode>Color * Diffuse + Specular + Emissive</InlineCode>。
            </Para>
            <Callout>
              注意此时输出还是 HDR(超 1.0 的浮点数),色调映射在 Pass 9 之后做。
            </Callout>

            <PassBadge pass="8" title="Forward (Sky / Glass / Particle)" />
            <SubHeading>4.10 Forward 透明 / 蒙版 / 粒子</SubHeading>
            <Code>{`m_EditorCam->render_opaque();       // DOMAIN_OPAQUE  —— 例如 SkyBox(写 HDR)
m_EditorCam->render_masked();       // DOMAIN_MASKED  —— alpha cutout
m_EditorCam->render_transparent();  // DOMAIN_TRANSPARENT —— PBR Glass
m_EditorCam->render_particle();`}</Code>
            <Para>
              SkyBox 走 DOMAIN_OPAQUE:在 HDR_SCENE RT 上,深度被推到 1.0、关闭深度写入,
              把 <InlineCode>venice_sunset_4k</InlineCode> 的 equirect 直接 sample 出来,作为远景。
              这样 SkyBox 的高动态范围信息和 PBR 物体共用 HDR Buffer。
            </Para>

            <PassBadge pass="9" title="Tone Mapping → SwapChain" />
            <SubHeading>4.11 ACES Filmic + sRGB Gamma</SubHeading>
            <Code>{`m_MRT[SWAPCHAIN]->OMSet();    // ★ 切回 BackBuffer
pToneMapMat->SetTexParam(TEX_0, HDRSceneTex);
pToneMapMat->SetScalarParam(FLOAT_0, 0.6f);  // exposure
pToneMapMat->SetScalarParam(INT_0, 0);       // 0=ACES, 1=Reinhard, 2=Uncharted2
pToneMapMat->Binding();
pRectMesh->render();`}</Code>
            <Para>
              <InlineCode>tonemapping.fx</InlineCode> 简单粗暴:乘 exposure → 选一个 operator
              (默认 ACES filmic) → <InlineCode>pow(mapped, 1/2.2)</InlineCode>{" "}
              做线性→sRGB 的 gamma。这是 HDR → R8G8B8A8_UNORM 的最后一道关。
            </Para>

            <PassBadge pass="10–11" title="Postprocess + Cleanup" />
            <SubHeading>4.12 收尾</SubHeading>
            <Code>{`m_EditorCam->render_postprocess();   // 内部先 CopyRenderTarget(BackBuffer → RenderTargetTexCopy)
                                     // 让 postprocess shader 既能读"前一帧帧缓冲"又能写当前帧
CIBLManager::GetInst()->Clear();     // 解绑 t5/t7/t8
m_MRT[SWAPCHAIN]->OMSet();           // ★ 转回 RT`}</Code>
            <Para>
              <InlineCode>DataClear</InlineCode> 把灯光数组清掉,并手动把 PS 的前 16 个 SRV
              槽 unbind:
            </Para>
            <Code>{`m_vecLights2D.clear();
m_vecLights3D.clear();
for (UINT i = 0; i < 16; ++i)
    pCmdList->ClearTextureSRV(i);   // 防止下帧 G-Buffer RT/SRV hazard`}</Code>
            <Callout>
              延迟管线最容易踩坑的就是 <strong className="text-primary">同一个纹理上一帧作为
              SRV、这一帧又作为 RT</strong> 触发 D3D12 的资源状态冲突。引擎在每帧末手动把
              PS 的前 16 个 SRV 槽全部 unbind,避免下一帧 OMSetRenderTargets 时
              GBuffer 还作为 SRV 挂着。
            </Callout>

            {/* ===== 5 ===== */}
            <SectionHeading num={5} id="imgui">
              ImGui 与编辑器 UI
            </SectionHeading>
            <Para>
              <InlineCode>render()</InlineCode> 跑完后,<InlineCode>main.cpp</InlineCode>{" "}
              接着调:
            </Para>
            <Code>{`CEditorMgr::tick();          // 更新编辑器相机移动等
CImGuiMgr::tick();           // ImGui::NewFrame → 绘制面板 → Render → 提交 ImGui draw data`}</Code>
            <Para>
              ImGui 用单独的 shader-visible CBV/SRV/UAV heap
              (<InlineCode>DX12Device::InitImGuiSrvHeap</InlineCode>,128 个槽,槽 0 留给字体)。
              UI 的所有 SRV 由 <InlineCode>AllocateImGuiSrvSlot</InlineCode> 分配并{" "}
              <InlineCode>CopyToImGuiSrvHeap</InlineCode> 拷过来。
              最后渲染到 BackBuffer (<InlineCode>PrepareBackBufferForImGui</InlineCode> 重设 RT)。
            </Para>

            {/* ===== 6 ===== */}
            <SectionHeading num={6} id="present">
              <InlineCode>Present</InlineCode>:把 BackBuffer 交还 DXGI
            </SectionHeading>
            <Code>{`auto& backBuffer = m_BackBufferTextures[m_CurrentBackBufferIndex];
m_CurrentCmdList->TransitionBarrier(backBuffer, D3D12_RESOURCE_STATE_PRESENT);
commandQueue->ExecuteCommandList(m_CurrentCmdList);   // 提交本帧所有命令
m_CurrentCmdList.reset();

m_SwapChain->Present(syncInterval, presentFlags);     // ★ 翻页
m_FenceValues[m_CurrentBackBufferIndex] = commandQueue->Signal();
m_CurrentBackBufferIndex = m_SwapChain->GetCurrentBackBufferIndex();
commandQueue->WaitForFenceValue(m_FenceValues[m_CurrentBackBufferIndex]);

++ms_FrameCount;
ReleaseStaleDescriptors(ms_FrameCount);   // 释放已"飞过 GPU"的描述符`}</Code>
            <Para>最后两件事是 GPU/CPU 同步的优雅细节:</Para>
            <BulletList
              items={[
                <>用 fence 记下"本帧提交之后我用过哪个 BackBuffer",下一帧拿到同一个 BackBuffer 之前等到对应 fence 完成 —— 这正是 triple-buffering 的核心约束。</>,
                <><InlineCode>ReleaseStaleDescriptors</InlineCode> 把上几帧已经 Present 完成的 descriptor allocation 回收 —— 配合 Allocate / Free 的延迟回收策略,DescriptorAllocator 不会泄漏也不会过早释放正在被 GPU 使用的 descriptor。</>,
              ]}
            />
            <Para>
              到这里,屏幕上才真正出现一帧画面。然后回到 <InlineCode>while(true)</InlineCode>,
              从 <InlineCode>CEngine::Progress</InlineCode> 重新开始。
            </Para>

            {/* ===== 7 ===== */}
            <SectionHeading num={7} id="timeline">
              整帧时序图
            </SectionHeading>
            <div
              className="my-6 rounded-xl overflow-x-auto"
              style={{
                background: "rgba(13, 20, 27, 0.85)",
                border: "1px solid rgba(32,178,166,0.18)",
              }}
            >
              <pre className="px-5 py-5 text-[0.78rem] leading-[1.6] font-mono text-foreground/85 whitespace-pre">
{`┌─ wWinMain ────────────────────────────────────────────────────────────┐
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
└───────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>

            {/* ===== 8 ===== */}
            <SectionHeading num={8} id="design">
              一些值得记住的设计选择
            </SectionHeading>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              {[
                {
                  t: "Root Signature 大一统",
                  d: "不分 PSO 切 Root Sig,全引擎共享一套 CBV+SRV table+UAV table,极大简化材质/Pass 切换的成本。代价是绑定颗粒度粗一些 —— 用 descriptor copy 而不是 root descriptor。",
                },
                {
                  t: "G-Buffer Position 直接存 view-space xyz",
                  d: "节省了「从深度重建位置」的代码量,但浪费 R32G32B32A32 的带宽。TODO 注释里已记录改造方向。",
                },
                {
                  t: "GBuffer_Data.a 当作 PBR/Blinn-Phong 路径标志",
                  d: "同一个 deferred lighting 着色器在两条路径之间分支,允许引擎在同场景里混用旧管线对象与 PBR 对象。",
                },
                {
                  t: "Light Camera + Texel Snapping",
                  d: "Directional Light 把灯光 Transform 整个拷到一个隐藏相机来复用整套 V/P 装配逻辑;Texel Snapping 让 ShadowMap 边缘随相机移动不再「游泳」。",
                },
                {
                  t: "IBL 是同步烘焙",
                  d: "SetSkyBoxTexture 会内联 BeginFrame / EndFrame —— 因为 BRDF LUT、Irradiance、Prefilter 在一帧内必须可读。切换天空盒会有一次 GPU stall,但只发生在场景加载时。",
                },
                {
                  t: "每帧手动 ClearTextureSRV(0..15)",
                  d: "避免上一帧的 G-Buffer SRV 还挂在 PS,与下一帧的 OMSetRenderTargets 撞资源状态 —— 延迟管线的高发雷区。",
                },
                {
                  t: "RenderTargetTex 的「逻辑别名」",
                  d: "DX12 端每帧把 RenderTargetTex 的底层资源指向当前 BackBuffer,引擎层完全不感知 triple-buffering。",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl glass hover:border-primary/40 transition-colors"
                  style={{ border: "1px solid rgba(32,178,166,0.12)" }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="font-mono text-xs text-primary mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground leading-snug">
                      {item.t}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>

            {/* Closing */}
            <div
              className="mt-16 p-8 rounded-2xl glass relative overflow-hidden"
              style={{ border: "1px solid rgba(32,178,166,0.25)" }}
            >
              <div
                className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full blur-3xl opacity-20"
                style={{ background: "radial-gradient(circle, #20b2a6, transparent 70%)" }}
              />
              <Box className="w-7 h-7 text-primary mb-3" />
              <p className="text-foreground/90 leading-[1.9] text-[0.97rem]">
                一帧从 <InlineCode>wWinMain</InlineCode> 走到{" "}
                <InlineCode>Present</InlineCode>,中间穿过{" "}
                <strong className="text-primary">
                  逻辑 tick → 阴影烘焙 → 5 张 G-Buffer → SSAO → Cook-Torrance + IBL Lighting →
                  Merge → 透明 Forward → Tone Map → Postprocess
                </strong>{" "}
                这十多道关,最终被 DXGI 翻页给屏幕。
                理解这条路径,基本就掌握了 YannEngine 在做什么,
                也大致清楚了"想加一个新效果"该从哪一段切入。
              </p>
            </div>

            {/* Footer nav */}
            <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-8">
              <button
                onClick={onBack}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to portfolio
              </button>
              <div className="flex items-center gap-6">
                {onNavigatePBR && (
                  <button
                    onClick={onNavigatePBR}
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    PBR + IBL 深度解析
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
                <a
                  href="https://github.com"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Source on GitHub
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

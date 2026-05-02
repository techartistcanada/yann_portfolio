import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Cpu,
  Github,
  Layers,
  MonitorUp,
  Network,
  ShieldCheck,
} from "lucide-react";

const sections = [
  { id: "summary", num: "0", title: "10-Second Summary" },
  { id: "bootstrap", num: "1", title: "Process Bootstrap" },
  { id: "engine-init", num: "2", title: "Engine Initialization" },
  { id: "scene", num: "3", title: "Scene Construction" },
  { id: "frame-entry", num: "4", title: "Frame Entry" },
  { id: "render-skeleton", num: "5", title: "Render Skeleton" },
  { id: "render-passes", num: "6", title: "11 Render Passes" },
  { id: "editor-overlay", num: "7", title: "Editor + ImGui Overlay" },
  { id: "present", num: "8", title: "Frame Submission" },
  { id: "resize", num: "9", title: "Resize Handling" },
  { id: "timeline", num: "10", title: "End-to-End Timeline" },
];

const codeStyle = {
  margin: 0,
  padding: "1.25rem 1.5rem",
  borderRadius: "12px",
  background: "rgba(13, 20, 27, 0.88)",
  border: "1px solid rgba(32,178,166,0.18)",
  fontSize: "0.82rem",
  lineHeight: 1.65,
};

const codeSummary = `WinMain
  -> CEngine::Init                  // RHI device + all managers
       -> CRenderMgr::init          // build MRTs, IBL pre-integration
  -> CTestLevel3D::CreateTestLevel  // spawn lights, meshes, camera
  -> Main loop:
       CEngine::Progress
         -> Tick   (Time / Key / Asset / Level / Collision)
         -> DX12Device::BeginFrame  // grab cmd list, rotate back buffer
         -> CRenderMgr::render
              -> render_editor -> 11 GPU passes -> HDRSceneTex -> SWAPCHAIN
       DX12Device::Present          // submit + flip + GPU fence wait`;

const progressCode = `// 1) CPU-side tick
CTimeMgr::tick();      // dt, FPS
CKeyMgr::tick();       // input edges
CAssetMgr::tick();     // hot reloads
CLevelMgr::tick();     // CLevel::tick() -> script tick + finaltick
CCollisionManager::tick();

// 2) GPU recording
DX12Device::BeginFrame();
CRenderMgr::render();`;

const renderSkeletonCode = `if (!CLevelMgr::GetCurrentLevel()) return;
m_NumDrawCalls = 0;

ClearRenderTargetSet();   // clear SWAPCHAIN, DEFERRED, DEFERRED_LIGHT, SSAO, SSAO_BLUR
DataBinding();            // upload globals, 2D & 3D light structured buffers
(this->*RenderFunc)();    // -> render_editor
DataClear();              // clear light vectors + unbind PS SRV slots 0..15`;

const timelineCode = `CPU                                            GPU
---                                            ---
CTimeMgr/Key/Asset/Level/Collision tick
DX12Device::BeginFrame  ---------------------> acquire CL, set RS+VP, rotate back buffer
CRenderMgr::render
  ClearRenderTargetSet  ---------------------> clear SWAPCHAIN/DEFERRED/LIGHT/SSAO
  DataBinding           ---------------------> upload globals + light arrays
  render_editor
    0  shadow maps      ---------------------> depth-only draws into shadow MRTs
    1  sort objects (CPU)
    2  IBL bind
    3  G-buffer pass    ---------------------> Color / Normal / Position / Emissive / CustomData
    4  Decal pass       ---------------------> Color + Emissive alias
    5  SSAO disabled
    6  Lighting pass    ---------------------> Diffuse + Specular accumulation
    7  Merge pass       ---------------------> HDRSceneTex
    8  Forward pass     ---------------------> opaque / masked / transparent / particles
    9  Tone mapping     ---------------------> SWAPCHAIN back buffer
    10 Post-process     ---------------------> CopyRenderTarget + post effects
    11 Cleanup          ---------------------> clear IBL + rebind SWAPCHAIN
CEditorMgr::tick + CImGuiMgr::tick ----------> overlay onto back buffer
DX12Device::Present  ------------------------> transition PRESENT, submit, flip, fence wait`;

const SectionHeading = ({ id, num, children }) => (
  <h2 id={id} className="scroll-mt-28 mt-20 mb-6 flex items-baseline gap-4">
    <span className="font-mono text-sm tracking-widest text-primary/75">{String(num).padStart(2, "0")}</span>
    <span className="text-3xl font-bold leading-tight text-foreground md:text-4xl">{children}</span>
  </h2>
);

const SubHeading = ({ children }) => (
  <h3 className="mt-10 mb-4 flex items-center gap-3 text-xl font-semibold text-primary/95">
    <span className="h-5 w-1 rounded-full bg-primary" />
    {children}
  </h3>
);

const Para = ({ children }) => <p className="my-4 text-[0.97rem] leading-[1.85] text-foreground/85">{children}</p>;

const InlineCode = ({ children }) => (
  <code className="mx-0.5 rounded border border-primary/15 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
    {children}
  </code>
);

const Code = ({ language = "cpp", children }) => (
  <div className="my-5 overflow-hidden rounded-xl">
    <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={codeStyle}>
      {children}
    </SyntaxHighlighter>
  </div>
);

const BulletList = ({ items }) => (
  <ul className="my-4 space-y-2">
    {items.map((item) => (
      <li key={String(item)} className="flex gap-3 text-[0.95rem] leading-[1.75] text-foreground/85">
        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const OrderedList = ({ items }) => (
  <ol className="my-4 space-y-3">
    {items.map((item, index) => (
      <li key={String(item)} className="flex gap-3 text-[0.95rem] leading-[1.75] text-foreground/85">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-mono text-xs text-primary">
          {index + 1}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

const Table = ({ headers, rows }) => (
  <div className="my-6 overflow-x-auto rounded-xl border border-primary/15 bg-surface/35">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-primary/15">
          {headers.map((header) => (
            <th key={header} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-border/30 last:border-0">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-4 py-3 align-top leading-relaxed text-foreground/85">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Callout = ({ title, children, icon: Icon = ChevronRight }) => (
  <div className="my-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
      <Icon className="h-4 w-4" />
      {title}
    </div>
    <div className="text-[0.95rem] leading-[1.75] text-foreground/85">{children}</div>
  </div>
);

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-primary/15 bg-surface/35 p-4">
    <Icon className="mb-3 h-5 w-5 text-primary" />
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const PassCard = ({ number, title, children }) => (
  <div className="rounded-xl border border-primary/15 bg-surface/35 p-5">
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
        PASS {number}
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

export const ModernGameEngineFromScratch = ({ onBack }) => {
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

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/75 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            type="button"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            YannEngine / Frame Lifetime
          </span>
        </div>
      </div>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#20b2a6 1px, transparent 1px), linear-gradient(90deg, #20b2a6 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative container mx-auto max-w-6xl px-6 pb-16 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Featured Personal Project / Technical Walkthrough
            </span>

            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
              <span className="text-primary glow-text">How a Frame</span>
              <br />
              <span className="font-serif italic font-normal text-white">Is Rendered</span>
              <br />
              <span className="text-3xl text-foreground/85 md:text-4xl lg:text-5xl">in YannEngine</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              A complete frame-lifetime walkthrough for <InlineCode>CTestLevel3D</InlineCode>, from process startup to the
              final pixel on the monitor, using the DX12 RHI backend and the editor render path.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <StatCard icon={Cpu} label="Backend" value="DX12 RHI, DX11 reference path" />
              <StatCard icon={Layers} label="Pipeline" value="Deferred PBR + IBL" />
              <StatCard icon={MonitorUp} label="Render Path" value="Editor mode, ImGui overlay" />
              <StatCard icon={Clock} label="Frame Scope" value="Startup to Present()" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["C++", "Direct3D 12", "RHI", "G-Buffer", "IBL", "Tone Mapping", "ImGui", "GPU Fences"].map((tag) => (
                <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-7xl gap-12 px-6 pb-28 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Contents</p>
            <nav className="border-l border-border/40">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`relative block px-4 py-2 text-sm transition-colors ${
                    activeId === section.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeId === section.id && <span className="absolute -left-px top-2 bottom-2 w-[2px] rounded-full bg-primary" />}
                  <span className="mr-2 font-mono text-xs opacity-70">{String(section.num).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="min-w-0 max-w-4xl">
          <div className="mb-14 overflow-hidden rounded-2xl border border-primary/20 bg-surface/35 shadow-2xl">
            <div className="border-b border-primary/10 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Rendered Scene Preview</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">CTestLevel3D / New Sponza Scene</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["DX12 RHI", "Deferred PBR", "IBL", "Editor Path"].map((tag) => (
                    <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative bg-black">
              <video
                className="aspect-video w-full object-contain"
                src="/projects/yannengine/sponza_scene.mp4"
                controls
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
            <p className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
              This is the scene used by the frame walkthrough below: a DX12 editor render path with deferred PBR,
              image-based lighting, G-buffer passes, tone mapping, and ImGui overlay support.
            </p>
          </div>

          <SectionHeading id="summary" num="0">
            The 10-Second Summary
          </SectionHeading>
          <Para>
            The full frame can be understood as eight major events: process startup, engine initialization, scene creation,
            CPU tick, command-list acquisition, editor rendering, swapchain output, and GPU submission.
          </Para>
          <Code language="text">{codeSummary}</Code>
          <Callout title="Why this matters for non-engine readers" icon={BookOpen}>
            The page separates startup work from per-frame work. Startup builds the engine objects and reusable GPU resources.
            Each frame then updates CPU-side state, records GPU work into ordered passes, overlays editor UI, and presents the
            result.
          </Callout>

          <SectionHeading id="bootstrap" num="1">
            Process Bootstrap / wWinMain
          </SectionHeading>
          <OrderedList
            items={[
              "Register the Win32 window class and create a 1280 x 720 HWND.",
              "Call CEngine::Init(hWnd, {1280, 720}) to initialize the RHI device and core managers.",
              "Initialize CEditorMgr and CImGuiMgr for the editor UI overlay, skipped in GAME_RELEASE.",
              "Call CTestLevel3D::CreateTestLevel() to populate the scene.",
              "Enter the Win32 PeekMessage loop. When the window is not resizing, run Progress(), editor ticks, ImGui ticks, and Present().",
            ]}
          />
          <Para>
            In practical terms, the main loop is a clear contract: <InlineCode>CEngine::Progress()</InlineCode> performs the
            frame update and render recording, while <InlineCode>DX12Device::Present()</InlineCode> submits and flips the
            swapchain.
          </Para>

          <SectionHeading id="engine-init" num="2">
            Engine Initialization / CEngine::Init
          </SectionHeading>
          <Para>
            <InlineCode>CEngine::Init</InlineCode> adjusts the window, selects the RHI backend, initializes the device, and then
            starts the manager singletons in dependency order.
          </Para>
          <BulletList
            items={[
              "The RHI backend is selected through USE_DX12 / USE_DX11 and stored in the global g_pRHIDevice.",
              "DX12 initialization creates the device, triple-buffered swapchain, direct/copy/compute queues, per-frame fences, descriptor heap pools, and graphics/compute root signatures.",
              "Each swapchain back buffer is wrapped as a DX12RHITexture and exposed under the logical asset name RenderTargetTex.",
              "Managers initialize in order: CPathMgr, CTimeMgr, CKeyMgr, CAssetMgr, CRenderMgr, CLevelMgr, with CFontMgr only on DX11.",
            ]}
          />

          <SubHeading>CRenderMgr::init</SubHeading>
          <Para>
            Renderer initialization does two important startup-only jobs: builds all render target sets and pre-bakes the
            base IBL lookup texture.
          </Para>
          <Table
            headers={["MRT Type", "Render Targets", "Used In"]}
            rows={[
              ["SWAPCHAIN", "RenderTargetTex back buffer + DepthStencilTex", "Tone-map output and final UI"],
              ["DEFERRED", "Color, Normal, Position, Emissive, CustomData + shared D24S8", "G-buffer pass"],
              ["DEFERRED_DECAL", "Aliases GBuffer_Color + GBuffer_Emissive", "Deferred decals"],
              ["SSAO / SSAO_BLUR", "SSAOTexture / SSAOBlurTex, R8_UNORM cleared to white", "Screen-space ambient occlusion"],
              ["DEFERRED_LIGHT", "GBuffer_Diffuse + GBuffer_Specular", "Lighting accumulation"],
              ["HDR_SCENE", "HDRSceneTex, R16G16B16A16F + shared D24S8", "Merge and forward passes"],
            ]}
          />
          <Para>
            A separate <InlineCode>RenderTargetTexCopy</InlineCode> is also allocated for post-process readback.
            <InlineCode>CIBLManager::init()</InlineCode> creates <InlineCode>IBL_BRDFLut</InlineCode> and dispatches
            <InlineCode>CBRDFLutCS</InlineCode> once before the first frame.
          </Para>
          <Table
            headers={["Slot", "Texture", "Purpose"]}
            rows={[
              ["t5", "IBL_BRDFLut", "Pre-integrated split-sum BRDF"],
              ["t6", "Environment cubemap", "Bound separately by CSkyBox"],
              ["t7", "IBL_Irradiance", "Diffuse IBL cubemap"],
              ["t8", "IBL_Prefilter", "Specular prefilter cubemap with roughness mips"],
            ]}
          />

          <SectionHeading id="scene" num="3">
            Scene Construction / CTestLevel3D::CreateTestLevel
          </SectionHeading>
          <Para>
            The test scene builds a <InlineCode>CLevel</InlineCode> with three layers: Default, Player, and Monster. It adds
            the directional light, test meshes such as the Gothic tracery ruins, material instances derived from
            <InlineCode>Std3DDeferredPBRMaterial</InlineCode>, and the editor camera registered through
            <InlineCode>CRenderMgr::RegisterEditorCamera</InlineCode>.
          </Para>
          <BulletList
            items={[
              "The directional Dir Light uses CLight3D, LIGHT_TYPE::DIRECTIONAL, and has shadow casting enabled.",
              "The scene becomes the current level of CLevelMgr after construction.",
              "CEditorMgr::init() switches the render mode to EDITOR so render_editor is used instead of render_play.",
            ]}
          />

          <SectionHeading id="frame-entry" num="4">
            Frame Entry / CEngine::Progress
          </SectionHeading>
          <Para>
            <InlineCode>CEngine::Progress</InlineCode> is called once per idle iteration of the message loop. It separates CPU
            simulation from GPU command recording.
          </Para>
          <Code>{progressCode}</Code>
          <Para>
            <InlineCode>DX12Device::BeginFrame</InlineCode> acquires a direct command list, sets graphics and compute root
            signatures, sets viewport/scissor, synchronizes the RHI wrapper command list, and rebinds
            <InlineCode>RenderTargetTex</InlineCode> to the current back-buffer index.
          </Para>

          <SectionHeading id="render-skeleton" num="5">
            The Render Skeleton / CRenderMgr::render
          </SectionHeading>
          <Code>{renderSkeletonCode}</Code>
          <Para>
            <InlineCode>DataBinding</InlineCode> uploads the global constant buffer and structured buffers for 2D and 3D light
            arrays. <InlineCode>DataClear</InlineCode> drops per-frame light vectors and unbinds PS SRV slots 0..5 so the next
            frame's G-buffer pass does not hit a render-target-as-SRV hazard.
          </Para>
          <Callout title="Correctness detail" icon={ShieldCheck}>
            The explicit SRV unbind is important in a deferred renderer: a texture sampled during merge or lighting must not
            remain bound as an SRV when it becomes a render target in the next frame.
          </Callout>

          <SectionHeading id="render-passes" num="6">
            The 11 Passes of render_editor
          </SectionHeading>
          <div className="space-y-5">
            <PassCard number="0" title="Shadow maps">
              <Para>
                For every shadow-casting <InlineCode>CLight3D</InlineCode>, <InlineCode>RenderShadowMap()</InlineCode> builds
                a texel-snapped orthographic projection, pushes the light view/proj to <InlineCode>g_Trans</InlineCode>, sorts
                shadow casters, and records depth-only draws into the light's shadow MRT.
              </Para>
            </PassCard>

            <PassCard number="1" title="Camera transforms + scene sort">
              <Para>
                The editor camera writes view/projection matrices and runs <InlineCode>SortObjects()</InlineCode>. Objects are
                frustum-culled and binned by shader domain: deferred, decal, opaque, masked, transparent, particle, and
                postprocess. A single object can appear in multiple bins when submeshes use different materials.
              </Para>
            </PassCard>

            <PassCard number="2" title="Bind IBL">
              <Para>
                <InlineCode>CIBLManager::Binding()</InlineCode> binds <InlineCode>IBL_BRDFLut</InlineCode>,
                <InlineCode>IBL_Irradiance</InlineCode>, and <InlineCode>IBL_Prefilter</InlineCode> for downstream shaders.
              </Para>
            </PassCard>

            <PassCard number="3" title="Deferred G-buffer">
              <Para>
                Deferred objects render with <InlineCode>std3d_deferred_pbr.fx</InlineCode>, writing albedo, normal, position,
                emissive, and PBR custom data.
              </Para>
              <Table
                headers={["RT", "Texture", "Contents"]}
                rows={[
                  ["0", "GBuffer_Color", "Albedo, sRGB-to-linear handled, multiplied by baseColorFactor"],
                  ["1", "GBuffer_Normal", "View-space normal, TBN-resolved when a normal map is present"],
                  ["2", "GBuffer_Position", "View-space position; alpha marks geometry written"],
                  ["3", "GBuffer_Emmisive", "Emissive color with emissiveFactor"],
                  ["4", "GBuffer_CustomData", "Metallic, Roughness, AO, and PBR flag"],
                ]}
              />
            </PassCard>

            <PassCard number="4" title="Decals">
              <Para>
                The decal MRT aliases <InlineCode>GBuffer_Color</InlineCode> and <InlineCode>GBuffer_Emmisive</InlineCode>, so
                projected decals can modify color/emissive without rewriting normals or depth.
              </Para>
            </PassCard>

            <PassCard number="5" title="SSAO, currently disabled">
              <Para>
                The SSAO path is wired but commented out. When enabled, it runs generation and bilateral blur over a fullscreen
                rect, then binds the blurred result at <InlineCode>t17</InlineCode> for lighting.
              </Para>
            </PassCard>

            <PassCard number="6" title="Deferred lighting">
              <Para>
                The engine binds <InlineCode>DEFERRED_LIGHT</InlineCode> and draws one volume mesh per 3D light. Directional
                lights bind their shadow map at TEX_4 and the snapped light view-projection matrix at MAT_0. The lighting
                shader reads G-buffer SRVs and writes diffuse/specular accumulation.
              </Para>
            </PassCard>

            <PassCard number="7" title="Merge">
              <Para>
                The merge pass writes to <InlineCode>HDRSceneTex</InlineCode>, combining Color, Diffuse, Specular, Emissive,
                and CustomData. If G-buffer debug view is enabled, the merge shader can output one selected G-buffer texture
                directly.
              </Para>
            </PassCard>

            <PassCard number="8" title="Forward passes">
              <Para>
                Opaque, masked, transparent, and particle domains render into the same <InlineCode>HDR_SCENE</InlineCode> target
                so forward-rendered objects share depth and HDR lighting context with the deferred result.
              </Para>
            </PassCard>

            <PassCard number="9" title="Tone mapping">
              <Para>
                The swapchain back buffer is written for the first time this frame. <InlineCode>HDRSceneTex</InlineCode> is
                sampled with exposure 0.6 and tone mapper 0, where 0 = ACES, 1 = Reinhard, and 2 = Uncharted2.
              </Para>
            </PassCard>

            <PassCard number="10" title="Post-process">
              <Para>
                <InlineCode>render_postprocess()</InlineCode> first copies <InlineCode>RenderTargetTex</InlineCode> to
                <InlineCode>RenderTargetTexCopy</InlineCode>, then renders each postprocess object.
              </Para>
            </PassCard>

            <PassCard number="11" title="Cleanup">
              <Para>
                <InlineCode>CIBLManager::Clear()</InlineCode> unbinds t5, t7, and t8. The swapchain MRT is rebound so debug
                rendering and ImGui can draw on top of the tone-mapped scene.
              </Para>
            </PassCard>
          </div>

          <SectionHeading id="editor-overlay" num="7">
            Editor + ImGui Overlay
          </SectionHeading>
          <Para>
            After <InlineCode>CEngine::Progress</InlineCode>, <InlineCode>CEditorMgr::tick()</InlineCode> draws editor gizmos,
            outliner, and debug widgets. <InlineCode>CImGuiMgr::tick()</InlineCode> records ImGui draw data onto the same back
            buffer using the DX12 ImGui backend.
          </Para>
          <Para>
            This works because Pass 11 transitions the back buffer back to <InlineCode>RENDER_TARGET</InlineCode>. The editor
            overlay is simply another draw step on top of the tone-mapped scene.
          </Para>

          <SectionHeading id="present" num="8">
            Frame Submission / DX12Device::Present
          </SectionHeading>
          <OrderedList
            items={[
              "Transition the current back buffer to D3D12_RESOURCE_STATE_PRESENT.",
              "Execute the command list recorded since BeginFrame.",
              "Detach the DX12RHICommandList wrapper so resize/flush cannot double-submit the same command list.",
              "Present the swapchain; tearing is allowed when VSync is off.",
              "Signal a fence, advance the back-buffer index, and wait for that buffer's previous fence.",
              "Increment the frame count and release stale descriptor allocations whose owning frames have retired.",
            ]}
          />
          <Callout title="Director-level takeaway" icon={Network}>
            This is not only drawing. The end of the frame also proves that resource ownership, back-buffer rotation, descriptor
            lifetime, and GPU/CPU synchronization are under control.
          </Callout>

          <SectionHeading id="resize" num="9">
            Resize Handling
          </SectionHeading>
          <Para>
            Window resize is handled as a controlled pause and rebuild. Rendering is short-circuited, the GPU is flushed, all
            render target sets and G-buffer/HDR/depth textures are removed, the swapchain is resized, MRTs are rebuilt, and then
            rendering resumes.
          </Para>
          <OrderedList
            items={[
              "SetResizing(true), so CEngine::Progress stops rendering.",
              "Flush the GPU.",
              "Delete every CRenderTargetSet and every G-buffer, HDR, and depth texture from CAssetMgr.",
              "ResizeSwapChain through DXGI and rebuild viewport/back-buffer textures.",
              "Call CreateRenderTargetSet() again.",
              "SetResizing(false).",
            ]}
          />

          <SectionHeading id="timeline" num="10">
            End-to-End Frame Timeline
          </SectionHeading>
          <Code language="text">{timelineCode}</Code>
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-primary">What Happens Every Frame</h3>
            <Para>
              Every frame updates engine state, rotates the DX12 back buffer, records 11 editor-render passes, overlays editor
              UI, submits one command list, flips the swapchain, and waits on the correct fence before reusing frame resources.
              That is the complete path from <InlineCode>CTestLevel3D</InlineCode> to the monitor.
            </Para>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-8">
            <button
              onClick={onBack}
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              type="button"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to portfolio
            </button>
            <div className="flex flex-wrap items-center gap-5">
              <a
                href="https://github.com/techartistcanada/YannEngine"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Github className="h-4 w-4" />
                Source on GitHub
              </a>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Cpu,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";

const sections = [
  { id: "overview",    num: "0", title: "总体流程概览" },
  { id: "theory",      num: "1", title: "渲染方程与 Cook-Torrance BRDF" },
  { id: "equirect",    num: "2", title: "Equirectangular → Cubemap 转换" },
  { id: "mips",        num: "3", title: "Cubemap Mipmap 生成（Karis Average）" },
  { id: "irradiance",  num: "4", title: "Irradiance Map（漫反射 IBL）" },
  { id: "prefilter",   num: "5", title: "Prefiltered Map（镜面 IBL）" },
  { id: "brdflut",     num: "6", title: "BRDF LUT" },
  { id: "gbuffer",     num: "7", title: "GBuffer 阶段" },
  { id: "lighting",    num: "8", title: "延迟光照阶段" },
  { id: "iblmanager",  num: "9", title: "CIBLManager 资源调度" },
  { id: "dataflow",    num: "10", title: "关键数据流图" },
];

const codeStyle = {
  margin: 0,
  padding: "1.25rem 1.5rem",
  borderRadius: "12px",
  background: "rgba(13, 20, 27, 0.85)",
  fontSize: "0.85rem",
  border: "1px solid rgba(32,178,166,0.18)",
};

const Code = ({ language = "hlsl", children }) => (
  <div className="my-5">
    <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={codeStyle}>
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
  <p className="text-[0.97rem] leading-[1.85] text-foreground/85 my-4">{children}</p>
);

const InlineCode = ({ children }) => (
  <code className="px-1.5 py-0.5 mx-0.5 rounded text-[0.85em] font-mono text-primary bg-primary/10 border border-primary/15">
    {children}
  </code>
);

const Callout = ({ children }) => (
  <div
    className="my-6 rounded-xl px-5 py-4 flex gap-3 items-start text-[0.95rem] leading-[1.8] text-foreground/85"
    style={{ background: "rgba(32,178,166,0.06)", borderLeft: "3px solid #20b2a6" }}
  >
    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-1.5" />
    <div>{children}</div>
  </div>
);

const Warning = ({ children }) => (
  <div
    className="my-6 rounded-xl px-5 py-4 flex gap-3 items-start text-[0.95rem] leading-[1.8] text-foreground/85"
    style={{ background: "rgba(251,191,36,0.06)", borderLeft: "3px solid #fbbf24" }}
  >
    <span className="flex-shrink-0 mt-0.5 text-yellow-400 font-bold text-sm">⚠</span>
    <div>{children}</div>
  </div>
);

const FancyTable = ({ headers, rows }) => (
  <div className="my-6 overflow-x-auto rounded-xl glass">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-primary/20">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-primary font-semibold tracking-wide text-xs uppercase">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-border/30 last:border-b-0 hover:bg-primary/5 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-4 py-3 text-foreground/85 align-top leading-relaxed">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
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

const MathBlock = ({ children }) => (
  <div
    className="my-5 rounded-xl px-6 py-4 font-mono text-[0.88rem] leading-[2] text-primary/90 overflow-x-auto"
    style={{ background: "rgba(32,178,166,0.05)", border: "1px solid rgba(32,178,166,0.15)" }}
  >
    <pre className="whitespace-pre-wrap">{children}</pre>
  </div>
);

export const PBRIBLPipeline = ({ onBack }) => {
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
            Back to YannEngine Devlog
          </button>
          <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase hidden sm:inline">
            YannEngine · PBR + IBL Deep Dive
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
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
              YannEngine · Rendering Deep Dive
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              <span className="text-primary glow-text">PBR + IBL</span>
              <br />
              <span className="font-serif italic font-normal text-white">完整工作流程详解</span>
              <br />
              <span className="text-foreground/80 text-3xl md:text-4xl lg:text-5xl">
                从离线预计算到实时着色
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              逐步解析 YannEngineDX12RHI 中 PBR 与 IBL 渲染管线的每一阶段——
              从 <InlineCode>Cook-Torrance BRDF</InlineCode> 的数学推导，
              到 <InlineCode>Split-Sum 近似</InlineCode> 的工程实现，再到每一行 HLSL 背后的物理直觉。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>~ 30 min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span>HLSL · DirectX 12 Compute</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>5 Precompute Passes</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Cook-Torrance", "GGX NDF", "Smith G", "Schlick Fresnel",
                "Split-Sum", "Importance Sampling", "Hammersley", "Karis Average",
                "Irradiance Map", "Prefilter Map", "BRDF LUT", "HLSL",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-mono text-primary"
                  style={{ background: "rgba(32,178,166,0.08)", border: "1px solid rgba(32,178,166,0.22)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body */}
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
                    {s.title.split("（")[0]}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 max-w-3xl">

            {/* ===== 0 ===== */}
            <SectionHeading num={0} id="overview">总体流程概览</SectionHeading>
            <Para>
              PBR + IBL 渲染管线分为两大部分：<strong className="text-primary">离线预计算</strong>（每个
              HDR 环境贴图加载一次）与<strong className="text-primary">实时着色</strong>（每帧）。
              离线阶段把"看不见的积分"提前烘焙进贴图；实时阶段只需几次纹理采样就能还原物理正确的光照。
            </Para>

            <SubHeading>离线阶段</SubHeading>
            <Code language="text">{`HDR Equirect (.hdr)
        │
        ▼  CS_EquirectToCube
EnvCubemap mip 0 (1024×1024×6)
        │
        ▼  CS_GenerateMipsCubemap (per-mip Karis Average)
EnvCubemap full mip chain
        │
        ├──▶ CS_Irradiance       ──▶  IrradianceMap   (32×32×6,    diffuse  IBL)
        ├──▶ CS_Prefilter (×5)   ──▶  PrefilterMap    (256×256×6, 5 mips, specular IBL)
        └──▶ (one-time)
              CS_BRDFLut         ──▶  BRDFLut         (512×512, R16G16, env-BRDF)`}</Code>

            <SubHeading>实时阶段（每帧）</SubHeading>
            <Code language="text">{`Mesh ─▶ VS/PS_Std3D_Deferred_PBR ─▶ GBuffer (Albedo/Normal/Position/Emissive/Data)
                                         │
                                         ▼
                  PS_DirLight  =  Direct Light (Cook-Torrance)
                              + Indirect IBL (Irradiance + Prefilter × BRDFLut)
                              − Shadow (5×5 PCF)`}</Code>

            <FancyTable
              headers={["文件", "角色"]}
              rows={[
                [<InlineCode>CIBLManager.cpp</InlineCode>, "C++ 调度：管理资源、按顺序调度 CS、屏障与 mip 生成"],
                [<InlineCode>equirect_to_cubemap_cs.fx</InlineCode>, "将经纬度 HDR 投影到立方体六面"],
                [<InlineCode>generate_mips_cubemap_cs.fx</InlineCode>, "立方体贴图 mip 生成（HDR 安全）"],
                [<InlineCode>ibl_irradiance_cs.fx</InlineCode>, "漫反射卷积"],
                [<InlineCode>ibl_prefilter_cs.fx</InlineCode>, "GGX 重要性采样的镜面预滤波"],
                [<InlineCode>brdf_lut_cs.fx</InlineCode>, "环境 BRDF 二维 LUT"],
                [<InlineCode>std3d_deferred_pbr.fx</InlineCode>, "GBuffer 写入"],
                [<InlineCode>deferred_lighting.fx</InlineCode>, "直接 + 间接光合成"],
                [<InlineCode>pbr.fx</InlineCode>, "公共 BRDF 工具：D / G / F"],
                [<InlineCode>func.fx</InlineCode>, <><InlineCode>CalcLight3D_PBR</InlineCode> 直接光封装</>],
              ]}
            />

            {/* ===== 1 ===== */}
            <SectionHeading num={1} id="theory">渲染方程与 Cook-Torrance BRDF</SectionHeading>

            <SubHeading>1.1 渲染方程</SubHeading>
            <Para>
              Kajiya 的渲染方程描述了某点 <InlineCode>p</InlineCode> 沿出射方向{" "}
              <InlineCode>ωo</InlineCode> 的辐射亮度——这是整个 PBR 系统的出发点：
            </Para>
            <MathBlock>{`Lo(p, ωo) = Le(p, ωo) + ∫_Ω fr(p, ωi, ωo) · Li(p, ωi) · (n · ωi) dωi`}</MathBlock>
            <Para>
              PBR 的目标是用一个<strong className="text-primary">物理合理</strong>的 BRDF{" "}
              <InlineCode>fr</InlineCode> 来近似真实世界材质的反射行为。
              这个积分无法解析求解，IBL 的核心思路就是把它<strong className="text-primary">预计算</strong>进贴图。
            </Para>

            <SubHeading>1.2 Cook-Torrance BRDF</SubHeading>
            <Para>
              材质的双向反射函数被拆为漫反射 + 镜面反射两项：
            </Para>
            <MathBlock>{`fr = kD · (c / π) + kS · fr_spec

                 D(h) · F(v,h) · G(v,l)
fr_spec = ─────────────────────────────────
                4 · (n·v) · (n·l)`}</MathBlock>
            <BulletList
              items={[
                <><strong className="text-primary">D — Normal Distribution Function (GGX/Trowbridge-Reitz)</strong>：描述微表面法线集中度。粗糙度越高，高光越宽散；越低，高光越尖锐。</>,
                <><strong className="text-primary">G — Geometry Function (Smith + Schlick-GGX)</strong>：描述微表面互相遮蔽（shadowing）与自阴影（masking）。</>,
                <><strong className="text-primary">F — Fresnel (Schlick approximation)</strong>：随入射角变化的反射比例。掠射角时几乎一切材质都是全反射。</>,
              ]}
            />
            <Para>代码实现（<InlineCode>pbr.fx</InlineCode>）：</Para>
            <Code>{`// D：a = roughness² ；GGX/Trowbridge-Reitz
float DistributionGGX(float3 N, float3 H, float roughness)
{
    float a = roughness * roughness, a2 = a * a;
    float NdotH = max(dot(N, H), 0);
    float denom = NdotH * NdotH * (a2 - 1) + 1;
    return a2 / (PI * denom * denom);
}

// G：Smith + Schlick (k = (r+1)²/8 的直接光版本)
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1 - k) + k);
}

// F：Schlick 近似
float3 FresnelSchlick(float cosTheta, float3 F0)
{
    return F0 + (1 - F0) * pow(saturate(1 - cosTheta), 5);
}`}</Code>

            <Warning>
              直接光使用 <InlineCode>k = (r+1)²/8</InlineCode>，IBL（
              <InlineCode>brdf_lut_cs.fx</InlineCode>）使用 <InlineCode>k = a²/2</InlineCode>。
              这是 Disney/UE4 推荐的两套不同的 <InlineCode>k</InlineCode> 取值，
              分别针对点光与环境光，<strong>不可混用</strong>。
            </Warning>

            <SubHeading>1.3 能量守恒</SubHeading>
            <Para>
              <InlineCode>F</InlineCode> 既代表镜面反射比例又是 <InlineCode>kS</InlineCode>，
              所以 <InlineCode>kD = (1 - F) · (1 - metallic)</InlineCode>。
              金属（metallic=1）没有漫反射；非金属保留 <InlineCode>(1 - F0)</InlineCode>{" "}
              的能量做漫反射——这保证了能量不会凭空增加。
            </Para>

            {/* ===== 2 ===== */}
            <SectionHeading num={2} id="equirect">Equirectangular → Cubemap 转换</SectionHeading>
            <Para>
              <strong className="text-primary">目的</strong>：把磁带式（lat-lon）HDR 全景图重新参数化为立方体六面，
              使得任意方向 <InlineCode>dir</InlineCode> 的采样成本恒定且无极点失真。
            </Para>
            <FancyTable
              headers={["参数", "值"]}
              rows={[
                ["输入", "Texture2D<float4> 等距矩形 HDR（如 4096×2048）"],
                ["输出", "RWTexture2DArray<float4> 1024×1024×6 立方体面"],
                ["Shader", "equirect_to_cubemap_cs.fx"],
              ]}
            />

            <SubHeading>核心算法：(face, uv) → 3D 方向</SubHeading>
            <Code>{`// 由 (face, uv) 还原 3D 方向 dir
case 0: dir = float3( 1, cy,-cx); // +X
case 1: dir = float3(-1, cy, cx); // -X
case 2: dir = float3( cx, 1,-cy); // +Y
case 3: dir = float3( cx,-1, cy); // -Y
case 4: dir = float3( cx, cy, 1); // +Z
case 5: dir = float3(-cx, cy,-1); // -Z`}</Code>

            <SubHeading>球面坐标转 UV</SubHeading>
            <MathBlock>{`φ = atan2(dir.z, dir.x)           // [-π, π]
θ = asin(clamp(dir.y, -1, 1))     // [-π/2, π/2]
u = φ / (2π) + 0.5
v = 1 - (θ / π + 0.5)`}</MathBlock>

            <SubHeading>HDR 软钳制（Soft Clamp）</SubHeading>
            <Para>
              太阳盘亮度可能 &gt; 50,000，会让后续 prefilter 出现严重的「萤火虫」伪影。
              这里用 Reinhard 风格在亮度通道上压缩，<strong className="text-primary">保持色相</strong>：
            </Para>
            <Code>{`float3 SoftClampHDR(float3 color, float threshold)
{
    float lum = max(color.r, max(color.g, color.b));
    if (lum > threshold)
    {
        float compressed = threshold + (lum - threshold) / (1 + (lum - threshold) / threshold);
        color *= compressed / lum;
    }
    return color;
}`}</Code>
            <Callout>
              阈值 <InlineCode>64</InlineCode> 是经验值：保留天空梯度，抑制太阳的灾难性亮度。
              阈值过低会损失 HDR 动态范围；过高则萤火虫问题无法缓解。
            </Callout>

            {/* ===== 3 ===== */}
            <SectionHeading num={3} id="mips">Cubemap Mipmap 生成（Karis Average）</SectionHeading>

            <SubHeading>为什么不用硬件自动生成？</SubHeading>
            <BulletList
              items={[
                "D3D12 不支持对 cubemap 的 GenerateMips。",
                "HDR 用普通盒滤波会出现萤火虫（一个 50,000 像素和三个 1.0 像素盒滤波后仍是 12,501）。",
              ]}
            />

            <SubHeading>Karis Average</SubHeading>
            <Para>
              来自 UE4 SIGGRAPH 2013 报告（bloom 同款）：用亮度倒数加权，让暗像素相对获得更多贡献，
              从而抑制极亮像素在 mip 中的统治效果：
            </Para>
            <MathBlock>{`weight(c) = 1 / (1 + luma(c))

result = (c00·w00 + c10·w10 + c01·w01 + c11·w11) / (w00 + w10 + w01 + w11)`}</MathBlock>
            <Code>{`float KarisWeight(float3 c)
{
    float luma = dot(c, float3(0.2126, 0.7152, 0.0722));
    return 1.0 / (1.0 + luma);
}

// 2×2 盒滤波，Karis 加权
float w00 = KarisWeight(c00), w10 = KarisWeight(c10);
float w01 = KarisWeight(c01), w11 = KarisWeight(c11);
result = (c00*w00 + c10*w10 + c01*w01 + c11*w11) / (w00+w10+w01+w11);`}</Code>

            <SubHeading>调度策略：scratch cubemap</SubHeading>
            <Para>
              D3D12 不允许同一资源同时作为 SRV（读 mip N-1）和 UAV（写 mip N）。
              解决方案是引入 <strong className="text-primary">scratch cubemap</strong>：
              先把 env mip N-1 拷到 scratch，再让 CS 读 scratch 写 env mip N。
            </Para>
            <Code language="cpp">{`for (UINT mip = 1; mip < mipLevels; ++mip)
{
    pCmdList->CopySubresourceMip(scratch, mip-1, env, mip-1, 6);
    m_pGenMipsCubemapCS->SetSrcMipTex(scratch); SetSrcMip(mip-1);
    m_pGenMipsCubemapCS->SetDstCubemap(env);    SetDstMip(mip);
    m_pGenMipsCubemapCS->Execute();
}`}</Code>
            <Callout>
              scratch 与 env 共享同样的 mip 数量与尺寸，因此一份 scratch 就能覆盖所有 mip 级别。
              烘焙结束后 scratch 立即被释放，不占运行时内存。
            </Callout>

            {/* ===== 4 ===== */}
            <SectionHeading num={4} id="irradiance">Irradiance Map（漫反射 IBL）</SectionHeading>
            <Para>
              <strong className="text-primary">目标</strong>：对每个法线方向 <InlineCode>N</InlineCode>，
              预积分入射光在半球内的余弦加权积分，即漫反射渲染方程中的"环境项"：
            </Para>
            <MathBlock>{`E(N) = ∫_Ω Li(ωi) · (N · ωi) dωi`}</MathBlock>
            <Para>
              漫反射 BRDF 是 <InlineCode>c/π</InlineCode>，所以运行时直接：
              <InlineCode>diffuseIBL = (c/π) · E(N) · π = c · E(N)</InlineCode>（两个 π 消掉）。
            </Para>

            <SubHeading>算法（ibl_irradiance_cs.fx）</SubHeading>
            <Para>
              均匀球面采样（不需要重要性采样——漫反射 PDF 接近常数）：
            </Para>
            <Code>{`for (phi = 0; phi < 2*PI; phi += delta)
    for (theta = 0; theta < PI/2; theta += delta)
    {
        // 切线空间方向 → 世界空间
        float3 tangentSample = float3(sin(theta)*cos(phi),
                                      sin(theta)*sin(phi),
                                      cos(theta));
        float3 sampleVec = TangentToWorld(tangentSample, N);

        irradiance += SampleCubemap(sampleVec) * cos(theta) * sin(theta);
        n++;
    }
irradiance = PI * irradiance / n;`}</Code>

            <SubHeading>为什么乘 cos(θ) · sin(θ)？</SubHeading>
            <BulletList
              items={[
                <><InlineCode>cos(θ)</InlineCode> = <InlineCode>N · ωi</InlineCode>（Lambert 余弦项）</>,
                <><InlineCode>sin(θ)</InlineCode> = 球面坐标 <InlineCode>dω = sinθ dθ dφ</InlineCode> 的雅可比，把均匀角度采样转为均匀立体角采样</>,
                <>最后乘 <InlineCode>π</InlineCode> 等价于 <InlineCode>2π · π/2 / n</InlineCode> 的归一化常数</>,
              ]}
            />
            <Callout>
              输出尺寸只需 <strong className="text-primary">32×32×6</strong>——
              漫反射的频率非常低（半球积分极度模糊），低分辨率完全够用，带宽代价极小。
            </Callout>

            {/* ===== 5 ===== */}
            <SectionHeading num={5} id="prefilter">Prefiltered Map（镜面 IBL）</SectionHeading>
            <Para>
              镜面项无法只靠法线 <InlineCode>N</InlineCode> 表达，因为它依赖视角 <InlineCode>V</InlineCode>、
              粗糙度 <InlineCode>r</InlineCode>。Karis 提出 <strong className="text-primary">Split-Sum 近似</strong>：
            </Para>
            <MathBlock>{`∫ Li · fr · (n·l) dω
   ≈ (∫ Li(l) dω 加权)  ·  (∫ fr · (n·l) dω 加权)
   =  PrefilteredColor(R, r)  ·  EnvBRDF(NdotV, r)`}</MathBlock>
            <BulletList
              items={[
                <>假设 1：<InlineCode>V = R = N</InlineCode>（把 <InlineCode>R = reflect(-V,N)</InlineCode> 视作主反射方向，使左积分只依赖 <InlineCode>R</InlineCode> 和 <InlineCode>r</InlineCode>）</>,
                <>假设 2：把整体积分拆为两个独立积分的乘积（Split-Sum 核心近似）</>,
              ]}
            />

            <SubHeading>Prefiltered Cubemap</SubHeading>
            <Para>
              把"环境光在以 <InlineCode>R</InlineCode> 为中心的 GGX lobe 内的加权平均"预计算到一张 cubemap 的多 mip 级中。
              本工程 5 个 mip，<InlineCode>mip = roughness × MAX_LOD (4)</InlineCode>：
              level 0 = 镜面（完全光滑），level 4 = 粗糙扩散。
            </Para>

            <SubHeading>算法（ibl_prefilter_cs.fx）：GGX 重要性采样</SubHeading>
            <Code>{`for (i = 0; i < 1024; ++i)
{
    float2 Xi = Hammersley(i, 1024);           // 低差异序列 [0,1)²
    float3 H  = ImportanceSampleGGX(Xi, N, r); // 在 GGX 分布下抽 H
    float3 L  = reflect(-V, H);                // V = R = N 假设

    float NdotL = max(dot(N, L), 0);
    if (NdotL > 0)
    {
        // 根据 PDF 选择合适的 mip level，解决欠采样走样
        float D       = DistributionGGX(N, H, r);
        float NdotH   = max(dot(N, H), 0);
        float HdotV   = max(dot(H, V), 0);
        float pdf     = D * NdotH / (4.0 * HdotV) + 0.0001;

        float saSample  = 1.0 / (float(1024) * pdf + 0.0001);
        float saTexel   = 4.0 * PI / (6.0 * resolution * resolution);
        float mipLevel  = roughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel);

        prefilteredColor += SampleCubemapLod(L, mipLevel) * NdotL;
        totalWeight      += NdotL;
    }
}
prefilteredColor /= totalWeight;`}</Code>

            <SubHeading>Hammersley + Van der Corput</SubHeading>
            <Para>
              低差异序列让 1024 个样本均匀覆盖 <InlineCode>[0,1)²</InlineCode>，
              远好于均匀随机。VdC 序列对整数做位翻转得到{" "}
              <InlineCode>[0,1)</InlineCode> 的均匀分布，与均匀序列合成二维 Hammersley 序列。
            </Para>

            <SubHeading>Mip 选择技巧（Krivanek 2007，UE4 沿用）</SubHeading>
            <Para>
              当样本的 PDF 较低时（即此样本在采样域中较"稀疏"），单次采样代表的"立体角"较大，
              应当读取更模糊的 mip 级别——这样有限的 1024 个样本就近似覆盖了整个 lobe，
              避免出现亮点闪烁。这正是为什么 cubemap 必须有完整的 mip 链。
            </Para>
            <Callout>
              <strong className="text-primary">ImportanceSampleGGX</strong>：从均匀样本{" "}
              <InlineCode>Xi</InlineCode> 反演 GGX 累积分布函数得到与 NDF 成正比的{" "}
              <InlineCode>H</InlineCode>，从而把方差集中到对积分贡献大的方向，用更少的样本达到更低的噪声。
            </Callout>

            {/* ===== 6 ===== */}
            <SectionHeading num={6} id="brdflut">BRDF LUT（双向反射分布函数查找表）</SectionHeading>
            <Para>
              Split-Sum 第二项——把与 <InlineCode>F0</InlineCode> 无关的积分预计算成 2D 纹理：
            </Para>
            <MathBlock>{`EnvBRDF(NdotV, r) = ∫_Ω fr · (n·l) dω

把 F = F0 + (1-F0)·(1-VdotH)^5 展开后：
∫ ≈ F0 · A(NdotV, r) + B(NdotV, r)`}</MathBlock>
            <Para>
              其中 <InlineCode>A</InlineCode>、<InlineCode>B</InlineCode> 与{" "}
              <InlineCode>F0</InlineCode> 无关，仅依赖 <InlineCode>NdotV</InlineCode> 和 <InlineCode>r</InlineCode>，
              因此可预计算成 <strong className="text-primary">512×512 R16G16 纹理</strong>。
              运行时直接：
            </Para>
            <Code>{`float2 brdf = BRDFLut.Sample(g_Sam_Clamp, float2(NdotV, roughness)).rg;
specularIBL = prefilteredColor * (F * brdf.x + brdf.y);`}</Code>

            <SubHeading>算法（brdf_lut_cs.fx）</SubHeading>
            <Code>{`// 坐标系：N = (0,0,1)，V 由 NdotV 确定
for (i = 0; i < 1024; ++i)
{
    float2 Xi = Hammersley(i, 1024);
    float3 H  = ImportanceSampleGGX(Xi, N, roughness);
    float3 L  = reflect(-V, H);

    float NdotL = max(L.z, 0);
    float NdotH = max(H.z, 0);
    float VdotH = max(dot(V, H), 0);

    if (NdotL > 0)
    {
        float G     = GeometrySmith_IBL(N, V, L, roughness); // k = a²/2
        float G_Vis = G * VdotH / (NdotH * NdotV + 0.0001);
        float Fc    = pow(1.0 - VdotH, 5.0);

        A += (1.0 - Fc) * G_Vis;   // F0 系数
        B += Fc * G_Vis;
    }
}
g_OutBRDFLut[xy] = float2(A, B) / 1024.0;`}</Code>
            <Warning>
              <InlineCode>g_Sam_Clamp</InlineCode> 对 BRDFLut 是<strong>必须</strong>的：
              边界 wrap 会读到对侧错误数据，导致 roughness=0 或 roughness=1 边缘出现异常值。
            </Warning>

            {/* ===== 7 ===== */}
            <SectionHeading num={7} id="gbuffer">GBuffer 阶段（几何信息打包）</SectionHeading>
            <Para>
              <InlineCode>std3d_deferred_pbr.fx</InlineCode> 是延迟管线的 GBuffer pass，
              把材质属性写入 5 个 RT：
            </Para>
            <FancyTable
              headers={["RT", "含义", "格式"]}
              rows={[
                [<><InlineCode>SV_Target0</InlineCode></>, "Albedo（线性空间）", "RGBA8 / R11G11B10"],
                [<><InlineCode>SV_Target1</InlineCode></>, "View-space Normal", "RGBA16F"],
                [<><InlineCode>SV_Target2</InlineCode></>, "View-space Position，A=几何标志", "RGBA32F"],
                [<><InlineCode>SV_Target3</InlineCode></>, "Emissive（线性）", "RGBA16F"],
                [<><InlineCode>SV_Target4</InlineCode></>, "R=Metallic G=Roughness B=AO A=PBR flag", "RGBA8"],
              ]}
            />

            <SubHeading>关键细节</SubHeading>
            <Code>{`// 1. sRGB → Linear（光照计算必须在线性空间）
if (!g_int_3) vAlbedo.rgb = pow(abs(vAlbedo.rgb), 2.2f);

// 2. ORM vs glTF MR 双格式
// ORM (Unreal):   R=AO, G=Roughness, B=Metallic
// glTF MR:        R=unused, G=Roughness, B=Metallic

// 3. 法线贴图 TBN（OpenGL/DirectX Y 轴翻转）
vNormalMap.y = -vNormalMap.y;                    // 默认 OpenGL 风格
if (g_int_1) vNormalMap.y = -vNormalMap.y;       // 二次翻转 = DirectX 风格
TBN = float3x3(T, B, N);                        // view space
vNormalInView = normalize(mul(vNormalMap, TBN));

// 4. PBR 标志位：vCustomData.a = 1.0 → 走 PBR；0 → Blinn-Phong 兼容`}</Code>

            {/* ===== 8 ===== */}
            <SectionHeading num={8} id="lighting">延迟光照阶段（Deferred Lighting）</SectionHeading>

            <SubHeading>8.1 直接光照 Cook-Torrance</SubHeading>
            <Para>封装在 <InlineCode>func.fx::CalcLight3D_PBR</InlineCode>：</Para>
            <Code>{`// F0：非金属固定 4%，金属用 albedo 颜色
float3 F0 = lerp(float3(0.04, 0.04, 0.04), Albedo, Metallic);

float NDF = DistributionGGX(N, H, roughness);          // D
float G   = GeometrySmith(N, V, L, roughness);         // G（直接光 k=(r+1)²/8）
float3 F  = FresnelSchlick(max(dot(H, V), 0.0), F0);  // F

float3 specular = (NDF * G * F) / (4.0 * NdotV * NdotL + 0.0001);
float3 kS = F;
float3 kD = (1.0 - kS) * (1.0 - Metallic);            // 能量守恒
float3 diffuse = kD * Albedo / PI;

float3 Lo = (diffuse + specular) * Radiance * NdotL;`}</Code>
            <Para>
              <InlineCode>Radiance</InlineCode> 即 <InlineCode>LightInfo.Light.vDiffuse × attenuation</InlineCode>。
              点光源用余弦衰减：<InlineCode>attenuation = cos((dist/Range) × π/2)</InlineCode>。
            </Para>

            <SubHeading>8.2 间接光照 IBL（Split-Sum）</SubHeading>
            <Code>{`float3 N = normalize(vNormal);
float3 V = -normalize(vPosition);                // view space
float3 F0 = lerp(float3(0.04,0.04,0.04), albedo, metallic);
float  NdotV = max(dot(N, V), 0.0);

// Roughness-aware Fresnel（Lazarov 2013）
// 粗糙表面 Fresnel 应趋向较亮值，避免粗糙金属边缘发黑
float3 F_ibl = FresnelSchlickRoughness(NdotV, F0, roughness);
float3 kS_ibl = F_ibl;
float3 kD_ibl = (1.0 - kS_ibl) * (1.0 - metallic);

// --- Diffuse IBL ---
float3 N_world   = mul(float4(N, 0), g_matViewInv).xyz;   // 转回世界空间
float3 irradiance = Irradiance_Map.Sample(g_Sam_0, N_world).rgb;
float3 diffuseIBL = kD_ibl * irradiance * albedo;

// --- Specular IBL (Split-Sum) ---
float3 R_view  = reflect(-V, N);
float3 R_world = mul(float4(R_view, 0), g_matViewInv).xyz;
float  MAX_LOD = 4.0;
float3 prefiltered = Prefiltered_Map.SampleLevel(
    g_Sam_0, R_world, roughness * MAX_LOD).rgb;
float2 brdf = BRDFLut.Sample(g_Sam_Clamp, float2(NdotV, roughness)).rg;
float3 specularIBL = prefiltered * (F_ibl * brdf.x + brdf.y);

float3 ambient = (diffuseIBL + specularIBL) * AO * 0.5;
output.vDiffuse.rgb = directLight * (1.0 - shadow) + ambient;`}</Code>

            <SubHeading>5 个关键点</SubHeading>
            <BulletList
              items={[
                <>视图空间法线必须转回世界空间再采样 cubemap——立方体贴图在世界空间中烘焙，所以 <InlineCode>N_world = matViewInv · N_view</InlineCode></>,
                <><InlineCode>FresnelSchlickRoughness</InlineCode>（pbr.fx）：用 <InlineCode>max(1-r, F0)</InlineCode> 替代经典 Schlick 中的 <InlineCode>1</InlineCode>，避免粗糙金属边缘看起来太暗</>,
                <><InlineCode>g_Sam_Clamp</InlineCode> 对 BRDFLut 是必须的，wrap 模式会越界读到错误数据</>,
                <><InlineCode>MAX_REFLECTION_LOD = 4</InlineCode> 对应 5 mip 级（0..4），与 <InlineCode>PREFILTER_MIP_LEVELS = 5</InlineCode> 严格一致</>,
                <>阴影使用 5×5 PCF + slope-scaled bias <InlineCode>max(0.005·(1-NdotL), 0.001)</InlineCode>，仅作用于直接光；IBL 不受阴影影响（常见近似，精确版需要 SSGI 或 Bent Normal）</>,
              ]}
            />

            {/* ===== 9 ===== */}
            <SectionHeading num={9} id="iblmanager">CIBLManager 资源调度</SectionHeading>
            <Para>
              <InlineCode>CIBLManager::GenerateFromEquirect</InlineCode> 是 CPU 侧的核心调度器，
              在一帧内完成所有 GPU 命令：
            </Para>
            <Code language="cpp">{`// (1) 创建所有资源（BeginFrame 之前）
m_EnvCubemap    = Create(1024, mips=0);    // 0 = 全 mip 链
m_IrradianceMap = Create(32);
m_PrefilterMap  = Create(256, mips=5);
scratch         = Create(1024, mips);

// (2) 一帧内完成所有命令
DX12Device::GetInst()->BeginFrame();
    pCmdList = device->GetCommandList();

    // 2a. Equirect → Env mip 0
    m_pEquirectToCubeCS->SetEquirectTexture(hdr);
    m_pEquirectToCubeCS->SetOutputCubeMapTex(env, 1024);
    m_pEquirectToCubeCS->Execute();

    // 2b. Env mip chain（Karis Average）
    for (mip = 1..mipLevels) {
        Copy(env mip-1 → scratch mip-1, 6 faces);
        m_pGenMipsCubemapCS->SetSrcMipTex(scratch); SetSrcMip(mip-1);
        m_pGenMipsCubemapCS->SetDstCubemap(env);    SetDstMip(mip);
        m_pGenMipsCubemapCS->Execute();
    }

    // 2c. Diffuse IBL
    m_pIrradianceCS->Execute();

    // 2d. Specular IBL（5 mips，每 mip 对应不同 roughness）
    for (mip = 0..4) {
        m_pPrefilterCS->SetMipLevel(size >> mip, mip, mip / 4.0f);
        m_pPrefilterCS->Execute();
    }
DX12Device::GetInst()->EndFrame();    // GPU 完成后才能释放 scratch

// (3) 释放 scratch
DeleteAsset(L"IBL_EnvCubemapScratch");
m_bReady = true;`}</Code>

            <Callout>
              <strong className="text-primary">BRDF LUT 在 init() 中只生成一次</strong>——
              与场景无关，永远不变。切换天空盒只需重新跑 EquirectToCube → GenMips →
              Irradiance → Prefilter 四步，BRDF LUT 不需要重算。
            </Callout>

            <SubHeading>资源屏障约定</SubHeading>
            <Para>
              每个 <InlineCode>Execute()</InlineCode> 在 RHI 内部会：
            </Para>
            <BulletList
              items={[
                <>把输入 SRV 资源转到 <InlineCode>NON_PIXEL_SHADER_RESOURCE</InlineCode></>,
                <>把输出 UAV 资源转到 <InlineCode>UNORDERED_ACCESS</InlineCode></>,
                "dispatch",
                "之后在下一次绑定时再转换",
              ]}
            />

            <SubHeading>运行时绑定</SubHeading>
            <Code language="cpp">{`// Binding() 在每帧光照前调用
m_BRDFLutTex   ->Binding(5);   // t5  ←→  #define BRDFLut        g_tex_5
m_IrradianceMap->Binding(7);   // t7  ←→  #define Irradiance_Map g_texcube_1
m_PrefilterMap ->Binding(8);   // t8  ←→  #define Prefiltered_Map g_texcube_2
// t6 (env cubemap) 由 CSkyBox 单独绑定`}</Code>

            {/* ===== 10 ===== */}
            <SectionHeading num={10} id="dataflow">关键数据流图</SectionHeading>
            <div
              className="my-6 rounded-xl overflow-x-auto"
              style={{ background: "rgba(13, 20, 27, 0.85)", border: "1px solid rgba(32,178,166,0.18)" }}
            >
              <pre className="px-5 py-5 text-[0.78rem] leading-[1.6] font-mono text-foreground/85 whitespace-pre">
{`┌───────────────────────────── OFFLINE ─────────────────────────────┐
│                                                                   │
│  HDR.hdr                                                          │
│     │                                                             │
│     ▼ CS_EquirectToCube  (SoftClamp → Sphere→Cube 投影)           │
│  EnvCubemap mip0 ──┐                                              │
│                    │ for each mip:                                │
│                    │   Copy → scratch → CS_GenerateMipsCubemap   │
│                    │   (Karis Average 加权盒滤波)                  │
│                    ▼                                              │
│  EnvCubemap full mip chain ─────────────┐                         │
│                    │                    │                         │
│       ┌────────────┴──────────┐         │                         │
│       ▼                       ▼         │                         │
│   CS_Irradiance           CS_Prefilter (mip 0..4)                 │
│   (均匀球面采样)            (GGX 重要性采样 + Mip LOD trick)        │
│       │                       │                                   │
│       ▼                       ▼                                   │
│   IrradianceMap         PrefilterMap                              │
│   (32×32×6)             (256×256×6, 5 mips)                       │
│                                                                   │
│  (one-time, scene-independent)                                    │
│   CS_BRDFLut ─▶ BRDFLut (512×512, R16G16F)                        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────────── PER FRAME ────────────────────────────┐
│                                                                   │
│   Mesh + PBR Material                                             │
│        │                                                          │
│        ▼  VS/PS_Std3D_Deferred_PBR                                │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │ GBuffer:                                                 │    │
│   │  RT0 Albedo   RT1 Normal(view)   RT2 Position(view)      │    │
│   │  RT3 Emissive RT4 (Metallic, Roughness, AO, PBRflag)    │    │
│   └──────────────────────────────────────────────────────────┘    │
│        │                                                          │
│        ▼  PS_DirLight (Light Pass)                                │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │ Direct  : Cook-Torrance (GGX D · Smith G · Schlick F)    │    │
│   │           + Lambert (kD·c/π)                             │    │
│   │ Shadow  : 5×5 PCF + slope-scaled bias                    │    │
│   │ Indirect:                                                │    │
│   │   Diffuse  IBL = kD · IrradianceMap(N_world) · albedo    │    │
│   │   Specular IBL = Prefilter(R_world, r·LOD)               │    │
│   │                  · (F_ibl · BRDFLut.x + BRDFLut.y)       │    │
│   │ Ambient = (DiffuseIBL + SpecularIBL) · AO · 0.5          │    │
│   └──────────────────────────────────────────────────────────┘    │
│        │                                                          │
│        ▼  Merge → Forward → Tone Mapping → Present               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘`}
              </pre>
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
              <p className="text-foreground/90 leading-[1.9] text-[0.97rem]">
                本管线的物理真实性来自三块基石：
              </p>
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                {[
                  {
                    num: "01",
                    title: "Cook-Torrance 微表面 BRDF",
                    desc: "D·G·F / 4nv·nl — 解决材质对光线的物理响应",
                  },
                  {
                    num: "02",
                    title: "Karis Split-Sum",
                    desc: "把不可解析的环境光积分拆为可预计算的两项，用两次纹理采样实现",
                  },
                  {
                    num: "03",
                    title: "GGX 重要性采样 + Mip LOD",
                    desc: "用 1024 个低差异序列样本 + Mip LOD trick 逼近无穷采样的结果",
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="p-4 rounded-xl"
                    style={{ background: "rgba(32,178,166,0.06)", border: "1px solid rgba(32,178,166,0.15)" }}
                  >
                    <span className="font-mono text-xs text-primary">{item.num}</span>
                    <h4 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer nav */}
            <div className="mt-16 flex items-center justify-between border-t border-border/40 pt-8">
              <button
                onClick={onBack}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to YannEngine Devlog
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

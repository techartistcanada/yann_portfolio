import {motion} from 'framer-motion';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {Button} from "@/components/Button";
import { ArrowRight, Github, Linkedin } from "lucide-react";

export const Hero = () => {
  const scrollToExperience = () => {
    document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Background Elements */}
    {/* 背景 */}
    <div className="absolute inset-0">
      <img
        src="/hero-bg.jpg"
        alt="Hero Background"
        className="w-full h-full object-cover opacity-40" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
    {/* Green Dots */}
    {/* 绿点动画 */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, index) => (
        <div
        key={`dot-${index}`}
        className="absolute w-1.5 h-1.5 rounded-full opacity-60" 
        style={{
          backgroundColor: "#20B2A6",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `slow-drift ${15 + Math.random() * 20
          }s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }} 
        />
      ))}
    </div>
    {/* Contents */}
    {/* 内容 */}
    <div className="container mx-auto px-6 pt-22 md:pt-22 pb-20 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text Content */}
        {/* 左列 - 文本内容 */}
        <div className="space-y-8">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Senior Technical Artist — Rendering & UI Systems
            </span>
          </div>
          <div className="space-y-4">
            {/* Headline */}
            {/* 标题 */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in animation-dealy-100">
              Engineering <span className="text-primary glow-text">systems</span>
              <br />
              for
              <br />
              <span className="font-serif italic font-normal text-white">
                real-time worlds
              </span>
            </h1>
            {/* Description Text */}
            {/* 简介文本 */}
            <p
              className="text-lg text-muted-foreground max-w-lg animate-fade-in animation-delay-200"
            >
              I'm Zhiyuan — a Senior Technical Artist with AAA experience across
              Unreal, Snowdrop, and custom engines. I specialize in real-time
              rendering, UI systems, profiling, and the tooling that keeps large
              art teams moving fast. I've shipped across PC, console, and Switch.
            </p>
          </div>
          {/* CTA Buttons*/}
          {/* 两个大按钮 */}
          <div className="flex flex-wrap gap-4 animate-fade-in animation-delay-300">
            <Button size="lg" onClick={scrollToExperience}>
              View My Projects <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          {/* social links */}
          {/* 社交链接 */}
          <div className="flex items-center gap-4 animate-fade-in animation-delay-400">
            <span className="text-sm text-muted-foreground">Follow me:</span>
            {[
              { icon: Github, href: "https://github.com/techartistcanada/YannEngine", label: "GitHub" },
              { icon: Linkedin, href: "https://www.linkedin.com/in/zhiyuan-you-91912b327?locale=en_US", label: "LinkedIn" },
            ].map((social, idx) => {
              const Icon = social.icon;
              return (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full glass hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
        {/* Right Column - Photo */}
        {/* 右列 - 照片 */}
        {/* Awesome Code Snippets */}
        {/* Awesome Code Snippets */}
        <motion.div
            className="hero-image-container"
            initial={{opacity: 0, x: 50}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.8, delay: 0.4}}
        >
                        <div className="code-display">
                            <SyntaxHighlighter
                                language="cpp"
                                customStyle={{
                                    margin: 0,
                                    padding: "2rem",
                                    height: "100%",
                                    borderRadius:"20px",
                                    background: "rgba(30, 41, 59, 0.8)",
                                    backdropFilter: "blur(10px)",
                                    marginBottom: 50,
                                }}
                                style={vscDarkPlus}
                        >
{/* 伪代码 */}
{/* 伪代码 */}
{`struct FrameContext
{
    Camera        camera;
    GPUProfiler   profiler;
    RenderGraph   graph;
    DebugOverlay  debug;
};

void RenderFrame(FrameContext& frame)
{
    // --------------------------------------------------------
    // Render passes (artist-friendly, data-driven)
    // --------------------------------------------------------
    frame.graph.AddPass("Depth Prepass", [&]
    {
        DrawDepth(visible.opaque);
    });
    frame.graph.AddPass("Post Processing", [&]
    {
        ApplyTAA();
        ToneMap();
        ColorGrade();
    });
} `}
                            </SyntaxHighlighter>
                        </div>
                        {/* 代码上方悬浮的小动画 */}
                        <motion.div
                            className="floating-card"
                            animate={{y: [0, -10, 0], rotate: [0, 2, 0]}}
                            transition={{duration: 4, repeat: Infinity, ease: "easeInOut"}}
                        >
                            <div className="floating-card-content">
                                <span className="floating-card-icon">💻</span>
                                <span className="floating-card-text">Currently working on a game engine!</span>
                            </div>
                        </motion.div>
                    </motion.div>
      </div>
    </div>

  </section>
  );
};

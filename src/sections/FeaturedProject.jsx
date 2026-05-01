import { motion } from "framer-motion";
import {
  Layers,
  Sun,
  Edit3,
  Database,
  GitBranch,
  Sliders,
  Zap,
  RefreshCw,
  Shield,
  Box,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Cross-API Rendering Abstraction",
    description: "Unified backend over Vulkan & Direct3D 12 — swap APIs without touching engine code.",
  },
  {
    icon: Sun,
    title: "Full Physically Based Rendering",
    description: "GGX BRDF, image-based lighting, area lights, and real-time IBL capture.",
  },
  {
    icon: GitBranch,
    title: "Frame Graph Architecture",
    description: "Automatic pass scheduling, resource aliasing, and GPU barrier inference.",
  },
  {
    icon: Database,
    title: "Data-Oriented Entity System",
    description: "Cache-friendly ECS with archetypal storage and parallel query execution.",
  },
  {
    icon: Edit3,
    title: "Integrated Scene Editor",
    description: "ImGui-driven editor with transform gizmos, live property panel, and viewport.",
  },
  {
    icon: Sliders,
    title: "Full Post-Processing Stack",
    description: "TAA, bloom, depth-of-field, tone mapping, and artist-driven color grading.",
  },
  {
    icon: Zap,
    title: "Fiber-Based Job System",
    description: "Work-stealing scheduler with lock-free queues for true multi-core parallelism.",
  },
  {
    icon: RefreshCw,
    title: "Hot-Reload Asset Pipeline",
    description: "Live shader and texture reloading mid-session, no restart required.",
  },
  {
    icon: Shield,
    title: "Multi-Cascade Shadow Mapping",
    description: "PCF / PCSS soft shadows with automatic cascade splits and bias stabilization.",
  },
  {
    icon: Box,
    title: "Scene Serialization & Prefabs",
    description: "JSON-driven scene graph with prefab instancing and incremental asset loading.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export const FeaturedProject = ({ onOpen }) => {
  const handleOpen = () => {
    if (onOpen) onOpen();
  };

  const handleKeyOpen = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <motion.section
      id="featured-project"
      className="experience"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Section heading */}
      <motion.div
        className="text-center mb-16"
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-primary mb-6">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Featured Personal Project
        </span>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
          <span className="text-primary glow-text">Modern Game Engine</span>
          <br />
          <span className="font-serif italic font-normal text-white">From Scratch</span>
        </h2>
      </motion.div>

      {/* Clickable wrapper — opens detail page */}
      <div
        role="link"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyOpen}
        aria-label="Open The Lifetime of a Frame in YannEngine article"
        className="group/card relative max-w-6xl mx-auto rounded-3xl cursor-pointer transition-all duration-500 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ padding: "2rem", border: "1px solid rgba(32,178,166,0.06)" }}
      >
        {/* Soft halo on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(800px circle at 50% 30%, rgba(32,178,166,0.08), transparent 60%)",
          }}
        />

        {/* "Read article" floating CTA */}
        <div className="absolute top-6 right-6 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-primary opacity-70 group-hover/card:opacity-100 group-hover/card:bg-primary/10 transition-all duration-300">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Read the devlog</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
        </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">

        {/* Left — cover image placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ minHeight: "460px" }}
        >
          {/* Gradient base */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #0d1f2d 0%, #0f2a2a 40%, #0a1a1a 100%)",
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#20b2a6 1px, transparent 1px), linear-gradient(90deg, #20b2a6 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Glowing orb */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #20b2a6, transparent 70%)" }}
          />

          {/* Corner accent lines */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary opacity-60 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary opacity-60 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary opacity-60 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary opacity-60 rounded-br-2xl" />

          {/* Placeholder content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 py-16 text-center gap-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-2"
              style={{ border: "1px solid rgba(32,178,166,0.4)" }}
            >
              <Box className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-primary font-mono text-sm tracking-widest uppercase opacity-70">
              Cover Image — Coming Soon
            </p>
            <p className="text-muted-foreground text-xs max-w-48">
              Screenshots and demo video will be added as development progresses.
            </p>

            {/* Floating stat badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {["C++20", "Vulkan", "DirectX 12", "ImGui"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-mono text-primary"
                  style={{
                    background: "rgba(32,178,166,0.1)",
                    border: "1px solid rgba(32,178,166,0.25)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right — feature list */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group p-4 rounded-xl glass transition-all duration-300 hover:border-primary/40"
                style={{ border: "1px solid rgba(32,178,166,0.12)" }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 p-2 rounded-lg flex-shrink-0 transition-colors duration-300 group-hover:bg-primary/20"
                    style={{ background: "rgba(32,178,166,0.08)" }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      </div>
    </motion.section>
  );
};

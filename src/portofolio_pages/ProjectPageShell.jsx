import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

const Tag = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-xs font-mono text-primary bg-primary/10 border border-primary/20">
    {children}
  </span>
);

const SectionHeading = ({ children }) => (
  <h2 className="mt-16 mb-6 text-2xl md:text-3xl font-bold text-foreground">
    <span className="text-primary glow-text">{children}</span>
  </h2>
);

const MediaFrame = ({ src, title, compact = false }) => {
  const isLocalVideo = /\.(mp4|webm|ogg)$/i.test(src);

  return (
    <div className={`relative w-full ${compact ? "aspect-video" : "aspect-video"} rounded-xl overflow-hidden glass`}>
      {isLocalVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          title={title}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  );
};

const ImageTile = ({ src, alt, caption, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(src)}
    className="group text-left rounded-xl overflow-hidden glass hover:border-primary/40 transition-colors cursor-pointer"
  >
    <div className="aspect-[4/3] overflow-hidden bg-card">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>
    <div className="px-4 py-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
      {caption}
    </div>
  </button>
);

const SpecList = ({ specs }) => (
  <div className="rounded-xl glass p-6">
    <h3 className="mb-4 text-lg font-semibold text-primary">Technical Specs</h3>
    <dl className="space-y-3">
      {specs.map((spec) => (
        <div key={spec.label} className="grid grid-cols-[110px_1fr] gap-4 text-sm">
          <dt className="text-muted-foreground">{spec.label}</dt>
          <dd className="text-foreground/90">{spec.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const FeatureGroup = ({ title, items }) => (
  <div className="rounded-xl glass p-6">
    <h3 className="mb-4 text-xl font-semibold text-primary/95">{title}</h3>
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ImageModal = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!image) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(3, value + 0.25));
      if (event.key === "-") setZoom((value) => Math.max(0.5, value - 0.25));
      if (event.key === "0") setZoom(1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <img
          src={image}
          alt="Expanded project visual"
          className="max-h-[82vh] max-w-full rounded-lg object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Close image"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Reset zoom"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

export const ProjectPageShell = ({ project, onBack }) => {
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/75 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            {project.category}
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
        <div className="relative container mx-auto max-w-6xl px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {project.kicker}
              </span>
              <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="text-primary glow-text">{project.titleAccent}</span>
                <br />
                <span className="font-serif italic font-normal text-white">{project.titleRest}</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {project.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View source
                </a>
              )}
            </div>
            <div className="overflow-hidden rounded-xl glass">
              <img src={project.cover} alt={project.title} className="h-full min-h-[280px] w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto max-w-6xl px-6 pb-28">
        {project.videos?.length > 0 && (
          <section className="space-y-8">
            {project.videos.map((video) => (
              <div key={video.src}>
                <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                  <Play className="h-4 w-4 text-primary" />
                  {video.label}
                </div>
                <MediaFrame src={video.src} title={video.label} />
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <SectionHeading>Project Overview</SectionHeading>
            {project.overview.map((paragraph) => (
              <p key={paragraph} className="my-4 text-[0.97rem] leading-[1.85] text-foreground/85">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-16">
            <SpecList specs={project.specs} />
          </div>
        </section>

        {project.features?.length > 0 && (
          <section>
            <SectionHeading>Implementation</SectionHeading>
            <div className="grid gap-5 md:grid-cols-2">
              {project.features.map((feature) => (
                <FeatureGroup key={feature.title} title={feature.title} items={feature.items} />
              ))}
            </div>
          </section>
        )}

        {project.gallery?.length > 0 && (
          <section>
            <SectionHeading>{project.galleryTitle || "Project Showcase"}</SectionHeading>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((image) => (
                <ImageTile key={image.src} {...image} onOpen={setActiveImage} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-16 border-t border-border/40 pt-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
        </div>
      </main>

      <ImageModal image={activeImage} onClose={() => setActiveImage(null)} />
    </div>
  );
};

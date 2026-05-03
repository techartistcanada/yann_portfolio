import { ArrowLeft } from "lucide-react";

const assetBase = "/projects/photoshop_umg";

const layoutPrompt = `anime game character screen, full body female character standing on the left, futuristic military style, holding a detailed rifle, white long hair, red eyes, calm expression, sci-fi industrial background

mobile game UI overlay, RPG interface, clean layout, right side status panel showing stats (HP, ATK, DEF), equipment slots with icons, level indicator (LV1/100), character name in Japanese style text

bottom navigation bar with icons (character, team, lobby, inventory), blue glowing buttons, upgrade button, skill icons with circular frames

high quality UI design, professional game interface, sharp edges, soft glow effects, subtle gradients, modern mobile game HUD, polished AAA mobile game style

composition: character on the left, UI panels on the right, balanced layout, vertical 9:16 format

ultra detailed, clean, readable UI, no clutter`;

const Section = ({ title, children }) => (
  <section className="border-t border-border/40 py-12">
    <h2 className="mb-6 text-3xl font-bold text-primary glow-text">{title}</h2>
    {children}
  </section>
);

const BulletList = ({ items }) => (
  <ul className="space-y-3 text-foreground/85">
    {items.map((item) => (
      <li key={item} className="flex gap-3 leading-relaxed">
        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const MediaImage = ({ src, alt, className = "" }) => (
  <div className={`mt-6 overflow-hidden rounded-xl glass ${className}`}>
    <img src={src} alt={alt} className="w-full object-cover" />
  </div>
);

const MediaVideo = ({ src, title }) => (
  <div className="mt-6 overflow-hidden rounded-xl glass">
    <video
      className="aspect-video w-full object-cover"
      src={src}
      title={title}
      controls
      playsInline
      preload="metadata"
    />
  </div>
);

const WorkflowStep = ({ number, title, children }) => (
  <div className="rounded-xl glass p-6">
    <h3 className="mb-4 text-xl font-semibold text-foreground">
      <span className="mr-3 text-primary">{number}.</span>
      {title}
    </h3>
    {children}
  </div>
);

export const PhotoshopUMG = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background pt-[73px] text-foreground">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/85 shadow-lg shadow-black/20 backdrop-blur-md">
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
            Tech Art UI
          </span>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-6 pb-24 pt-16">
        <header className="pb-12">
          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
            <span className="text-primary glow-text">AI-Assisted UI Implementation</span>
            <br />
            <span className="font-serif italic font-normal text-white">in Unreal Engine (UMG)</span>
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            A lightweight UI production workflow combining Photoshop layout design, AI-generated
            assets, and Unreal Engine UMG implementation.
          </p>
        </header>

        <Section title="Demo">
          <MediaImage
            src={`${assetBase}/overview.gif`}
            alt="AI-assisted UMG UI workflow demo"
            className="mx-auto max-w-full md:max-w-[30%]"
          />
        </Section>

        <Section title="Overview">
          <p className="mb-5 text-foreground/85">This project demonstrates a simple but practical UI workflow:</p>
          <BulletList
            items={[
              "Layout design in Photoshop",
              "Icon generation using AI tools (ComfyUI)",
              "Integration into Unreal Engine UMG",
              "Basic UI animation and material effects",
            ]}
          />
        </Section>

        <Section title="Workflow">
          <div className="space-y-8">
            <WorkflowStep number="1" title="Photoshop (Layout Design)">
              <BulletList
                items={[
                  "Designed UI layout using layered PSD",
                  "Defined spacing, hierarchy, and composition",
                ]}
              />
              <MediaImage src={`${assetBase}/photoshop_layout.png`} alt="Photoshop layout" />
            </WorkflowStep>

            <WorkflowStep number="2" title="AI Asset/Layout Generation">
              <BulletList
                items={[
                  "Generated part of the icons using ComfyUI",
                  "Combined with curated external icon assets",
                  "Maintained visual consistency through prompt control",
                ]}
              />
              <h4 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Layout Example Prompt
              </h4>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-border/50 bg-black/35 p-5 text-sm leading-relaxed text-foreground/85">
                <code>{layoutPrompt}</code>
              </pre>
              <MediaImage src={`${assetBase}/comfyui.png`} alt="ComfyUI random example" />
            </WorkflowStep>

            <WorkflowStep number="3" title="Unreal Engine (UMG Implementation)">
              <BulletList
                items={[
                  "Built UI using UMG widgets",
                  "Organized layout using containers (Vertical Box, Overlay, etc.)",
                ]}
              />
              <MediaImage src={`${assetBase}/umg_layout.png`} alt="UMG layout" />
            </WorkflowStep>

            <WorkflowStep number="4" title="Material & Animation">
              <BulletList
                items={[
                  "Implemented animated flow effect using material (flow arrow)",
                  "UI animations (levelup pop-up)",
                ]}
              />
              <MediaVideo src={`${assetBase}/umg_animation.mp4`} title="UMG animation" />
              <MediaVideo src={`${assetBase}/material.mp4`} title="Material flow effect" />
            </WorkflowStep>
          </div>
        </Section>

        <Section title="Key Features">
          <BulletList
            items={[
              "Clean UI layout translated from PSD to UMG",
              "AI-assisted icon generation for rapid asset creation",
              "Real-time UI animation inside Unreal Engine",
              "Material-driven visual effect (flow arrow)",
            ]}
          />
        </Section>

        <Section title="Technical Details">
          <div className="rounded-xl glass p-6">
            <dl className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <dt className="text-muted-foreground">Engine</dt>
                <dd>Unreal Engine (UMG)</dd>
              </div>
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <dt className="text-muted-foreground">Tools</dt>
                <dd>Photoshop, ComfyUI</dd>
              </div>
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <dt className="text-muted-foreground">Techniques</dt>
                <dd>
                  <BulletList
                    items={[
                      "UI layout structuring",
                      "Material-based animation",
                      "UMG animation system",
                    ]}
                  />
                </dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section title="Limitations">
          <BulletList
            items={[
              "Not a fully automated pipeline",
              "AI usage limited to asset generation (icons/backgrounds)",
              "No dynamic data binding or complex UI logic",
            ]}
          />
        </Section>

        <Section title="What I Learned">
          <BulletList
            items={[
              "Bridging design (PSD) and engine implementation (UMG)",
              "Using AI tools to speed up UI asset creation",
              "Implementing simple but effective UI animation in Unreal",
            ]}
          />
        </Section>

        <div className="border-t border-border/40 pt-8">
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
    </div>
  );
};

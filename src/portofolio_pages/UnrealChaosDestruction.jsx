import { ProjectPageShell } from "./ProjectPageShell";

const galleryBase = "/portfolio/legacy/chaos_destruction";

const project = {
  title: "Unreal Chaos Destruction",
  titleAccent: "Unreal Chaos",
  titleRest: "Destruction",
  kicker: "Chaos / Destruction",
  category: "Chaos / Destruction",
  cover: "/portfolio/legacy/cover_unrealchaos.png",
  summary:
    "A Chaos destruction prototype for the indie game The Weight, focused on Blueprint-driven destruction behavior, physics setup, and VFX support.",
  tags: ["Unreal Engine 5", "Chaos Physics", "Blueprint", "Niagara", "Destruction"],
  videos: [
    {
      label: "Destruction Demo",
      src: "https://www.youtube.com/embed/bwuVfdb4Tc0",
    },
  ],
  overview: [
    "This prototype explores Unreal Engine Chaos destruction for interactive gameplay moments in The Weight.",
    "The implementation combines Blueprint setup, Chaos physics assets, prototyping maps, and Niagara support to validate destruction behavior quickly.",
  ],
  specs: [
    { label: "Engine", value: "Unreal Engine 5" },
    { label: "Physics", value: "Chaos Physics" },
    { label: "Scripting", value: "Blueprint" },
    { label: "VFX", value: "Niagara" },
  ],
  features: [
    {
      title: "Blueprint Control",
      items: [
        "Blueprint logic drives prototype interaction and destruction triggers.",
        "Setup keeps behavior editable during feature prototyping.",
      ],
    },
    {
      title: "Chaos Prototype Map",
      items: [
        "Feature map used to validate breakable object behavior and physics response.",
        "Destruction setup coordinated with VFX needs for game feel.",
      ],
    },
  ],
  galleryTitle: "Blueprint and Chaos Setup",
  gallery: [
    { src: `${galleryBase}/blueprint.png`, alt: "Blueprint", caption: "Blueprint" },
    {
      src: `${galleryBase}/feature_prototyping_map.png`,
      alt: "Feature Prototyping Map",
      caption: "Feature Prototyping Map",
    },
  ],
};

export const UnrealChaosDestruction = ({ onBack }) => (
  <ProjectPageShell project={project} onBack={onBack} />
);

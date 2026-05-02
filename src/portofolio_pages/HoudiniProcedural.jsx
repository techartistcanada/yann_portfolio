import { ProjectPageShell } from "./ProjectPageShell";

const project = {
  title: "Houdini Procedural Generation In Unreal",
  titleAccent: "Houdini",
  titleRest: "Procedural Generation",
  kicker: "Procedural / Houdini",
  category: "Procedural / Houdini",
  cover: "/portfolio/legacy/cover_houdiniprocedural.gif",
  summary:
    "A procedural content generation workflow that bridges Houdini authoring with Unreal Engine runtime iteration through Houdini Engine.",
  tags: ["Houdini", "Houdini Engine", "Unreal Engine 5.5", "VEX", "Procedural Tools"],
  videos: [
    {
      label: "Unreal Integration Demo",
      src: "https://www.youtube.com/embed/CvtiFu9-Ibo",
    },
    {
      label: "Houdini Project Overview",
      src: "https://www.youtube.com/embed/hv7YZCdc-8g",
    },
  ],
  overview: [
    "This project demonstrates procedural content generation workflows that connect Houdini's node-based toolset with Unreal Engine's real-time rendering environment.",
    "The workflow was built around rapid iteration and scalable content creation, allowing authored Houdini systems to be exposed as adjustable tools inside Unreal.",
  ],
  specs: [
    { label: "Houdini", value: "SideFX Houdini 20.5" },
    { label: "Engine", value: "Unreal Engine 5.5" },
    { label: "Pipeline", value: "Houdini Engine for Unreal" },
    { label: "Scripting", value: "VEX and procedural node networks" },
  ],
  features: [
    {
      title: "Procedural Authoring",
      items: [
        "Built reusable Houdini systems for parameterized content generation.",
        "Structured controls so artists and designers can iterate without changing the underlying graph.",
      ],
    },
    {
      title: "Unreal Integration",
      items: [
        "Used Houdini Engine to expose procedural assets directly inside Unreal.",
        "Validated generated content in a real-time environment for lighting, scale, and composition.",
      ],
    },
  ],
};

export const HoudiniProcedural = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

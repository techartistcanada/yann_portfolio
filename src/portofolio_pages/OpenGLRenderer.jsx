import { ProjectPageShell } from "./ProjectPageShell";

const project = {
  title: "SimToyEngine - Minimal OpenGL Renderer",
  titleAccent: "SimToyEngine",
  titleRest: "OpenGL Renderer",
  kicker: "Engine Programming / Rendering",
  category: "Engine Programming / C++",
  cover: "/portfolio/legacy/cover_openglrenderer.png",
  summary:
    "A lightweight renderer built from scratch in modern OpenGL to study and manually control the graphics pipeline.",
  tags: ["OpenGL", "GLSL", "C++", "ImGui", "Rendering", "Shaders"],
  sourceUrl: "https://gitlab.com/simgamedev/stylizeddemoopengl",
  overview: [
    "This project demonstrates renderer implementation without relying on a game engine framework. It focuses on direct control over shader setup, scene construction, camera logic, materials, and debugging UI.",
    "The goal was to build practical understanding of how the graphics pipeline behaves at a low level, from shader inputs to final composition.",
  ],
  specs: [
    { label: "API", value: "Modern OpenGL" },
    { label: "Language", value: "C++" },
    { label: "Shaders", value: "GLSL" },
    { label: "Architecture", value: "Minimal renderer" },
    { label: "Tooling", value: "ImGui debug UI" },
    { label: "Platform", value: "Cross-platform" },
  ],
  features: [
    {
      title: "Rendering Basics",
      items: [
        "Custom GLSL shader pipeline.",
        "Tangent-space normal mapping, transparency, and skybox rendering.",
        "Multiple material support on a single mesh.",
      ],
    },
    {
      title: "Manual Scene Construction",
      items: [
        "Objects and transforms managed directly for clarity.",
        "Hard-coded demo scenes used to validate rendering features.",
      ],
    },
    {
      title: "Engine Fundamentals",
      items: [
        "Camera module with perspective projection.",
        "Mouse and keyboard input handling.",
        "Quaternion-based rotation replacing Euler angle workflows.",
      ],
    },
    {
      title: "Debug Tooling",
      items: [
        "ImGui integration for runtime parameter tweaking and renderer inspection.",
      ],
    },
  ],
};

export const OpenGLRenderer = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

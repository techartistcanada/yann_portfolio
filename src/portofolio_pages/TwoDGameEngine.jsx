import { ProjectPageShell } from "./ProjectPageShell";

const project = {
  title: "The Last Hospital - Custom 2D Simulation Game Engine",
  titleAccent: "The Last Hospital",
  titleRest: "2D Simulation Engine",
  kicker: "Personal Engine Project",
  category: "Engine Programming / C++",
  cover: "/portfolio/legacy/cover_2dgameengine.png",
  summary:
    "A custom C++ 2D engine built as the foundation for a simulation and management game prototype, with ECS gameplay architecture, world simulation, AI, rendering, and tools.",
  tags: ["C++", "CMake", "OpenGL", "ECS", "NoesisGUI", "Simulation"],
  sourceUrl: "https://gitlab.com/simgamedev/thelasthospitalresume",
  videos: [
    {
      label: "Engine Demo",
      src: "https://www.youtube.com/embed/r4xblCVZrhY?start=227",
    },
  ],
  overview: [
    "I designed and implemented a custom 2D game engine in C++ as the foundation for a simulation and management game prototype. The engine includes core systems for entity management, simulation, AI, rendering, UI, and editor workflows.",
    "The project demonstrates full engine architecture work across low-level runtime systems and high-level gameplay systems, with a focus on building practical tools for content iteration.",
  ],
  specs: [
    { label: "Language", value: "Modern C++" },
    { label: "Build", value: "CMake" },
    { label: "Libraries", value: "stb_image, magic_enum, spdlog" },
    { label: "Architecture", value: "Entity Component System" },
    { label: "Platform", value: "Windows, cross-platform ready" },
    { label: "UI", value: "NoesisGUI and custom UI widgets" },
  ],
  features: [
    {
      title: "Entity and Gameplay Systems",
      items: [
        "ECS framework for flexible game logic and runtime composition.",
        "State flow for main menu, loading, map editor, paused, and gameplay states.",
        "Character system with animation controllers and character management.",
      ],
    },
    {
      title: "Simulation and World Management",
      items: [
        "GameWorld module for rooms, tiles, and in-game entities.",
        "Time system for scheduling, simulation steps, and day/night behavior.",
        "Virus module for epidemic and contagion simulation mechanics.",
      ],
    },
    {
      title: "AI and Pathfinding",
      items: [
        "Graph and AI modules for agent behavior and path navigation.",
        "Messaging system for event-driven interactions between objects.",
      ],
    },
    {
      title: "Rendering and UI",
      items: [
        "Sprite and tilemap rendering with texture and animation management.",
        "Custom GUI widgets including buttons, labels, scrollbars, and dropdowns.",
        "NoesisGUI middleware integration for advanced in-engine UI.",
      ],
    },
    {
      title: "Tools and Extensibility",
      items: [
        "Built-in map editor and tile selector for level authoring.",
        "Logging, debugging, math helpers, threading, and asset management utilities.",
      ],
    },
  ],
};

export const TwoDGameEngine = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

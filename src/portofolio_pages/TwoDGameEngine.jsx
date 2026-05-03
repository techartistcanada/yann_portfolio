import { ProjectPageShell } from "./ProjectPageShell";

const project = {
  title: "The Last Hospital - Custom 2D Simulation Game Engine",
  titleAccent: "The Last Hospital",
  titleRest: "Custom C++ Simulation Engine",
  kicker: "Solo-Developed Management Simulation",
  category: "Engine Programming / AI Simulation / C++",
  cover: "/portfolio/legacy/cover_2dgameengine.png",
  summary:
    "A solo-developed real-time hospital management simulation built on a custom C++17 engine. The game combines tycoon-style construction, autonomous staff and patient behavior, GOAP planning, time-sliced pathfinding, simulation systems, custom tools, and two UI stacks.",
  tags: ["C++17", "SFML", "GOAP AI", "ECS", "Pathfinding", "NoesisGUI", "Lua", "CMake"],
  sourceUrl: "https://gitlab.com/simgamedev/thelasthospitalresume",
  videos: [
    {
      label: "Engine Demo",
      src: "https://www.youtube.com/embed/r4xblCVZrhY?start=227",
    },
  ],
  overview: [
    "The Last Hospital is a real-time management and tycoon simulation set in a fictional pandemic where the player builds, staffs, and operates the last hospital still standing. The player lays out rooms, places equipment, manages finances, and keeps patients moving through registration, testing, treatment, recovery, and discharge.",
    "The technical focus of the project is that the entire game runs on a from-scratch C++17 engine built on top of SFML rather than Unity, Unreal, or an off-the-shelf game framework. The codebase contains engine systems, gameplay simulation, AI planning, pathfinding, UI, audio, resource management, scripting hooks, and an in-game map editor.",
    "Patients and staff are not driven by one large scripted state machine. They use goals, world-state facts, actions, path requests, steering, delayed messages, and room/equipment state to decide what to do in a hospital that can change while the simulation is running.",
  ],
  specs: [
    { label: "Genre", value: "Real-time management / tycoon simulation" },
    { label: "Language", value: "C++17" },
    { label: "Platforms", value: "Windows and macOS through CMake" },
    { label: "Codebase", value: "~35,000 lines across ~290 C++ source files" },
    { label: "Engine", value: "Custom engine built from the ground up" },
    { label: "Libraries", value: "SFML 2.5.1, NoesisGUI, Lua 5.4, spdlog, Intel TBB, GLEW, OpenGL, stb_image, magic_enum" },
    { label: "UI", value: "Custom SFML GUI plus XAML / MVVM NoesisGUI integration" },
  ],
  features: [
    {
      title: "Hospital Simulation",
      items: [
        "Players construct the hospital by drawing walls, laying flooring, placing doors, and installing equipment such as PCR machines, X-ray scanners, ventilators, drug cabinets, beds, lockers, IV racks, and swab boxes.",
        "Rooms are assigned by type, including Pharmacy, Ward, Washroom, Waiting Room, PCR Test Room, and X-Ray Room.",
        "The simulation tracks game time, hospital finances, room ownership, occupancy, queues, equipment state, infection spread, patient vitals, staff roles, and delayed gameplay events.",
        "Patients register, queue, get tested, receive treatment, occupy beds, use ventilators when severe, eat, sleep, use the washroom, and may recover or die based on simulation state.",
      ],
    },
    {
      title: "Custom ECS Architecture",
      items: [
        "Entities are IDs plus component bitmasks, with systems registering the component masks they operate on.",
        "Component factories allow new component types to be registered cleanly, including Position, Sprite, State, Movable, Controller, Collidable, Wall, Door, Floor, Storage, Item, and SimpleSprite.",
        "Systems such as rendering, movement, collision, control, state, sprite animation, wall, floor, and storage processing live in separate modules.",
        "The engine/gameplay boundary is kept explicit so reusable engine systems do not include game-specific headers.",
      ],
    },
    {
      title: "GOAP Character AI",
      items: [
        "Each NPC owns typed world-state facts, goals with insistence values, and a library of actions with preconditions, effects, costs, durations, and target requirements.",
        "A planner runs A* over the action space, while an arbitrator chooses the most urgent achievable goal each tick.",
        "The action library includes hospital-specific actions such as registration, swabbing, testing, X-ray scanning, ventilator hookup, drug delivery, bed use, toilet use, sweeping, eating, and going home.",
        "A small Idle / MoveTo / Perform FSM handles execution mechanics on top of the generated GOAP plan.",
      ],
    },
    {
      title: "Pathfinding, Steering, and Dynamic Worlds",
      items: [
        "The graph library implements DFS, BFS, Dijkstra, A*, time-sliced A*, and pluggable heuristic policies.",
        "A PathManager budgets search cycles per frame so many characters can request paths without stalling the simulation.",
        "Navigation graphs are generated from the tilemap and updated when the player builds or demolishes walls and doors.",
        "Reynolds-style steering behaviors such as Seek, Flee, Arrive, Wander, Separation, and Wall Avoidance smooth character movement along paths.",
      ],
    },
    {
      title: "Messaging and Game-Time Events",
      items: [
        "A gameplay telegram dispatcher supports immediate, delayed, targeted, and broadcast messages tied to in-game time rather than wall-clock time.",
        "An ECS-side observer system handles lower-latency engine events such as entity movement and component changes.",
        "Delayed messages allow events like test completion, patient arrival, and scheduled behavior to remain consistent across simulation speed settings.",
      ],
    },
    {
      title: "UI, Tools, and Content Pipeline",
      items: [
        "The project contains a custom SFML GUI system with buttons, toggles, labels, text fields, scrollbars, dropdowns, tab menus, file explorers, state-based styling, and redraw flags.",
        "NoesisGUI was integrated later for XAML-defined screens using MVVM, property-change notifications, delegate commands, converters, and SFML-to-Noesis input translation.",
        "A separate in-game map editor supports tile selection, file browsing, save/load/save-as, and round-trips the same map format used by runtime levels.",
        "Resources, entities, items, animations, tilesets, maps, fonts, textures, audio, and key bindings are config/file driven for fast iteration without recompilation.",
      ],
    },
    {
      title: "Engine Infrastructure",
      items: [
        "A state manager owns Intro, MainMenu, Loading, Game, Paused, and MapEditor states, while state-dependent systems swap input, GUI, audio, and bindings on state changes.",
        "Reference-counted resource managers lazily load textures, fonts, and audio, then unload them when retain counts reach zero.",
        "Multi-threaded file loading keeps loading screens responsive while parsing map and entity files.",
        "The audio manager supports positional sound, per-state music, reusable sound instances, and a large effect bank.",
        "Lua hooks, dual spdlog loggers, CMake cross-platform builds, and config-driven input round out the engine support layer.",
      ],
    },
  ],
};

export const TwoDGameEngine = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

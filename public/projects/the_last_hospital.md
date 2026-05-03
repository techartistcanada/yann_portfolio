# The Last Hospital

A solo-developed indie management simulation set in a fictional pandemic ("Covid‑90"), where the player builds, staffs, and runs the last hospital still standing. The project is notable not just for its gameplay, but because the **entire engine was written from scratch in C++17** on top of SFML — no Unity, no Unreal, no off‑the‑shelf game framework.

---

## At a glance

| | |
|---|---|
| **Genre** | Real-time management / tycoon simulation (single-player) |
| **Language** | C++17 |
| **Platforms** | Windows, macOS (CMake-based cross-platform build) |
| **Codebase size** | ~35,000 lines of C++ across ~290 source files (cloc) |
| **Engine** | Custom — built from the ground up |
| **Renderer / Window / Audio** | SFML 2.5.1 |
| **UI** | Custom SFML-based GUI **+** NoesisGUI (XAML / MVVM) |
| **Scripting** | Lua 5.4 (embedded) |
| **Logging** | spdlog (separate engine and gameplay sinks) |
| **Other libs** | Intel TBB, GLEW, OpenGL, stb_image, magic_enum |
| **Build** | CMake 3.15, Visual Studio (Windows), clang/Xcode (macOS) |

---

## What the game does

The player designs the hospital floor by floor: drawing walls, laying flooring, placing doors, dropping in equipment (PCR test machines, X‑ray scanners, ventilators, drug cabinets, IV racks, swab boxes, beds, lockers), and then assigning rooms by type — Pharmacy, Ward, Washroom, Waiting Room, PCR Test Room, X‑Ray Room. Patients arrive with a virus, register, queue, get tested, get treated, occupy beds, get hooked to ventilators if severe, eat, sleep, use the washroom, and leave (or don't). Staff (nurses, testers, doctors, janitors) act on their own goals — they aren't scripted to specific tasks, they decide what to do based on what the world needs and what they're capable of.

Underneath the gameplay is a full simulation: a game clock with three speeds, day/hour/minute time, hospital finances, room ownership, a virus that lives in tile-space and decays, character vitals (hunger, energy, morale, toilet, lung condition, temperature, infection stage), and a messaging bus that lets every entity react to every other entity asynchronously.

---

## Custom engine — the parts I'm proud of

### Entity Component System (ECS) with bitmask filtering

A from-scratch ECS where each entity is just an ID + a `Bitmask` of which components it owns + a vector of component pointers. Systems register the bitmask they care about (`Position | Sprite | Movable`, etc.) and the `SystemManager` only feeds them entities that match. Components are created through type-registered factories so new component types are a one-line registration. Component types include `Position`, `Sprite`, `State`, `Movable`, `Controller`, `Collidable`, `Wall`, `Door`, `Floor`, `Storage`, `SimpleSprite`, `Item`, and more — supporting up to 32 component slots in a single 32‑bit bitmask. Systems include `SRenderer`, `SMovement`, `SCollision`, `SControl`, `SState`, `SSpriteAnimation`, `SWall`, `SFloor`, `SStorage`, each living in its own translation unit.

### GOAP (Goal-Oriented Action Planning) for character AI

This is the heart of the simulation. Instead of hardcoding "patient walks to test room → patient gets tested → patient lies down," every NPC has:

- a **`WorldState`** of typed facts (`hasSwab=1`, `isRegistered=1`, `lyingInBed=0`, …)
- a list of **`Goal`s** with insistence values (e.g. *get treated*, *sleep*, *use toilet*, *eat*)
- a library of **`Action`s** with preconditions, effects, costs, durations, and a target room/entity
- a **`Planner`** that runs **A\* over the action space** to synthesize a plan that transforms the current world state into the goal state
- an **`Arbitrator`** that picks the most insistent achievable goal each tick

The action set is rich and game-specific — over **20 concrete action subclasses** including `ActionGotoRoom`, `ActionGetRegistered`, `ActionTakeSwab`, `ActionSwabMe`, `ActionTestSwab`, `ActionXRayScan`, `ActionTurnOnXRay`, `ActionTurnOnVent`, `ActionHookMeToVent`, `ActionRefillMe`, `ActionLieInMe`, `ActionDrugMe`, `ActionGiveMeDrug`, `ActionTakeDrug`, `ActionTakeSnack`, `ActionEatSnack`, `ActionUseToilet`, `ActionSweepMe`, `ActionGoHome`, etc. Each has its own `StartPerform`/`EndPerform`/`CheckProceduralPreconditions`/`RequiresInRange` overrides — so emergent behavior comes from the interaction of generic actions, not a giant scripted state machine.

Each character also has a small **FSM** (`Idle` / `MoveTo` / `Perform`) layered *on top of* the GOAP plan to handle the moment-to-moment "I'm walking, I'm doing the action, I'm done" mechanics.

### Steering behaviors

A classical Reynolds-style steering system (`AgentSteeringBehaviors.h`) with **Seek, Flee, Arrive, Wander, Separation, and Wall Avoidance**, combinable via prioritized / weighted-average / dithered summing. Wall avoidance uses dynamic feeler antennae generated each frame. This sits underneath the path follower so characters move smoothly along path edges instead of teleporting node‑to‑node.

### Pathfinding — full graph library + time-sliced search

Built on a templated **`SparseGraph<Node, Edge>`** with iterators. The library implements:

- **DFS, BFS, Dijkstra, and A\*** as templated algorithms
- A **time-sliced** A\* and Dijkstra (`Graph_SearchAStar_TS`, `Graph_SearchTimeSliced`) so a single search can be split across multiple frames
- A **`PathManager<PathPlanner>`** that allocates a fixed budget of search cycles per frame and shares them fairly across all active path requests — characters don't all stutter when a dozen agents replan simultaneously
- A **`PathPlanner`** per agent with `RequestPathToPosition` / `RequestPathToEntity`, smoothing pass, and Telegram-based notification when a path is ready or unreachable
- The DFS / BFS / Dijkstra implementations also produce **snapshots** (frontier, visited set, route, descriptive narration) — originally added so the algorithms could be visualized step-by-step for debugging and learning

Pluggable **A\* heuristic policies** (`AStarHeuristicPolicies.h`) let a single A\* template be specialized with Euclidean, Manhattan, etc. cost functions.

The nav-graph itself is generated from the tilemap and **dynamically updated** when the player builds or demolishes walls — `RemoveFromNavGraph` / `AddBackToNavGraph` keep paths valid while the hospital is being remodeled.

### Two coexisting messaging systems

1. **`CharMsgDispatcher`** — a singleton "telegram" bus inspired by Mat Buckland's design. Supports immediate dispatch, **delayed dispatch tied to the game clock** (a message scheduled for "in 2 in-game hours" fires when the simulation reaches that time, regardless of wall-clock speed), broadcast vs targeted messages, and per-message-type subscriptions through `MsgCommunicator`s. The priority queue is sorted by in-game timestamp.
2. **`EntityMessageHandler`** — an ECS-side observer/communicator system used by systems and components for tighter, lower-latency in-engine events.

Two systems sound redundant, but they aren't — the first is for *gameplay* messaging ("a new patient arrived", "the X-ray finished") with delays measured in game-time; the second is for *engine* events ("entity moved", "component added") that need to fire immediately within a tick.

### Custom in-game GUI **and** XAML/NoesisGUI side-by-side

The codebase contains **two complete UI stacks**:

- A hand-rolled `GUIManager` / `GUIInterface` / `GUIElement` system written on top of SFML. Elements include `Button`, `ToggleButton`, `Label`, `Textfield`, `Sprite`, `Scrollbar`, `DropDownMenu`, `TabMenu`, `VerticalDropDown`, `FileExplorer`. Each element supports per-state styling (`Neutral`, `Hover`, `Clicked`, `Focused`) loaded from style files, layered drawables (background + glyph + text), redraw flags, and per-state-type interface registration so different `GameStateType`s see different UIs.
- A **NoesisGUI integration** — full XAML-defined screens (`MainMenu.xaml`, `GamePlayGUI.xaml`, `HUDResourcesBar.xaml`, `WindowBuild.xaml`, `WindowAssign.xaml`, `WindowDebug.xaml`, `WindowItem.xaml`, `Settings.xaml`, etc.) with a proper **MVVM** pattern (`StateGameViewModel`, `BasicInfo`, `MultiTextConverter`), `NotifyPropertyChangedBase`, `DelegateCommand`, and reflection bindings via Noesis macros. SFML and Noesis share the OpenGL context, with manual key-mapping translation between SFML and Noesis input events.

I built the SFML one first, then layered NoesisGUI in once the UI got too complex — both stacks still work and the code shows the migration path.

### State Manager + State Dependents

A `StateManager` owns the stack of game states (`Intro`, `MainMenu`, `Loading`, `Game`, `Paused`, `MapEditor`) registered through type-based factories. Subsystems that care about state changes (the `EventManager`, `GUIManager`, `AudioManager`) implement `StateDependent` and are notified on every `SwitchTo` so they can swap their bindings, panels, music, and SFX. This means each state has its own set of input bindings, GUI panels, and music with no manual cleanup.

### Rebindable input via `keys.cfg`

The `EventManager` reads named key bindings from a config file at startup and lets any subsystem `AddCallback("BindingName", &Class::Method, instance)` per game state. Bindings can fire on any combination of key/mouse events.

### Resource manager with reference counting

A CRTP-templated `ResourceManager<Derived, T>` base class drives `TextureManager`, `FontManager`, and `AudioResourceManager`. Each resource has a retain count: `RequireResource` lazily loads + increments, `ReleaseResource` decrements + auto-unloads on zero. Backed by an `unordered_map`, mutex-guarded for multi-threaded loading, and resource paths are themselves loaded from `.cfg` files at startup so artists can ship new content without touching code.

### Multi-threaded file loading

A `Worker` base class wraps `std::thread` + `std::mutex`, and `FileLoader` extends it for incremental file parsing — so map files and entity files can stream in on a background thread while the loading screen draws progress (current line / total lines).

### Audio engine

The `AudioManager` handles **positional 3D sound** via SFML, with a hard cap on simultaneous sounds (`MaxNumAudios = 256`), an `AudioCache` of recyclable `sf::Sound` instances to avoid allocation churn, per-game-state music tracks (each state can have its own background music that auto-pauses/resumes), and per-sound properties (volume / attenuation / minDistance) loaded from a `Properties` directory. The shipped sound bank includes ~300 effects.

### Tilemap

A multi-layer tile system (`MAX_MAP_LAYERS = 4`) using a 1D-coord-keyed `unordered_map` of `unique_ptr<Tile>`, multiple tilesets per map, brush plotting (paint a rectangle of tiles in one call), and serialization to `.map` files. Render textures are baked per layer to avoid redrawing thousands of tiles per frame.

### In-game map editor

`StateMapEditor` is a fully separate game state with its own controller, file explorer GUI, tile selector, save/load/save-as, and round-trips the same `.map` format the runtime loads. The same engine runs both the game and its content-creation tool.

### Lua scripting hook

Lua 5.4 is embedded with a `CheckLua` error handler and `ReadIn` / `WriteOut` helpers, plumbed into `GameStateData` for level construction (`CreateLevel`, `SetTile`) — a foundation for moddable level definitions.

### Logging

Two independent spdlog loggers (one for engine, one for gameplay) wrapped in a singleton `Logger`, exposed through macros: `LOG_ENGINE_INFO`, `LOG_GAME_ERROR`, etc. — so you can grep engine spam separately from gameplay spam.

---

## Simulation systems

- **Game clock** — `Clock` singleton with `Normal` / `Fast` / `Fastest` speeds, accumulating a `GameTime { days, hours, minutes }` that all delayed messages, plans, and decay timers reference.
- **Hospital finance** — monthly bills, per-entity costs, cash on hand. Equipment and staff have ongoing costs that the player has to manage.
- **Room system** — rooms are defined by **flood-fill** over walled tiles (`Room::FloodFill`); building a wall can split a room, demolishing one can merge two. Each room knows its type, equipment status, occupancy, owner, queue, and tiles. Special rooms (PCR test, X‑ray) are subclasses (`RoomPCRTest`).
- **Virus** — a tile-positioned `Virus` with a birth-time; lives ~3 in-game hours in the air; spreads to characters that walk through it.
- **Patients** — register on arrival, queue for tests, get assigned to wards, can deteriorate, can die. They make their own decisions about food, sleep, and toilet via GOAP rather than scripted routines.
- **Staff** — nurses, testers, doctors with their own profession-specific innate actions.

---

## Architecture highlights

- **Hard separation of "engine" code from "gameplay" code.** The ECS, GUI, pathfinding, graph, audio, threading, resource, and event systems all live in directories that have **zero `#include` of game-specific headers**. The engine could be reused for a different game.
- **Fast iteration loop.** Entities are saved/loaded as plain text `.entity` files, items as `.item`, animations as `.sheet`, tilesets as `.tileset`, maps as `.map`, fonts/textures/audio/keys driven by `.cfg`. Most content edits don't require recompilation.
- **Modern C++.** C++17 throughout: structured bindings, `std::unique_ptr` ownership, CRTP, templates with policy classes, `std::function`-based factories, lambdas for component / element registration, `enum class` everywhere, `magic_enum` for stringification.
- **Cross-platform CMake.** Single `CMakeLists.txt` handles both Windows (MSVC + .libs + DLL copy step) and macOS (clang + .dylibs).

---

## Notable challenges I solved

- **Making a hundred independent agents plan paths simultaneously without dropping frame rate** — solved with the time-sliced search + cycle-budgeted PathManager.
- **Letting characters react to a world that's being rebuilt around them** — solved by hot-patching the navigation graph on every wall/door build/demolish, plus making path planners message their owners with `PathReady` / `NoPathAvailable` so the AI can replan mid-action.
- **Coordinating two UI stacks (custom + NoesisGUI) sharing the same OpenGL context and input pipeline** — including mapping all of SFML's keys to Noesis equivalents so XAML keyboard events fire correctly.
- **Designing actions and goals such that emergent behavior just works** — instead of writing per-character behavior scripts, I wrote ~20 small atomic actions and let A\* over the action graph compose them into believable routines.
- **Migrating the GUI from a custom stack to NoesisGUI without rewriting the whole game** — both still work today, demonstrating an incremental migration strategy.

---

## Tech stack summary

**Languages:** C++17, Lua 5.4, XAML
**Build:** CMake, MSVC, clang
**Libraries:** SFML 2.5.1, NoesisGUI 3.0.7, spdlog, Intel TBB, GLEW, OpenGL, stb_image, magic_enum
**Patterns used:** ECS, GOAP, FSM, Observer, Singleton (clock, dispatchers, logger), CRTP, Factory, MVVM, State, Strategy (heuristic policies), Telegram/Message bus
**Core CS topics applied:** A\*, Dijkstra, BFS, DFS, time-sliced search, flood fill, priority queues, steering behaviors, reference-counted resource caching, threaded I/O

---

## Why this project matters on a portfolio

- It's a **complete game engine, not a tutorial follow-along.** Every system — rendering pipeline, input, GUI, audio, ECS, AI, pathfinding, scripting, save/load, map editor — was designed and implemented from scratch.
- It demonstrates **systems thinking at scale**: ~35k lines of C++ kept organized into clearly-bounded subsystems with explicit interfaces.
- It demonstrates **real AI engineering**: not "if-else state trees," but a working GOAP planner over a non-trivial action set, integrated with steering and time-sliced pathfinding.
- It demonstrates **shipping discipline**: cross-platform build, config-driven content pipeline, dual logging, dual UI migration, separate map editor — the kind of infrastructure work most hobby projects skip.

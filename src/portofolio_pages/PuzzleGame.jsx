import { ProjectPageShell } from "./ProjectPageShell";

const galleryBase = "/portfolio/legacy/mini_puzzle_game";

const project = {
  title: "Puzzle Mini-Game With Blueprint",
  titleAccent: "Puzzle Mini-Game",
  titleRest: "Blueprint",
  kicker: "Gameplay / Blueprint",
  category: "Gameplay / Blueprint",
  cover: "/portfolio/legacy/cover_minipuzzlegame.png",
  summary:
    "An Unreal Engine Blueprint puzzle prototype featuring modular gameplay logic, player interaction, and visual scripting workflows.",
  tags: ["Unreal Engine 5", "Blueprint", "Gameplay", "Modular Components"],
  videos: [
    {
      label: "Gameplay Demo",
      src: "https://www.youtube.com/embed/9wHF2iIHT_U",
    },
  ],
  overview: [
    "This project demonstrates gameplay implementation using Unreal Engine's Blueprint visual scripting system.",
    "The prototype focuses on modular component design, board generation, shuffled puzzle state, and smooth player interaction across increasing puzzle complexity.",
  ],
  specs: [
    { label: "Engine", value: "Unreal Engine 5" },
    { label: "Scripting", value: "Blueprint" },
    { label: "Focus", value: "Gameplay prototyping" },
    { label: "Design", value: "Modular component logic" },
  ],
  features: [
    {
      title: "Puzzle Flow",
      items: [
        "Blueprint event graph coordinates puzzle setup, board state, and interaction flow.",
        "Spawn and shuffle functions separate board generation from gameplay response.",
      ],
    },
    {
      title: "Visual Scripting Structure",
      items: [
        "Functions and variables organized for iteration inside Unreal Editor.",
        "Reusable Blueprint logic supports multiple puzzle layouts and difficulty tuning.",
      ],
    },
  ],
  galleryTitle: "Blueprint Visual Programming",
  gallery: [
    {
      src: `${galleryBase}/main_event_graph.png`,
      alt: "Main Event Graph",
      caption: "Main Event Graph",
    },
    {
      src: `${galleryBase}/function1_spawn_puzzle_pieces.png`,
      alt: "Spawn Puzzle Pieces Function",
      caption: "Spawn Puzzle Pieces Function",
    },
    {
      src: `${galleryBase}/function2_shuffle_board.png`,
      alt: "Shuffle Board Function",
      caption: "Shuffle Board Function",
    },
    {
      src: `${galleryBase}/functions_and_variables.png`,
      alt: "Functions and Variables",
      caption: "Functions and Variables",
    },
  ],
};

export const PuzzleGame = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

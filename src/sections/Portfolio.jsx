const portfolioItems = [
  {
    id: "photoshop-umg",
    title: "AI-Assisted UI Implementation in Unreal Engine",
    description: "Photoshop layout, ComfyUI asset generation, and Unreal UMG implementation workflow.",
    category: "tech-art-ui",
    image: "/projects/photoshop_umg/photoshop_umg_cover.png",
  },
  {
    id: "unreal-pie-menu",
    title: "Dynamic Radial Menu System",
    description: "Unreal UMG pie menu with dynamic sector math, material feedback, and BPI communication.",
    category: "tech-art-ui",
    image: "/projects/pie_menu/piemenu_cover.gif",
  },
  {
    id: "puzzle-game",
    title: "Puzzle Mini-Game With Blueprint",
    description: "Unreal Blueprint puzzle prototype with modular board and interaction logic.",
    category: "gameplay-blueprint",
    image: "/portfolio/legacy/cover_minipuzzlegame.png",
  },
  {
    id: "stylized-materials",
    title: "Stylized Unreal Scene/Materials",
    description: "Stylized materials, master material setup, and Substance Designer texture work.",
    category: "shader-material",
    image: "/portfolio/legacy/cover_stylizedMaterials.jpg",
  },
  {
    id: "2d-game-engine",
    title: "The Last Hospital - 2D Simulation Engine",
    description: "Custom C++ engine with ECS, simulation systems, AI, UI, and editor tooling.",
    category: "engine-programming",
    image: "/portfolio/legacy/cover_2dgameengine.png",
  },
  {
    id: "houdini-procedural",
    title: "Houdini Procedural Generation In Unreal",
    description: "Houdini Engine workflow for procedural content generation inside Unreal.",
    category: "procedural-houdini",
    image: "/portfolio/legacy/cover_houdiniprocedural.gif",
  },
  {
    id: "unreal-chaos-destruction",
    title: "Unreal Chaos Destruction",
    description: "Chaos physics destruction prototype with Blueprint setup and feature test map.",
    category: "gameplay-blueprint",
    image: "/portfolio/legacy/cover_unrealchaos.png",
  },
];

export const Portfolio = ({ onOpenProject }) => {
  return (
    <section id="portfolio" className="experience">
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-center mb-10">
        <span className="text-primary glow-text">Personal Projects</span>
      </h2>

      <div className="experience-grid">
        {portfolioItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenProject?.(item.id)}
            className="project-card text-left"
          >
            <div
              className="project-image"
              style={{ backgroundImage: `url('${item.image}')` }}
            />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

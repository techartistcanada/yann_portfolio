import { useMemo, useState } from "react";

const categories = [
  { value: "all", label: "All" },
  { value: "tech-art-ui", label: "Tech Art UI" },
  { value: "shader-material", label: "Shader/Material" },
  { value: "engine-programming", label: "Engine Programming/C++" },
  { value: "procedural-houdini", label: "Procedural/Houdini" },
  { value: "gameplay-blueprint", label: "Gameplay/Blueprint" },
];

const portfolioItems = [
  {
    id: "tech-art-ui-01",
    title: "Tech Art UI",
    description: "UI tooling and workflows for artists.",
    category: "tech-art-ui",
    href: "/portfolio/tech-art-ui",
    image: "/portfolio/cover.jpg",
  },
  {
    id: "shader-material-01",
    title: "Shader/Material",
    description: "Shader graphs, materials, and rendering studies.",
    category: "shader-material",
    href: "/portfolio/shader-material",
    image: "/portfolio/cover.jpg",
  },
  {
    id: "engine-programming-01",
    title: "Engine Programming/C++",
    description: "Engine features and performance work.",
    category: "engine-programming",
    href: "/portfolio/engine-programming",
    image: "/portfolio/cover.jpg",
  },
  {
    id: "procedural-houdini-01",
    title: "Procedural/Houdini",
    description: "Procedural tools and systems in Houdini.",
    category: "procedural-houdini",
    href: "/portfolio/procedural-houdini",
    image: "/portfolio/cover.jpg",
  },
  {
    id: "gameplay-blueprint-01",
    title: "Gameplay/Blueprint",
    description: "Gameplay scripting and prototyping.",
    category: "gameplay-blueprint",
    href: "/portfolio/gameplay-blueprint",
    image: "/portfolio/cover.jpg",
  },
];

export const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") {
      return portfolioItems;
    }
    return portfolioItems.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="portfolio" className="experience">
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-center mb-10">
        <span className="text-primary glow-text">Portfolio</span>
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeCategory === category.value
                ? "bg-primary text-background"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveCategory(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="experience-grid">
        {filteredItems.map((item) => (
          <a key={item.id} href={item.href} className="project-card">
            <div
              className="project-image"
              style={{ backgroundImage: `url('${item.image}')` }}
            />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
};

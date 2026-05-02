import { useState, useEffect } from "react";
import { Hero } from "@/sections/Hero";
import { Experience } from "@/sections/Experience";
import { FeaturedProject } from "@/sections/FeaturedProject";
import { Portfolio } from "@/sections/Portfolio";
import { About } from "@/sections/About";
import { Navbar } from "@/layout/Navbar";
import { ModernGameEngineFromScratch } from "@/portofolio_pages/ModernGameEngineFromScratch";
import { PBRIBLPipeline } from "@/portofolio_pages/PBRIBLPipeline";
import { TwoDGameEngine } from "@/portofolio_pages/TwoDGameEngine";
import { HoudiniProcedural } from "@/portofolio_pages/HoudiniProcedural";
import { PuzzleGame } from "@/portofolio_pages/PuzzleGame";
import { StylizedMaterials } from "@/portofolio_pages/StylizedMaterials";
import { UnrealChaosDestruction } from "@/portofolio_pages/UnrealChaosDestruction";
import { PhotoshopUMG } from "@/portofolio_pages/PhotoshopUMG";
import { UnrealPieMenu } from "@/portofolio_pages/UnrealPieMenu";

function App() {
  const [route, setRoute] = useState("home");

  useEffect(() => {
    if (route === "home") return;
    window.scrollTo(0, 0);
  }, [route]);

  if (route === "yannengine-pbr") {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <PBRIBLPipeline onBack={() => setRoute("yannengine")} />
      </div>
    );
  }

  if (route === "yannengine") {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <ModernGameEngineFromScratch
          onBack={() => setRoute("home")}
          onNavigatePBR={() => setRoute("yannengine-pbr")}
        />
      </div>
    );
  }

  const projectRoutes = {
    "2d-game-engine": TwoDGameEngine,
    "houdini-procedural": HoudiniProcedural,
    "photoshop-umg": PhotoshopUMG,
    "puzzle-game": PuzzleGame,
    "stylized-materials": StylizedMaterials,
    "unreal-chaos-destruction": UnrealChaosDestruction,
    "unreal-pie-menu": UnrealPieMenu,
  };

  const ProjectPage = projectRoutes[route];
  if (ProjectPage) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <ProjectPage onBack={() => setRoute("home")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main>
        <Navbar />
        <Hero />
        <Experience />
        <FeaturedProject onOpen={() => setRoute("yannengine")} />
        <Portfolio onOpenProject={setRoute} />
      </main>
    </div>
  );
}

export default App;

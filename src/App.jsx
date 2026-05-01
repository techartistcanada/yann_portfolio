import { useState, useEffect } from "react";
import { Hero } from "@/sections/Hero";
import { Experience } from "@/sections/Experience";
import { FeaturedProject } from "@/sections/FeaturedProject";
import { Portfolio } from "@/sections/Portfolio";
import { About } from "@/sections/About";
import { Navbar } from "@/layout/Navbar";
import { ModernGameEngineFromScratch } from "@/portofolio_pages/ModernGameEngineFromScratch";
import { PBRIBLPipeline } from "@/portofolio_pages/PBRIBLPipeline";

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

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main>
        <Navbar />
        <Hero />
        <Experience />
        <FeaturedProject onOpen={() => setRoute("yannengine")} />
        <Portfolio />
      </main>
    </div>
  );
}

export default App;

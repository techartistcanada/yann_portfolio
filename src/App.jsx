import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Hero } from "@/sections/Hero";
import { Experience } from "@/sections/Experience";
import { FeaturedProject } from "@/sections/FeaturedProject";
import { Portfolio } from "@/sections/Portfolio";
import { About } from "@/sections/About";
import { Navbar } from "@/layout/Navbar";
import { ModernGameEngineFromScratch } from "@/portofolio_pages/ModernGameEngineFromScratch";
import { TwoDGameEngine } from "@/portofolio_pages/TwoDGameEngine";
import { HoudiniProcedural } from "@/portofolio_pages/HoudiniProcedural";
import { PuzzleGame } from "@/portofolio_pages/PuzzleGame";
import { StylizedMaterials } from "@/portofolio_pages/StylizedMaterials";
import { UnrealChaosDestruction } from "@/portofolio_pages/UnrealChaosDestruction";
import { PhotoshopUMG } from "@/portofolio_pages/PhotoshopUMG";
import { UnrealPieMenu } from "@/portofolio_pages/UnrealPieMenu";

const projectRoutes = {
  "2d-game-engine": TwoDGameEngine,
  "houdini-procedural": HoudiniProcedural,
  "photoshop-umg": PhotoshopUMG,
  "puzzle-game": PuzzleGame,
  "stylized-materials": StylizedMaterials,
  "unreal-chaos-destruction": UnrealChaosDestruction,
  "unreal-pie-menu": UnrealPieMenu,
};

const ROUTES = new Set(["home", "yannengine", ...Object.keys(projectRoutes)]);

const getRouteFromLocation = () => {
  const match = window.location.hash.match(/^#project\/([^/?#]+)/);
  const route = match ? decodeURIComponent(match[1]) : "home";

  return ROUTES.has(route) ? route : "home";
};

const getUrlForRoute = (route) => {
  const url = new URL(window.location.href);
  url.hash = route === "home" ? "" : `project/${encodeURIComponent(route)}`;

  return `${url.pathname}${url.search}${url.hash}`;
};

function App() {
  const [route, setRoute] = useState(getRouteFromLocation);

  useEffect(() => {
    window.history.replaceState(
      { appRoute: getRouteFromLocation(), fromPortfolio: false },
      "",
      getUrlForRoute(getRouteFromLocation()),
    );

    const syncRouteWithLocation = () => {
      setRoute(getRouteFromLocation());
    };

    window.addEventListener("popstate", syncRouteWithLocation);

    return () => {
      window.removeEventListener("popstate", syncRouteWithLocation);
    };
  }, []);

  useEffect(() => {
    if (route === "home") return;
    window.scrollTo(0, 0);
  }, [route]);

  const openRoute = (nextRoute) => {
    const routeToOpen = ROUTES.has(nextRoute) ? nextRoute : "home";
    window.history.pushState(
      { appRoute: routeToOpen, fromPortfolio: routeToOpen !== "home" },
      "",
      getUrlForRoute(routeToOpen),
    );
    setRoute(routeToOpen);
  };

  const backToPortfolio = () => {
    if (window.history.state?.fromPortfolio) {
      window.history.back();
      return;
    }

    window.history.replaceState(
      { appRoute: "home", fromPortfolio: false },
      "",
      getUrlForRoute("home"),
    );
    setRoute("home");
  };

  if (route === "yannengine") {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <ModernGameEngineFromScratch onBack={backToPortfolio} />
        <Analytics />
      </div>
    );
  }

  const ProjectPage = projectRoutes[route];
  if (ProjectPage) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <ProjectPage onBack={backToPortfolio} />
        <Analytics />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main>
        <Navbar />
        <Hero />
        <Experience />
        <FeaturedProject onOpen={() => openRoute("yannengine")} />
        <Portfolio onOpenProject={openRoute} />
      </main>
      <Analytics />
    </div>
  );
}

export default App;

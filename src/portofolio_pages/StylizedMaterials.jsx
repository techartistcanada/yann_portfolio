import { ProjectPageShell } from "./ProjectPageShell";

const galleryBase = "/portfolio/legacy/stylized_material";

const project = {
  title: "Stylized Unreal Scene and Materials",
  titleAccent: "Stylized Unreal",
  titleRest: "Scene / Materials",
  kicker: "Shader / Material",
  category: "Shader / Material",
  cover: "/portfolio/legacy/cover_stylizedMaterials.jpg",
  summary:
    "A stylized Unreal Engine material study covering character shading, master materials, Substance Designer textures, and environment material setup.",
  tags: ["Unreal Engine 5", "Material Editor", "Substance Designer", "HLSL", "Stylized Shading"],
  overview: [
    "This project showcases stylized environment and material development in Unreal Engine, with a focus on material authoring, procedural texturing, and readable art-direction controls.",
    "The work combines Unreal material graphs, material instances, DCC modeling, and Substance Designer texture generation to keep a consistent stylized look across lighting conditions.",
  ],
  specs: [
    { label: "Engine", value: "Unreal Engine 5" },
    { label: "Shaders", value: "Material Editor and HLSL" },
    { label: "Textures", value: "Substance Designer" },
    { label: "Focus", value: "Stylized materials and scene presentation" },
  ],
  features: [
    {
      title: "Anime Character Material",
      items: [
        "Built a stylized character material with master material and instance-level controls.",
        "Organized material parameters for fast look development inside Unreal.",
      ],
    },
    {
      title: "Stylized Prop Materials",
      items: [
        "Created wooden log model, material graph, and texture variants.",
        "Used Substance Designer to generate wood and metal pattern textures.",
      ],
    },
    {
      title: "Grass Material",
      items: [
        "Prepared grass mesh and UV layout for stylized scene use.",
        "Implemented Unreal material graph for the grass visual treatment.",
      ],
    },
  ],
  galleryTitle: "Project Showcase",
  gallery: [
    { src: `${galleryBase}/character.png`, alt: "Character Model", caption: "Character Model" },
    {
      src: `${galleryBase}/character_master_material1.png`,
      alt: "Character Master Material",
      caption: "Character Master Material",
    },
    {
      src: `${galleryBase}/character_material_instance.png`,
      alt: "Character Material Instance",
      caption: "Character Material Instance",
    },
    {
      src: `${galleryBase}/material_instance.gif`,
      alt: "Material Instance Animation",
      caption: "Material Instance Animation",
    },
    {
      src: `${galleryBase}/wooden_log_unreal.png`,
      alt: "Wooden Log in Unreal",
      caption: "Wooden Log in Unreal",
    },
    {
      src: `${galleryBase}/wooden_log_model.png`,
      alt: "Wooden Log Model",
      caption: "Wooden Log Model",
    },
    {
      src: `${galleryBase}/wooden_log_master_material.png`,
      alt: "Wooden Log Master Material",
      caption: "Wooden Log Master Material",
    },
    {
      src: `${galleryBase}/wood_texutre_substance_designer.png`,
      alt: "Wood Texture in Substance Designer",
      caption: "Wood Texture in Substance Designer",
    },
    {
      src: `${galleryBase}/metal_pattern_substance_designer.png`,
      alt: "Metal Pattern in Substance Designer",
      caption: "Metal Pattern in Substance Designer",
    },
    { src: `${galleryBase}/sd_wood.png`, alt: "SD Wood Texture", caption: "SD Wood Texture" },
    {
      src: `${galleryBase}/sd_metal_pattern.png`,
      alt: "SD Metal Pattern",
      caption: "SD Metal Pattern",
    },
    { src: `${galleryBase}/grass_mesh.png`, alt: "Grass Mesh", caption: "Grass Mesh" },
    { src: `${galleryBase}/grass_uv.png`, alt: "Grass UV", caption: "Grass UV" },
    {
      src: `${galleryBase}/unreal_material.png`,
      alt: "Unreal Material Setup",
      caption: "Unreal Material Setup",
    },
  ],
};

export const StylizedMaterials = ({ onBack }) => <ProjectPageShell project={project} onBack={onBack} />;

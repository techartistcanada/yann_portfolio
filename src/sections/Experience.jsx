import {motion} from 'framer-motion';
"use client";
import ExperienceModal from '../components/ExperienceModal';
import { useState } from "react";

const fadeInUp = {
    initial: {opacity:0, y: 20},
    animate: {opacity:1, y: 0},
    transition: {duration: 0.6},
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};
export const Experience = () => {
    const experiences = [
        {
            id: 1,
            title: "The Settlers: New Allies",
            description: "Senior Technical Artist on Ubisoft's cross-platform RTS, focused on UI systems, profiling, and Snowdrop pipeline support.",
            fullDescription: [
                "Maintained Maya-to-Snowdrop production pipelines and supported cross-discipline asset integration across multiple platforms.",
                "Owned end-to-end development of the gamepad cursor UI, including render-pass selection, shader implementation, and gameplay integration.",
                "Wrote custom C++ profiling code and modified UI nodes to reduce CPU overhead for smooth Nintendo Switch performance.",
                "Optimized LOD behavior through engine source changes and authored scalable graphics quality presets for constrained hardware.",
                "Profiled CPU/GPU performance across PC and consoles while collaborating with UI/UX, gameplay, and VFX teams to resolve rendering issues.",
            ],
            image: "/projects/thesettlers_cover.jpg",
            modalImage: "/thesettlers_2.png",
            tags: ["Snowdrop", "C++", "UI Shader", "CPU/GPU Profiling", "LOD Optimization", "Nintendo Switch"],
        },
        {
            id: 2,
            title: "The Callisto Protocol",
            description: "Senior Technical Artist on a high-fidelity Unreal Engine 4 production, supporting lighting tools, Niagara optimization, and rendering stability.",
            fullDescription: [
                "Developed and maintained custom Unreal Engine tools to streamline lighting workflows and automate repetitive optimization tasks.",
                "Optimized Niagara VFX systems for low-end console targets while preserving visual quality under strict performance budgets.",
                "Diagnosed shader and material issues to improve cross-platform rendering stability.",
                "Used CPU/GPU profiling to identify bottlenecks and implement targeted runtime optimizations.",
                "Improved scene performance by replacing selected skeletal mesh assets with static mesh alternatives where animation was unnecessary.",
            ],
            image: "/projects/the_callisto_protocol_cover.png",
            modalImage: "/thecallistoprotocol_2.png",
            tags: ["Unreal Engine 4", "Niagara", "Lighting Tools", "Shader Debugging", "Console Optimization", "CPU/GPU Profiling"],
        },
        {
            id: 3,
            title: "Microsoft Flight Simulator 40th Anniversary Edition",
            description: "Senior Technical Artist for large-scale asset ingestion, automation, validation, and team-facing pipeline standards in a custom engine.",
            fullDescription: [
                "Built 3ds Max automation scripts to standardize ingestion for characters, clothing, hairstyles, props, aircraft, and foliage.",
                "Defined technical art standards for topology, UV layout, LOD setup, shader assignment, naming, and optimization requirements.",
                "Reviewed and validated assets before engine integration to ensure pipeline compliance and cross-platform compatibility.",
                "Documented best practices for asset preparation and engine constraints across large-scale deliveries.",
                "Trained and mentored 30+ artists on preparing production-ready assets for a custom engine pipeline.",
            ],
            image: "/projects/microsoft_flight_simulator_cover.webp",
            modalImage: "/microsoftflightsimulator_1.png",
            tags: ["Custom Engine", "3ds Max Scripting", "Asset Ingestion", "Pipeline Automation", "LOD Standards", "Artist Mentorship"],
        },
    ];

    const [selectedExperience, setSelectedExperience] = useState(null);
    const selectedProject = experiences.find((experience) => experience.id === selectedExperience);

    const handleExperienceClick = (id) => {
        setSelectedExperience(id);
    }

    const handleCloseModal = () => {
        setSelectedExperience(null);
    }

    const handleNextExperience = () => {
        const currentIndex = experiences.findIndex((experience) => experience.id === selectedExperience);
        if(currentIndex === -1){
            return null;
        }
        const nextIndex = (currentIndex + 1) % experiences.length;

        setSelectedExperience(experiences[nextIndex].id);
    }

    const handlePrevExperience = () => {
        const currentIndex = experiences.findIndex((experience) => experience.id === selectedExperience);
        if(currentIndex === -1){
            return null;
        }
        const prevIndex = (currentIndex - 1 + experiences.length) % experiences.length;

        setSelectedExperience(experiences[prevIndex].id);
    }

    return(
        <motion.section
            id="experience"
            className="experience"
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
            viewport={{once: true}}
            transition={{duration: 0.6}}
        >
            <motion.h2
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{once: true}}
            >
                <span className="text-primary glow-text">Experience</span>
            </motion.h2>
                <motion.div
                    className="experience-grid"
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{once: true}}
                >
                    {experiences.map((experience) => (
                        <motion.button
                            key={experience.id}
                            type="button"
                            className="project-card"
                            variants={fadeInUp}
                            whileHover={{y: -10, transtion: {duration: 0.2}}}
                            onClick={() => handleExperienceClick(experience.id)}
                        >
                            <motion.div
                                className="project-image"
                                style={{backgroundImage: `url('${experience.image}')`}}
                                whileHover={{scale: 1.05, transition: {duration: 0.2}}}
                            />
                            <h3>{experience.title}</h3>
                            <p>{experience.description}</p>
                            <div className="project-tech">
                                {experience.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            {selectedProject && (
                <ExperienceModal
                    project={selectedProject}
                    onClose={handleCloseModal}
                    onNext={handleNextExperience}
                    onPrev={handlePrevExperience}
                />
            )}
        </motion.section>
    );
}

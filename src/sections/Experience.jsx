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
            title: "The Settlers",
            description: "The best hardcore AAA game ever",
            fullDescription: "I made it possible for this game to run on Nintendo Switch. I owned the whole gamepad cursor UI",
            image: "/projects/thesettlers_cover.jpg",
            modalImage: "/thesettlers_2.png",
            tags: ["Snowdrop", "C++", "Profiling", "Simplygon"],
        },
        {
            id: 2,
            title: "The Callisto Protcol",
            description: "The best graphics AAA game ever",
            fullDescription: "I made it possible for this game to run on Nintendo Switch. I owned the whole gamepad cursor UI",
            image: "/projects/the_callisto_protocol_cover.png",
            modalImage: "/thecallistoprotocol_2.png",
            tags: ["Snowdrop", "C++", "Profiling", "Simplygon"],
        },
        {
            id: 3,
            title: "Microsoft Flight Simulator",
            description: "The best flight simulation AAA game ever",
            fullDescription: "I made it possible for this game to run on Nintendo Switch. I owned the whole gamepad cursor UI",
            image: "/projects/microsoft_flight_simulator_cover.webp",
            modalImage: "/microsoftflightsimulator_1.png",
            tags: ["Snowdrop", "C++", "Profiling", "Simplygon"],
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

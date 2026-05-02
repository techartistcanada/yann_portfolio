import {X, ChevronLeft, ChevronRight} from 'lucide-react'
import { useRef } from "react";

export default function ExperienceModal({project, onClose, onNext, onPrev}) {
    const modalRef = useRef();

    const handleOutsideClick = (e) => {
        if(modalRef.current === e.target) {
            onClose();
        }
    }
    return (
        <div 
            onClick={handleOutsideClick}
            ref={modalRef}
            className="fixed inset-0
            bg-gray-800/75
            flex
            items-center
            justify-center
            z-50
        ">
            {/* ======================================================= */}
            {/* 弹窗 */ }
            {/* ======================================================= */}
            <div 
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className="
                bg-gray-900
                rounded-lg
                max-w-4xl
                w-11/12
                max-h-[90vh]
                overflow-y-auto
                p-12 h-8/12
            ">
                <div className="flex justify-between mb-5">
                    <h2 className="text-2xl font-bold text-primary-50">
                        {project.title}
                    </h2>
                    <button onClick={onClose}
                        className="
                            text-primary-50
                            hover:text-primary-400
                            rounded-full
                            p-2 bg-gray-800/50 
                            hover:bg:gray-800/70
                            transition-colors
                    ">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="space-y-4 md:flex-row gap-6">
                        <p className="text-gray-300 leading-relaxed">{project.description}</p>
                        {Array.isArray(project.fullDescription) ? (
                            <ul className="space-y-2">
                                {project.fullDescription.map((detail) => (
                                    <li key={detail} className="flex gap-3 text-gray-300 leading-relaxed">
                                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-300 leading-relaxed">{project.fullDescription}</p>
                        )}
                        <div>
                            <h3 className="font-semibold mb-2 text-primary">Technical Focus:</h3>
                            <ul className="flex flex-wrap gap-2">
                                {project.tags.map((tech, index) => (
                                    <li
                                        key={index}
                                        className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm text-gray-200"
                                    >
                                        {tech}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    { /* 图片 */ }
                    <div className="relative h-64 w-full md:w-1/2">
                        <img
                            src={project.modalImage}
                            alt={project.title}
                            className="h-full w-full object-cover rounded-md"
                        />
                    </div>
                    { /* 下一个/上一个按钮 */ }
                    <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-11/12 max-w-4xl">
                        <button
                            onClick={onPrev}
                            className="bg-gray-800/50 rounded-full p-2
                            hover:bg-gray-800/70 transition-colors
                            -translate-x-full"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={onNext}
                            className="bg-gray-800/50 rounded-full p-2
                            hover:bg-gray-800/70 transition-colors
                            -translate-x-[130%]"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef } from "react";

export default function ExperienceModal({ project, onClose, onNext, onPrev }) {
  const overlayRef = useRef();

  const handleOutsideClick = (event) => {
    if (overlayRef.current === event.target) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOutsideClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 px-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="experience-modal-scroll relative max-h-[90vh] w-11/12 max-w-5xl overflow-y-auto rounded-2xl border border-primary/15 bg-gray-950 p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-3xl font-bold leading-tight text-gray-100 md:text-5xl">
            {project.title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full bg-gray-900/80 p-3 text-gray-200 transition-colors hover:bg-primary/10 hover:text-primary"
            type="button"
            aria-label="Close experience details"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-primary/10 bg-gray-900/50">
          <img
            src={project.modalImage}
            alt={project.title}
            className="h-72 w-full object-cover md:h-[360px]"
          />
        </div>

        <div className="mt-8 space-y-6">
          <p className="text-gray-300 leading-relaxed">{project.description}</p>

          {Array.isArray(project.fullDescription) ? (
            <ul className="space-y-3">
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
            <h3 className="mb-3 font-semibold text-primary">Technical Focus:</h3>
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm text-gray-200"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gray-900/80 text-gray-100 transition-colors hover:bg-primary/15 hover:text-primary"
          type="button"
          aria-label="Previous experience"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gray-900/80 text-gray-100 transition-colors hover:bg-primary/15 hover:text-primary"
          type="button"
          aria-label="Next experience"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

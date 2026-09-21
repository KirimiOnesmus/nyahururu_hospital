import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconHospital, IconArrowRight } from "../../common/icons";

const Card = ({ id, image, title, buttonText, description }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const hasValidImage = image && image.trim() !== "" && !imageError;

  const handleNavigate = () => navigate(`/services/${id}`);

  return (
    <div
      onClick={handleNavigate}
      className="bg-surface border border-line rounded-2xl overflow-hidden
                 flex flex-col cursor-pointer shadow-sm
                 hover:border-primary transition-colors duration-200"
    >
      <div className="relative w-full h-40 bg-canvas border-b border-line overflow-hidden">
        {hasValidImage ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center">
              <IconHospital className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-ink mb-2 line-clamp-2">{title}</h3>

        {description && (
          <p className="text-ink-muted text-sm leading-relaxed line-clamp-3 mb-4">{description}</p>
        )}

        <div className="flex-1" />

        {buttonText && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            className="mt-3 flex items-center gap-1.5 min-h-11 text-sm font-semibold text-primary
                       hover:text-primary-hover self-start"
          >
            {buttonText}
            <IconArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStethoscope, FaArrowRight } from "react-icons/fa";

const Card = ({ id, image, title, buttonText, description }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const hasValidImage = image && image.trim() !== "" && !imageError;

  const handleNavigate = () => navigate(`/services/${id}`);

  return (
    <div
      onClick={handleNavigate}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden
                 flex flex-col cursor-pointer
                 hover:border-blue-400 transition-colors duration-200"
    >
      <div className="relative w-full h-40 bg-slate-50 border-b border-slate-100 overflow-hidden">
        {hasValidImage ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-xl bg-blue-600 flex items-center justify-center">
              <FaStethoscope className="text-3xl text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">{title}</h3>

        {description && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">{description}</p>
        )}

        <div className="flex-1" />

        {buttonText && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue-600
                       hover:text-blue-800 transition-colors duration-200 self-start"
          >
            {buttonText}
            <FaArrowRight className="text-xs" />
          </button>
        )}
      </div>

      <div className="h-0.5 bg-blue-600 scale-x-0 hover:scale-x-100 origin-left transition-transform duration-300" />
    </div>
  );
};

export default Card;
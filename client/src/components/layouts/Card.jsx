import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStethoscope, FaArrowRight } from "react-icons/fa";

const Card = ({ id, image, title, buttonText, description }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  
  const handleServices = () => {
    navigate(`/services/${id}`);
  };

  const hasValidImage = image && image.trim() !== "" && !imageError;

  return (
    <div 
      className="group relative bg-white shadow-lg rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2"
      onClick={handleServices}
    >

      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      

      <div className="relative z-10 flex flex-col items-center text-center p-6 flex-1">
      
        <div className="relative mb-6">
    
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 blur-xl scale-110 group-hover:scale-125 transition-transform duration-500"></div>
          
          {hasValidImage ? (
            <div className="relative">
              <img 
                src={image} 
                alt={title} 
                className="h-28 w-28 object-cover rounded-2xl shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 group-hover:border-blue-500/50 transition-colors duration-500"></div>
            </div>
          ) : (
            <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <FaStethoscope className="text-5xl text-white" />
            </div>
          )}
        </div>


        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>

   
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

   
        <div className="flex-1"></div>


        {buttonText && (
          <button
            onClick={handleServices}
            className="group/btn relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 flex items-center gap-2 mt-4"
          >
     
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></span>
            
  
            <span className="relative z-10 flex items-center gap-2">
              {buttonText}
              <FaArrowRight className="text-sm group-hover/btn:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        )}
      </div>

     
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};

export default Card;
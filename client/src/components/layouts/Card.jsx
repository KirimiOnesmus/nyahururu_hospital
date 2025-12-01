import React from "react";
import { useNavigate } from "react-router-dom";
import { FaStethoscope } from "react-icons/fa"; 

const Card = ({ id, image, title, buttonText }) => {
  const navigate = useNavigate();
  const handleServices = () => {
    navigate(`/services/${id}`);
  };

 
  const hasValidImage = image && image.trim() !== "";

  return (
    <div className="bg-blue-50 shadow-md rounded-2xl overflow-hidden hover:shadow-xl 
    hover:cursor-pointer transition-all duration-300 flex flex-col items-center text-center">
      

      {hasValidImage ? (
        <img 
          src={image} 
          alt={title} 
          className="h-24 w-24 mt-4 object-cover rounded-lg"
          onError={(e) => {

            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}

      <div 
        className="h-24 w-24 mt-4 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md"
        style={{ display: hasValidImage ? 'none' : 'flex' }}
      >
        <FaStethoscope className="text-5xl text-white" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        {buttonText && (
          <button
            onClick={handleServices}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-white hover:text-blue-500 border hover:cursor-pointer transition-all duration-300"
          > 
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;
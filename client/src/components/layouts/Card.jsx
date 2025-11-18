import React from "react";
import { useNavigate } from "react-router-dom";

const Card = ({ id, image, title, buttonText }) => {
  const navigate = useNavigate();
  const handleServices =()=>{
    navigate(`/services/${id}`);

  }

  return (
    <div className="bg-blue-50 shadow-md rounded-2xl overflow-hidden hover:shadow-xl 
    hover:cursor-pointer transition-all duration-300 flex flex-col items-center text-center
     ">
      {image &&
       <img src={image}
        alt={title} 
        className="h-24 w-24 mt-4" />}
      <div className="p-4 flex flex-col flex-1">
        {" "}
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

import React from "react";
import { Link } from "react-router-dom";

const DoctorCard = ({ doctor }) => {
  return (
    <Link to={`/doctors/${doctor.id}`}>
      <div
        className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all 
duration-300 w-full max-w-xs hover:cursor-pointer "
      >
        <div className="w-full h-64 bg-blue-100 flex items-center justify-center overflow-hidden">
          <img
            src={doctor.image}
            alt={doctor.title}
            className="w-full h-auto max-h-64 object-cover"
          />
        </div>
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {doctor.title}
          </h3>
          <p className="text-sm text-blue-600 font-medium">{doctor.role}</p>
        </div>
      </div>
    </Link>
  );
};

export default DoctorCard;

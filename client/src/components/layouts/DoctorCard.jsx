import React from "react";
import { Link } from "react-router-dom";

const DoctorCard = ({ doctor }) => {
  // Construct full name from firstName and lastName
  const fullName = doctor.userId?.firstName && doctor.userId?.lastName
    ? `${doctor.userId.firstName} ${doctor.userId.lastName}`
    : doctor.userId?.firstName || doctor.userId?.lastName || "Unnamed Doctor";

  return (
    <Link to={`/doctors/${doctor._id}`}>
      <div
        className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all 
duration-300 w-full max-w-xs hover:cursor-pointer h-full flex flex-col"
      >
        <div className="w-full h-64 bg-blue-100 flex items-center justify-center overflow-hidden">
          {doctor.profile?.imageUrl ? (
            <img
              src={`http://localhost:5000${doctor.profile.imageUrl}`}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <svg
                className="w-24 h-24 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4 text-center flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {fullName}
          </h3>
          <p className="text-sm text-blue-600 font-medium mb-1">
            {doctor.speciality || "General Practitioner"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default DoctorCard;
import React from "react";
import { Link } from "react-router-dom";
import { ASSET_BASE_URL } from "../../config/env";

const BACKEND_URL = ASSET_BASE_URL;

const DoctorCard = ({ doctor }) => {
  const fullName =
    (doctor.user?.firstName || doctor.userId?.firstName) &&
    (doctor.user?.lastName || doctor.userId?.lastName)
      ? `${doctor.user?.firstName || doctor.userId?.firstName} ${doctor.user?.lastName || doctor.userId?.lastName}`
      : doctor.user?.firstName ||
        doctor.userId?.firstName ||
        doctor.user?.lastName ||
        doctor.userId?.lastName ||
        "Unnamed Doctor";

  return (
    <Link to={`/doctors/${doctor.id}`} className="block h-full">
      <div className="bg-surface border border-line rounded-2xl overflow-hidden h-full flex flex-col hover:border-primary shadow-sm transition-colors">
        <div className="relative w-full h-52 bg-canvas overflow-hidden">
          {doctor.user?.profile?.imageUrl || doctor.profile?.imageUrl ? (
            <img
              src={`${BACKEND_URL}${doctor.user?.profile?.imageUrl || doctor.profile?.imageUrl}`}
              alt={fullName}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-soft">
              <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {doctor.speciality || "General Practitioner"}
          </p>
          <h3 className="text-sm font-bold text-ink leading-snug">{fullName}</h3>
        </div>
      </div>
    </Link>
  );
};

export default DoctorCard;

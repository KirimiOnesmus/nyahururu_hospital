import React from "react";
import MOH from "../../assets/Partners/MOH.png";
import County from "../../assets/Partners/County Government.png";
import KMTC from "../../assets/Partners/KMTC.png";
import SHA from "../../assets/Partners/SHA.png";

const Partners = () => {
  const logos = [
    { image: MOH, name: "Ministry of Health" },
    { image: County, name: "County Government of Laikipia" },
    { image: KMTC, name: "Kenya Medical Training College" },
    { image: SHA, name: "Social Health Authority" },
  ];
  return (
    <div className="px-8 py-4 text-center overflow-hidden">
      <div className="flex animate-slide gap-12">
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex justify-center items-center
             bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition w-40 h-24"
          >
            <img
              src={logo.image}
              alt={logo.name}
              className="h-16 object-contain hover:grayscale-0 transition"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Partners;

import React from "react";
import MOH from "../../assets/Partners/MOH.png";
import County from "../../assets/Partners/County Government.png";
import KMTC from "../../assets/Partners/KMTC.png";
import SHA from "../../assets/Partners/SHA.png";
import Laikipia_Uni from "../../assets/Partners/laikipia_university.png";

const logos = [
  { image: MOH, name: "Ministry of Health" },
  { image: County, name: "County Government of Laikipia" },
  { image: KMTC, name: "Kenya Medical Training College" },
  { image: SHA, name: "Social Health Authority" },
  { image: Laikipia_Uni, name: "Laikipia University" },
];

const Partners = () => {
  const loop = [...logos, ...logos];

  return (
    <div className="overflow-hidden py-4" aria-label="Our affiliations">
      <div className="flex w-max animate-marquee gap-12 pr-12">
        {loop.map((logo, index) => (
          <div
            key={`${logo.name}-${index}`}
            className="flex-shrink-0 flex justify-center items-center
             bg-white dark:bg-surface p-4 rounded-xl shadow-md w-40 h-24 border border-line"
          >
            <img
              src={logo.image}
              alt={logo.name}
              className="h-16 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Partners;

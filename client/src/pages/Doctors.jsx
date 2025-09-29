import React from "react";
import { Header, TimeRibbon, Footer } from "../components/layouts";
import DoctorCard from "../components/layouts/DoctorCard";
import doctors from "../data/doctorsData";
const Doctors = () => {

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body  h-full">
        <div className="px-16 py-8">
          <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
            Our Specialists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                id={doctor.id}
                doctor={doctor}
              />
            ))}
          </div>
        </div>

        <div>
          <TimeRibbon />
        </div>
      </div>
      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default Doctors;

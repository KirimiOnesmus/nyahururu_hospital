import React from "react";
import { useParams } from "react-router-dom";
import doctors from "../../data/doctorsData";
import { Header, Footer } from "../../components/layouts";
const DoctorDetails = () => {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === parseInt(id));
  if (!doctor) {
    return <p className="text-center text-red-500">Doctr not found</p>;
  }
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm ">
        <Header />
      </div>
      <div className="px-6 py-10 max-w-5xl mx-auto h-full md:min-h-screen">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {" "}
          <div className="personaldetails flex flex-col items-center">
            <img
              src={doctor.image}
              alt={doctor.title}
              className="w-60 h-60 object-cover rounded-full shadow-md mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-800">{doctor.title}</h3>
            <p className="text-blue-600 font-medium">{doctor.role}</p>
            <p className="text-gray-600">
              Department:{" "}
              <span className="font-semibold">{doctor.department}</span>
            </p>
          </div>
          <div className="profile">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Professional Experience
            </h3>
            <p className="text-gray-700 mb-6">{doctor.profile.professionalExperience}</p>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Educational Qualifications
            </h3>
            <p className="text-gray-700">{doctor.profile.educationalQualification}</p>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default DoctorDetails;

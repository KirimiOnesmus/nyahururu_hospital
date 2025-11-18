import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import { Header, Footer } from "../../components/layouts";

const DoctorDetails = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/doctors/${id}`); 
        setDoctor(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Doctor not found or error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading doctor details...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!doctor) return <p className="text-center text-red-500 mt-10">Doctor not found</p>;

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="px-6 py-10 max-w-5xl mx-auto h-full md:min-h-screen">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="personaldetails flex flex-col items-center">
            <img
              src={doctor.profile?.imageUrl ? `http://localhost:5000${doctor.profile.imageUrl}` : "/default-doctor.png"}
              alt={doctor.userId?.name || "Doctor"}
              className="w-60 h-60 object-cover rounded-full shadow-md mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-800">{doctor.userId?.name}</h3>
            <p className="text-blue-600 font-medium">{doctor.speciality || doctor.userId?.role}</p>
            <p className="text-gray-600">
              Address: <span className="font-semibold">{doctor.profile?.address || "N/A"}</span>
            </p>
          </div>
          <div className="profile">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Professional Bio</h3>
            <p className="text-gray-700 mb-6">{doctor.bio || "No bio available"}</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Educational Qualifications</h3>
            <p className="text-gray-700">{doctor.education || doctor.profile?.educationalQualification || "N/A"}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DoctorDetails;

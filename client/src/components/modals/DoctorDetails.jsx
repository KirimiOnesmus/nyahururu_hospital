import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Header, Footer } from "../../components/layouts";
import {
  FaUserMd,
  FaGraduationCap,
  FaClock,
  FaCalendarAlt,
  FaArrowLeft,
  FaStethoscope,
} from "react-icons/fa";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; 


const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-100">
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <Header />
    </div>
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
      {children}
    </main>
    <Footer />
  </div>
);

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        setError("Doctor not found or error fetching data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);


  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-4 border-slate-200  rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading doctor details…</p>
        </div>
      </Shell>
    );
  }


  if (error || !doctor) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <FaUserMd className="text-2xl text-red-400" />
          </div>
          <p className="font-semibold text-slate-700">{error || "Doctor not found."}</p>
          <button
            onClick={() => navigate("/doctors")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-semibold rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Back to Specialists
          </button>
        </div>
      </Shell>
    );
  }


  const fullName =
    doctor?.userId?.firstName && doctor?.userId?.lastName
      ? `Dr. ${doctor.userId.firstName} ${doctor.userId.lastName}`
      : doctor?.userId?.firstName
      ? `Dr. ${doctor.userId.firstName}`
      : "Doctor";

  const education = doctor.education || doctor.profile?.educationalQualification;
  const avatarSrc = doctor.profile?.imageUrl
    ? `${BACKEND_URL}${doctor.profile.imageUrl}`
    : null;

  return (
    <Shell>
      
      <button
        onClick={() => navigate("/doctors")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
                   hover:text-blue-600 transition-colors duration-150 mb-8 cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to Specialists
      </button>

      
      <div className="bg-blue-50 border border-slate-200 rounded-2xl overflow-hidden mb-6">
       
     

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-8">
     
          <div className="shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={fullName}
                className="w-32 h-32 object-cover rounded-xl border border-slate-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-blue-600 flex items-center justify-center">
                <FaUserMd className="text-5xl text-white" />
              </div>
            )}
          </div>

        
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
              {fullName}
            </h1>
            <p className="flex items-center justify-center sm:justify-start gap-1.5
                          text-blue-600 font-semibold text-sm mb-3">
              <FaStethoscope className="text-xs" />
              {doctor.speciality || "General Practitioner"}
            </p>
            {doctor.department && (
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200
                               text-slate-600 text-xs font-semibold">
                {doctor.department}
              </span>
            )}
          </div>
        </div>
      </div>


      <div className="grid md:grid-cols-3 gap-6">

     
        <div className="md:col-span-2 flex flex-col gap-6">

       
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <FaUserMd className="text-blue-500 text-sm" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Professional Bio
              </h2>
            </div>
            <p className="text-slate-700 text-[0.97rem] leading-relaxed">
              {doctor.bio || (
                <span className="text-slate-400 italic">No professional bio available at this time.</span>
              )}
            </p>
          </div>

      
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <FaGraduationCap className="text-blue-500 text-sm" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Educational Qualifications
              </h2>
            </div>
            {education ? (
              <p className="text-slate-700 text-[0.97rem] leading-relaxed">{education}</p>
            ) : (
              <p className="text-slate-400 italic text-sm">No educational qualifications listed.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <FaCalendarAlt className="text-blue-500 text-sm" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Availability
              </h2>
            </div>

            {doctor.availability?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {doctor.availability.map((slot, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <FaClock className="text-blue-400 text-xs mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{slot.day}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <FaClock className="text-3xl text-slate-300" />
                <p className="text-slate-400 text-sm">Schedule not available.</p>
              </div>
            )}

            <button
              onClick={() => navigate("/appointment")}
              className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                         font-semibold rounded-xl transition-colors duration-150 cursor-pointer"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default DoctorDetails;
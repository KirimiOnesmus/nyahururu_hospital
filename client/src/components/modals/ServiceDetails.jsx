import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Header, Footer } from "../../components/layouts";
import {
  FaStethoscope, FaCheckCircle, FaClock, FaPhone,
  FaMapMarkerAlt, FaUser, FaMoneyBillWave, FaHospital,
  FaTags, FaArrowLeft,
} from "react-icons/fa";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; 

const InfoTile = ({ icon: Icon, iconColor, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`text-base ${iconColor}`} />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</h3>
    </div>
    <p className="text-slate-700 text-sm leading-relaxed">{value}</p>
  </div>
);

const Badge = ({ icon: Icon, label, color }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
    <Icon className="text-[10px]" /> {label}
  </span>
);


const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (err) {
        console.error("Failed to fetch service details:", err);
        setError("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceDetails();
  }, [id]);


  const Shell = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {children}
      </main>
      <Footer />
    </div>
  );


  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading service details…</p>
        </div>
      </Shell>
    );
  }

  if (error || !service) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <FaStethoscope className="text-2xl text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Service Not Found</h2>
          <p className="text-slate-500 text-sm max-w-sm">
            {error || "The service you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate("/services")}
            className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-semibold rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Back to Services
          </button>
        </div>
      </Shell>
    );
  }

  const infoTiles = [
    service.serviceHours    && { icon: FaClock,         iconColor: "text-blue-600",    label: "Service Hours",    value: service.serviceHours    },
    service.location        && { icon: FaMapMarkerAlt,  iconColor: "text-emerald-600", label: "Location",         value: service.location        },
    service.headOfDepartment && { icon: FaUser,         iconColor: "text-violet-600",  label: "Department Head",  value: service.headOfDepartment },
    service.tariffInfo      && { icon: FaMoneyBillWave, iconColor: "text-amber-600",   label: "Pricing",          value: service.tariffInfo      },
    service.contactInfo     && { icon: FaPhone,         iconColor: "text-indigo-600",  label: "Contact",          value: service.contactInfo     },
  ].filter(Boolean);

  return (
    <Shell>

      <button
        onClick={() => navigate("/services")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
                   hover:text-blue-600 transition-colors duration-150 mb-8 cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to Services
      </button>


      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-8 border-b border-slate-100">

          <div className="shrink-0">
            {service.imageUrl ? (
              <img
                src={`${BACKEND_URL}${service.imageUrl}`}
                alt={service.name}
                className="h-36 w-36 object-cover rounded-xl border border-slate-200"
              />
            ) : (
              <div className="h-36 w-36 rounded-xl bg-blue-600 flex items-center justify-center">
                <FaStethoscope className="text-5xl text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
              {service.category && (
                <Badge icon={FaTags}       label={service.category}  color="bg-violet-50 border-violet-200 text-violet-700" />
              )}
              {service.division && (
                <Badge icon={FaHospital}   label={service.division}  color="bg-blue-50 border-blue-200 text-blue-700" />
              )}
              {service.nhifCovered && (
                <Badge icon={FaCheckCircle} label="SHA Covered"      color="bg-emerald-50 border-emerald-200 text-emerald-700" />
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{service.name}</h1>
          </div>
        </div>


        <div className="px-8 py-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            About This Service
          </h2>
          <p className="text-slate-700 leading-relaxed text-[0.97rem] whitespace-pre-line">
            {service.description || "No detailed description available for this service."}
          </p>
        </div>
      </div>


      {infoTiles.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {infoTiles.map((tile) => (
            <InfoTile key={tile.label} {...tile} />
          ))}
        </div>
      )}


      {service.features?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Key Features
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {service.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <FaCheckCircle className="text-blue-500 mt-0.5 shrink-0 text-sm" />
                <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-1">Ready to Get Started?</h3>
        <p className="text-slate-500 text-sm mb-6">Book an appointment or explore other services.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/appointment")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                       rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Book Appointment
          </button>
          <button
            onClick={() => navigate("/services")}
            className="px-6 py-2.5 border border-slate-200 hover:border-blue-400 text-slate-600
                       hover:text-blue-600 text-sm font-semibold rounded-xl transition-colors duration-150 cursor-pointer"
          >
            View All Services
          </button>
        </div>
      </div>
    </Shell>
  );
};

export default ServiceDetails;
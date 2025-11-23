import React, { useState, useEffect, useMemo } from "react";
import { Header, TimeRibbon, Footer } from "../components/layouts";
import DoctorCard from "../components/layouts/DoctorCard";
import api from "../api/axios";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Doctors = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors/doctors");
        setDoctors(response.data.data);
        setLoading(false);
        console.log(response.data.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Group doctors by specialty (clinic)
  const clinics = useMemo(() => {
    const clinicMap = {};
    
    doctors.forEach((doctor) => {
      const specialty = doctor.speciality || "General Practice";
      if (!clinicMap[specialty]) {
        clinicMap[specialty] = {
          name: specialty,
          doctors: [],
          description: getClinicDescription(specialty),
        };
      }
      clinicMap[specialty].doctors.push(doctor);
    });
    
    return Object.values(clinicMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [doctors]);

  // Filter clinics and doctors based on search
  const filteredClinics = useMemo(() => {
    if (!searchQuery.trim()) return clinics;
    
    const query = searchQuery.toLowerCase();
    return clinics
      .map(clinic => {
        const matchesClinic = clinic.name.toLowerCase().includes(query);
        const matchingDoctors = clinic.doctors.filter(doctor => {
          const doctorName = doctor.userId?.name || "";
          const specialty = doctor.speciality || "";
          return doctorName.toLowerCase().includes(query) || 
                 specialty.toLowerCase().includes(query);
        });
        
        if (matchesClinic || matchingDoctors.length > 0) {
          return {
            ...clinic,
            doctors: matchesClinic ? clinic.doctors : matchingDoctors
          };
        }
        return null;
      })
      .filter(clinic => clinic !== null);
  }, [clinics, searchQuery]);

  // Get doctors for selected clinic
  const selectedClinicDoctors = useMemo(() => {
    if (!selectedClinic) return [];
    const clinic = clinics.find(c => c.name === selectedClinic);
    if (!clinic) return [];
    
    if (!searchQuery.trim()) return clinic.doctors;
    
    const query = searchQuery.toLowerCase();
    return clinic.doctors.filter(doctor => {
      const doctorName = doctor.userId?.name || "";
      const specialty = doctor.speciality || "";
      return doctorName.toLowerCase().includes(query) || 
             specialty.toLowerCase().includes(query);
    });
  }, [selectedClinic, clinics, searchQuery]);

  function getClinicDescription(specialty) {
    const descriptions = {
      "Cardiology": "Comprehensive heart and cardiovascular care",
      "Dermatology": "Skin, hair, and nail health services",
      "Pediatrics": "Specialized care for infants, children, and adolescents",
      "Orthopedics": "Bone, joint, and musculoskeletal treatment",
      "Neurology": "Brain, spinal cord, and nervous system care",
      "Oncology": "Cancer diagnosis, treatment, and support",
      "Gynecology": "Women's reproductive health services",
      "Psychiatry": "Mental health and behavioral wellness",
      "General Practice": "Primary healthcare for all ages",
    };
    return descriptions[specialty] || `Expert medical care in ${specialty}`;
  }

  const handleClinicSelect = (clinicName) => {
    setSelectedClinic(clinicName);
  };

  const handleBackToClinics = () => {
    setSelectedClinic(null);
  };

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body h-full">
        <div className="px-16 py-8">
          <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
            {selectedClinic ? selectedClinic : "Our Clinics"}
          </h2>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={selectedClinic 
                ? "Search doctors in this clinic..." 
                : "Search clinics or doctors..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {selectedClinic ? (
            // Show doctors in selected clinic
            <div>
              <button
                onClick={handleBackToClinics}
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <FaChevronLeft className="inline" />
                Back to Clinics
              </button>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-xl font-bold text-blue-700 mb-2">{selectedClinic}</h3>
                <p className="text-gray-600">
                  {clinics.find(c => c.name === selectedClinic)?.description || ""}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedClinicDoctors.length} specialist{selectedClinicDoctors.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {selectedClinicDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No doctors found matching your search.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {selectedClinicDoctors.map((doctor) => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Show clinics list
            <div>
              {filteredClinics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No clinics found matching your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClinics.map((clinic) => (
                    <div
                      key={clinic.name}
                      onClick={() => handleClinicSelect(clinic.name)}
                      className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-blue-700">{clinic.name}</h3>
                          <FaChevronRight className="text-blue-500" />
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{clinic.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {clinic.doctors.length} specialist{clinic.doctors.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-blue-600 text-sm font-semibold">View Doctors →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

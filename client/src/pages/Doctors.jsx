import React,{useState,useEffect} from "react";
import { Header, TimeRibbon, Footer } from "../components/layouts";
import DoctorCard from "../components/layouts/DoctorCard";
import api from "../api/axios";
const Doctors = () => {
  
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]); 

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

  },[]);
    if (loading) return <div>Loading doctors...</div>;
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
                  key={doctor._id}
                id={doctor._id} 
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

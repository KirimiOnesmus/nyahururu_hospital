import React, { useEffect, useState } from "react";
import {
  Header,
  Footer,
  Slider,
  Card,
  TimeRibbon,
  Partners,
  News,
} from "../components/layouts";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

const Home = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        setServices(res.data);
        // console.log("Services Data:", res.data);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to fetch services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Limit to first 5 services for home page
  const serviceLimit = services.slice(0, 5);
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="sections space-y-2">
        <div className="slider">
          <Slider />
        </div>
        <div className="services my-4 mx-6 py-4 px-6">
          <h2 className="text-3xl font-bold my-4 text-center">Our Services</h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
              <p className="text-gray-600 font-medium text-lg">
                Loading Services...
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {serviceLimit.map((service) => (
                <Card
                  key={service._id}
                  id={service._id}
                  image={`${BACKEND_URL}${service.imageUrl}`}
                  title={service.name}
                  buttonText="Learn More"
                />
              ))}
              {services.length > 5 && (
                <div className="h-full">
                  <div className="rounded-2xl shadow-md flex items-center justify-center p-6 bg-gray-600 text-white hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                    <button
                      className="w-full text-xl font-bold hover:text-2xl transition-all duration-300"
                      onClick={() => navigate("/services")}
                    >
                      Load More Services
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="hours ribbon">
          <TimeRibbon />
        </div>
        <div className="news">
          <News />
        </div>
        <div className="partners py-4">
          <h3 className="text-3xl font-bold my-4 text-center">Our Partners</h3>
          <Partners />
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Home;

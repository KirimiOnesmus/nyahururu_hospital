import React, { useEffect, useState } from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../components/layouts";
import axios from "axios";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:5000";
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/services");
        setServices(res.data);
        setLoading(false);
        console.log(res.data);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);
  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body px-12 py-8">
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
          Our Services
        </h2>
        {loading ? (
          <p>Loading services...</p>
        ) : (
          <div className="services grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service._id}
                id={service._id}
                image={`${BACKEND_URL}${service.imageUrl}`}
                title={service.name}
                buttonText="Learn More"
              />
            ))}
          </div>
        )}
        <div className="py-4">
          <h3 className="text-3xl font-bold my-4 text-center">Our Partners</h3>
          <Partners />
        </div>
      </div>

      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default Services;

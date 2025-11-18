import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../../components/layouts";

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/services/${id}`);
        setService(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Failed to fetch service details:", err);
        setError("Failed to load service details");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="px-8 py-12 max-w-3xl mx-auto">
          <p className="text-center text-gray-600">Loading service details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="px-8 py-12 max-w-3xl mx-auto">
          <p className="text-center text-red-500">
            {error || "Service not found"}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="px-8 py-12 max-w-3xl mx-auto space-y-6 md:h-full">
        {service.imageUrl && (
          <img
            src={`${BACKEND_URL}${service.imageUrl}`}
            alt={service.name}
            className="h-32 mx-auto object-contain"
          />
        )}
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
          {service.name}
        </h2>
        <p className="text-lg text-gray-700">
          {service.description || "No detailed description available."}
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceDetails;
import React, { useEffect, useState } from "react";
import {
  Header,
  Footer,
  Slider,
  Card,
  TimeRibbon,
  Partners,
  News,
  EventOverlay,
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
        setLoading(true);
        const res = await api.get("/services");
        setServices(res.data);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to fetch services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const serviceLimit = services.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1">
        <EventOverlay />
        <Slider />

        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
                What We Offer
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Our Services
              </h2>
            </div>
            {services.length >= 5 && (
              <button
                onClick={() => navigate("/services")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
              >
                View All Services
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading services…</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              No services available at this time.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {serviceLimit.map((service) => (
                <Card
                  key={service._id}
                  id={service._id}
                  image={`${BACKEND_URL}${service.imageUrl}`}
                  title={service.name}
                  description={service.description}
                  buttonText="Learn More"
                />
              ))}

              {services.length > 5 && (
                <button
                  onClick={() => navigate("/services")}
                  className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400
                             text-slate-500 hover:text-blue-600 font-semibold text-base
                             flex flex-col items-center justify-center gap-2 p-8 min-h-[200px]
                             transition-colors duration-200"
                >
                  <span className="text-3xl font-light">
                    +{services.length - 5}
                  </span>
                  <span>More Services</span>
                </button>
              )}
            </div>
          )}
        </section>

        <div className="border-t border-slate-100">
          <TimeRibbon />
        </div>

        <div className="border-t border-slate-100">
          <News />
        </div>

        <section className="border-t border-slate-100 py-12 max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1 text-center">
            Trusted By
          </p>
          <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
            Our Partners
          </h3>
          <Partners />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;

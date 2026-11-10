import React, { useEffect, useState } from "react";
import { Slider, Card, QuickActions, WelcomeIntro, TimeRibbon, News, EventOverlay,Contact } from "../components/layouts";
import { Header, Partners, Footer } from "../common/layouts";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { ASSET_BASE_URL } from "../config/env";
import notify from "../common/utils/notify";

const Home = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = ASSET_BASE_URL;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");
        setServices(res.data);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        notify.error("Failed to fetch services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const serviceLimit = services.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line">
        <Header />
      </div>

      <main className="flex-1">
        <EventOverlay />

     
        <Slider />

        <QuickActions />

        <WelcomeIntro />


        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                What We Offer
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-ink">Our Services</h2>
            </div>
            {services.length >= 5 && (
              <button
                type="button"
                onClick={() => navigate("/services")}
                className="min-h-11 text-sm font-semibold text-primary hover:text-primary-hover underline underline-offset-2"
              >
                View all services
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-line border-t-primary rounded-full animate-spin" />
              <p className="text-ink-muted text-sm">Loading services…</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 text-ink-muted text-sm">
              No services available at this time.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {serviceLimit.map((service) => (
                <Card
                  key={service.id}
                  id={service.id}
                  image={`${BACKEND_URL}${service.imageUrl}`}
                  title={service.name}
                  description={service.description}
                  buttonText="Learn More"
                />
              ))}

              {services.length > 5 && (
                <button
                  onClick={() => navigate("/services")}
                  className="rounded-2xl border border-dashed border-line hover:border-primary
                             text-ink-muted hover:text-primary font-semibold text-base
                             flex flex-col items-center justify-center gap-2 p-8 min-h-[200px]"
                >
                  <span className="text-3xl font-light">+{services.length - 5}</span>
                  <span>More Services</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section className="border-t border-line">
          <TimeRibbon />
        </section>

        <section className="border-t border-line">
          <News />
        </section>

        <section className="border-t border-line py-12 max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1 text-center">
            Working Together
          </p>
          <h3 className="text-2xl font-bold text-ink text-center mb-8">Our Affiliations</h3>
          <Partners />
        </section>
        <section className="border-t border-line">
          <Contact />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
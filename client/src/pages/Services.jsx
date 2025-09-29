import React from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../components/layouts";
import servicesData from "../data/serviceData";

const Services = () => {
  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body px-12 py-8">
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
          Our Services
        </h2>
        <div className="services grid md:grid-cols-3 gap-6">
          {servicesData.map(services => (
            <Card
              key={services.id}
              id={services.id}
              image={services.image}
              title={services.title}
              link={`/services/${services.id}`}
              buttonText="Learn More"
            />
          ))}
        </div>
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

import React from "react";
import {
  Header,
  Footer,
  Slider,
  Card,
  TimeRibbon,
} from "../components/layouts";

import dialysis from "../assets/Icons/dialysis-icon.png";
import emergency from "../assets/Icons/emergency-icon.png";
import critical_care from "../assets/Icons/ICU-icon.png";
import lab from "../assets/Icons/lab-services.png";
import radiology from "../assets/Icons/radiology-icon.png";
// import Card from "../components/layouts/Card";
// import TimeRibbon from "../components/layouts/TimeRibbon";

const Home = () => {
  const services = [
    {
      image: critical_care,
      title: "Critical Care (ICU,NICU & HDU)",
    },
    {
      image: dialysis,
      title: "Dialysis",
    },
    {
      image: emergency,
      title: "Emergency Care",
    },
    {
      image: lab,
      title: "Laboratory",
    },
    {
      image: radiology,
      title: "Radiology & Imaging",
    },
  ];
  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="sections space-y-2 ">
        <div className="slider ">
          <Slider />
        </div>
        <div className="services my-4 mx-6 py-4 px-6">
          <h2 className="text-3xl font-bold my-4 text-center">
            Our Departments
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {services.map((service, index) => (
              <Card
                key={index}
                image={service.image}
                title={service.title}
                buttonText="Learn More"
              />
            ))}
          </div>
        </div>
        <div className="hours ribbon">
          <TimeRibbon />
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Home;

import React from "react";
import { Header, Footer, Slider, Management } from "../components/layouts";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body flex-grow">
        <div className="slider ">
          <Slider />
        </div>
        <div className="px-6 md:px-12 py-8 space-y-10 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold my-4 text-center">About Us</h2>
          <p></p>
          <div className="mission">
            <h3 className="text-2xl font-semibold border-l-4 border-blue-500 p-2">
              Mission
            </h3>
            <p className="text-lg font-serif">
              Our Mission us to provide exceptional healthcare services with
              compassion, integrity and respect. We dedicate to imporving the
              health and well-being of the community through innovative medical
              practices and personalized care.
            </p>
          </div>
          <div className="vision">
            <h3 className="text-2xl font-semibold border-l-4 border-blue-500 p-2">
              Vision
            </h3>
            <p className="text-lg font-serif">
              Our vision is to be leading health care provider recognized for
              excellence in the patient care, medical innovation and community
              engagement. We strive to create a healthier future for all.
            </p>
          </div>
          <div className="strategy">
            <h3 className="text-2xl font-semibold border-l-4 border-blue-500 p-2">
              Strategic Plans
            </h3>
            <p className="text-lg font-serif">
              Our strategic plans focus on enhancing patient experience,
              expanding our services and fostering a culture of continous
              improvement. We aim to achieve these goals through strategic
              investment in technology, infrastructure, and our dedicated team
              pf healthcare professionals.
            </p>
          </div>
          <div className="management space-y-2">
            <h3 className="text-2xl font-semibold border-l-4 border-blue-500 p-2">
              Our Management Team
            </h3>
            <p className="text-lg leading-relaxed font-serif">
              Meet the passionate leaders driving our mission and vision forward
              with dedication and expertise.
            </p>
            <div className="py-4">
              <Management />
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default About;

import React from "react";
import { Header, Footer } from "../components/layouts";

const Careers = () => {
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="main flex-1 px-6 md:px-12 py-6 max-w-5xl mx-auto w-full md:h-[80vh]">
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
           Join Us:
          </h2>

      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Careers;

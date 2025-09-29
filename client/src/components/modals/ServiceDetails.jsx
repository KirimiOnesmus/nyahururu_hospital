import React from 'react'
import { useParams } from "react-router-dom";
import servicesData from "../../data/serviceData";
import { Header, Footer } from "../../components/layouts";


const serviceDetails = () => {
      const { id } = useParams();
  const service = servicesData.find(s => s.id === parseInt(id));
  if (!service) {
    return <p className="text-center text-red-500">Service not found</p>;
  }

  return (
 <div >
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm ">
        <Header />
      </div>

      <div className="px-8 py-12 max-w-3xl mx-auto space-y-6 md:h-[80vh]">
        <img src={service.image} alt={service.title} className="h-32 mx-auto" />
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">{service.title}</h2>
        <p className="text-lg text-gray-700">{service.details}</p>
      </div>

      <Footer />
    </div>
  )
}

export default serviceDetails
import React from "react";
import {
  Header,
  Footer,
  Slider,
  Card,
  TimeRibbon,
  Partners
} from "../components/layouts";
import services from "../data/serviceData";
import { useNavigate } from "react-router-dom";

const Home = () => {
  
  const navigate = useNavigate();
  const serviceLimit= services.slice(0,5)
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
            {serviceLimit.map(service => (
              <Card
                key={service.id}
                id ={service.id}
                image={service.image}
                title={service.title}
                buttonText="Learn More"
              />
            ))}
            <button className=" bg-gray-600 text-white text-xl shadow-md rounded-2xl overflow-hidden hover:shadow-xl 
    hover:cursor-pointer transition-all duration-300 font-bold hover:text-2xl"
    onClick={navigate("/services")}
    >Load More Services</button>
          </div>
        </div>
        <div className="hours ribbon">
          <TimeRibbon />
        </div>
        <div className="partners py-4">
          <h3 className="text-3xl font-bold my-4 text-center">Our Partners</h3>
          <Partners/>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Home;

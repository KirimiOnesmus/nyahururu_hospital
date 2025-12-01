import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import { useNavigate } from "react-router-dom";

const Slider = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[300px] md:h-[350px] lg:h-[400px]">
      <Swiper
        modules={[Pagination, Autoplay]}
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        loop
        className="h-full"
      >
        <SwiperSlide>
          <div className="relative w-full h-full bg-gradient-to-r from-blue-100 to-purple-800">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center items-start text-white px-6 md:px-16 lg:px-24">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Welcome to Nyahururu County Referral Hospital
              </h1>
              <p className="text-base md:text-lg mb-6 max-w-xl drop-shadow-md">
                Laikipia County's best hospital. We specialize in providing
                world-class health care for all.
              </p>
              <button
                onClick={() => navigate("/about")}
                className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-semibold transition"
              >
                Learn More
              </button>
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="relative w-full h-full bg-gradient-to-r from-blue-900 to-purple-800">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white px-6">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Our Doctors
              </h1>
              <p className="text-lg md:text-2xl mb-6 max-w-2xl">
                Meet our team of experienced doctors and healthcare
                professionals.
              </p>
              <button
                onClick={() => navigate("/doctors")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                View Our Doctors
              </button>
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="relative w-full h-full bg-gradient-to-r from-blue-900 to-purple-800">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white px-6">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Book an Appointment
              </h1>
              <p className="text-lg md:text-2xl mb-6 max-w-2xl">
                Easy online booking for consultations and medical checkups.
              </p>
              <button
                onClick={() => navigate("/appointment")}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Book Now
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default Slider;
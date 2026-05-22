import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    eyebrow: "Nyahururu County Referral Hospital",
    heading: "Quality Healthcare\nFor Every Patient",
    body: "Laikipia County's leading referral hospital — delivering compassionate, expert medical care to our community.",
    cta: { label: "About Us", path: "/about", color: "bg-blue-700 hover:bg-blue-800" },
    accent: "bg-blue-800",
  },
  {
    eyebrow: "Meet Our Team",
    heading: "Experienced Doctors\n& Specialists",
    body: "A dedicated team of certified physicians and healthcare professionals committed to your wellbeing.",
    cta: { label: "Our Doctors", path: "/doctors", color: "bg-emerald-700 hover:bg-emerald-800" },
    accent: "bg-slate-800",
  },
  {
    eyebrow: "Appointments",
    heading: "Book a Consultation\nOnline",
    body: "Schedule your appointment easily — no long queues. Available for all departments and specialities.",
    cta: { label: "Book Now", path: "/appointment", color: "bg-red-700 hover:bg-red-800" },
    accent: "bg-slate-900",
  },
];

const Slider = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[300px] md:h-[380px] lg:h-[440px]">
      <Swiper
        modules={[Pagination, Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="h-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className={`relative w-full h-full ${slide.accent} flex items-center`}>
          
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                  backgroundSize: "12px 12px",
                }}
              />

          
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />

              <div className="relative z-10 px-10 md:px-20 lg:px-28 max-w-3xl">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                  {slide.eyebrow}
                </p>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
                  {slide.heading}
                </h1>
                <p className="text-slate-300 text-sm md:text-base mb-7 max-w-lg leading-relaxed">
                  {slide.body}
                </p>
                <button
                  onClick={() => navigate(slide.cta.path)}
                  className={`${slide.cta.color} text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200`}
                >
                  {slide.cta.label}
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;
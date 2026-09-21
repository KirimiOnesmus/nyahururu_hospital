import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ASSET_BASE_URL } from "../../config/env";

const BANNER_CATEGORY = "Homepage Banner";

const defaultSlides = [
  {
    eyebrow: "Nyahururu County Referral Hospital",
    heading: "Quality Healthcare\nFor Every Patient",
    body: "Laikipia County's leading referral hospital — delivering compassionate, expert medical care to our community.",
    ctaLabel: "About Us",
    ctaPath: "/about",
    accent: "bg-blue-800",
  },
  {
    eyebrow: "Meet Our Team",
    heading: "Experienced Doctors\n& Specialists",
    body: "A dedicated team of certified physicians and healthcare professionals committed to your wellbeing.",
    ctaLabel: "Our Doctors",
    ctaPath: "/doctors",
    accent: "bg-slate-800",
  },
  {
    eyebrow: "Appointments",
    heading: "Book a Consultation\nOnline",
    body: "Schedule your appointment easily — no long queues. Available for all departments and specialities.",
    ctaLabel: "Book Now",
    ctaPath: "/appointment",
    accent: "bg-slate-900",
  },
];

const Slider = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(defaultSlides);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await api.get("/gallery", {
          params: {
            category: BANNER_CATEGORY,
            type: "image",
            visible: "true",
            sort: "uploadDate",
          },
        });
        const items = Array.isArray(res.data) ? res.data : [];

        if (items.length > 0) {
          const mapped = items.map((item) => ({
            eyebrow: "",
            heading: item.title || "",
            body: item.description || "",
            ctaLabel: null,
            ctaPath: null,
            image: `${ASSET_BASE_URL}${item.fileUrl}`,
            accent: "bg-slate-900",
          }));
          setSlides(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch banner images:", error);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="w-full h-[300px] md:h-[400px] lg:h-[540px] relative">
      <Swiper
        modules={[Pagination, Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="h-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div
              className={`relative w-full h-full flex items-center bg-cover bg-center ${
                slide.image ? "" : slide.accent
              }`}
              style={slide.image ? { backgroundImage: `url(${slide.image})` } : undefined}
            >
              <div className="absolute inset-0 " />

              {!slide.image && (
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                    backgroundSize: "12px 12px",
                  }}
                />
              )}

              {/* <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" /> */}

              <div className="relative z-10 px-10 md:px-20 lg:px-28 max-w-3xl">
                {slide.eyebrow && (
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                    {slide.eyebrow}
                  </p>
                )}
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
                  {slide.heading}
                </h1>
                {slide.body && (
                  <p className="text-slate-200 text-sm md:text-base mb-7 max-w-lg leading-relaxed">
                    {slide.body}
                  </p>
                )}
                {slide.ctaLabel && (
                  <button
                    onClick={() => navigate(slide.ctaPath)}
                    className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                               px-6 py-2.5 rounded-lg transition-colors duration-200"
                  >
                    {slide.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;

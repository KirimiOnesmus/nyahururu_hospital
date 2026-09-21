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
    heading: "Quality healthcare\nfor every patient",
    accentWord: "every patient",
    body: "Laikipia County's leading referral hospital — delivering compassionate, expert medical care to our community.",
    ctaLabel: "About the hospital",
    ctaPath: "/about",
    accent: "bg-blue-800",
  },
  {
    eyebrow: "Meet Our Team",
    heading: "Experienced doctors\nand specialists",
    body: "A dedicated team of certified physicians and healthcare professionals committed to your wellbeing.",
    ctaLabel: "Meet our doctors",
    ctaPath: "/doctors",
    accent: "bg-slate-800",
  },
  {
    eyebrow: "Appointments",
    heading: "Book a consultation\nonline",
    body: "Schedule your appointment easily — no long queues. Available for all departments and specialities.",
    ctaLabel: "Book now",
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
              {slide.image && <div className="absolute inset-0 bg-ink/55" />}

              <div className="relative z-10 px-10 md:px-20 lg:px-28 max-w-3xl">
                {slide.eyebrow && (
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">
                    {slide.eyebrow}
                  </p>
                )}
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
                  {slide.heading}
                </h1>
                {slide.body && (
                  <p className="text-slate-100 text-sm md:text-base mb-7 max-w-lg leading-relaxed">
                    {slide.body}
                  </p>
                )}
                {slide.ctaLabel && (
                  <button
                    type="button"
                    onClick={() => navigate(slide.ctaPath)}
                    className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold
                               min-h-11 px-6 py-2.5 rounded-xl transition-colors"
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

import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const WelcomeIntro = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-blue-50/60 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-red-600 mb-3">
          Welcome to Nyahururu County Referral Hospital
        </p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-blue-900 mb-6">
          Quality Healthcare For Every Patient
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl mx-auto mb-8">
          Laikipia County's leading referral hospital, delivering compassionate, expert medical care
          to our community through skilled staff, modern facilities, and a patient-first approach to
          every visit. With over 250 beds, we are equipped to provide comprehensive, high-quality
          healthcare services to meet the growing needs of our community.
        </p>
        <button
          onClick={() => navigate("/about")}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold
                     text-sm md:text-base transition-colors duration-200 cursor-pointer"
        >
          Learn More <FaArrowRight className="text-xs" />
        </button>
      </div>
    </section>
  );
};

export default WelcomeIntro;

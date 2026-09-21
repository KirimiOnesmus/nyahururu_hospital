import React from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "../../common/icons";

const WelcomeIntro = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-primary-soft py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-primary mb-3">
          Welcome to Nyahururu County Referral Hospital
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-ink mb-6">
          Quality healthcare for{" "}
          <span className="font-serif-italic">every patient</span>
        </h2>
        <p className="text-ink-muted text-sm md:text-base leading-relaxed max-w-3xl mx-auto mb-8">
          Laikipia County's leading referral hospital, delivering compassionate, expert medical care
          to our community through skilled staff, modern facilities, and a patient-first approach to
          every visit. With over 250 beds, we are equipped to provide comprehensive, high-quality
          healthcare services to meet the growing needs of our community.
        </p>
        <button
          type="button"
          onClick={() => navigate("/about")}
          className="inline-flex items-center gap-2 min-h-11 text-primary hover:text-primary-hover font-semibold
                     text-sm md:text-base transition-colors"
        >
          Learn more about us <IconArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default WelcomeIntro;

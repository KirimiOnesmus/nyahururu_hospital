import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../../components/layouts";
import {
  FaFlask,
  FaFileAlt,
  FaDownload,
  FaUserCheck,
  FaSearch,
  FaCheckCircle,
  FaLock,
  FaMobileAlt,
  FaArrowRight,
  FaBookOpen,
  FaUsers,
  FaChartBar,
  FaShieldAlt,
} from "react-icons/fa";

const STATS = [
  { icon: FaFileAlt, value: "120+", label: "Research Papers" },
  { icon: FaUsers, value: "80+", label: "Researchers" },
  { icon: FaDownload, value: "2.4K", label: "Downloads" },
  { icon: FaChartBar, value: "6", label: "Disciplines" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: FaUserCheck,
    title: "Register or Log In",
    desc: "Create a free account or sign in to access the researcher dashboard and manage your submissions.",
    color: "blue",
  },
  {
    step: "02",
    icon: FaMobileAlt,
    title: "Pay via M-Pesa",
    desc: "A one-time KES 150–200 submission fee is collected securely via M-Pesa STK Push before you submit your proposal.",
    color: "green",
  },
  {
    step: "03",
    icon: FaFileAlt,
    title: "Submit Your Research",
    desc: "Upload your proposal. Once approved by our admin team, proceed to submit your abstract and final paper.",
    color: "purple",
  },
  {
    step: "04",
    icon: FaSearch,
    title: "Go Public",
    desc: "Approved research is listed publicly. Abstracts are free to read; full papers are available for paid download.",
    color: "orange",
  },
];

const STAGES = [
  {
    icon: FaFileAlt,
    title: "Stage 1 — Proposal",
    desc: "Submit a structured research proposal outlining objectives, methodology, and expected outcomes. Requires a one-time M-Pesa payment. Admin reviews and approves before you proceed.",
    badge: "Paid submission",
    badgeColor: "bg-blue-100 text-blue-700",
    border: "border-blue-500",
    bg: "from-blue-50 to-blue-100",
  },
  {
    icon: FaBookOpen,
    title: "Stage 2 — Abstract",
    desc: "After proposal approval, submit a concise abstract summarising your research findings. This becomes the publicly visible preview of your work — no additional payment required.",
    badge: "Free after approval",
    badgeColor: "bg-green-100 text-green-700",
    border: "border-green-500",
    bg: "from-green-50 to-green-100",
  },
  {
    icon: FaChartBar,
    title: "Stage 3 — Final Paper",
    desc: "Submit your complete research paper. The public can browse your abstract freely and pay to download the full paper via M-Pesa. Resubmissions require no extra payment.",
    badge: "Public download",
    badgeColor: "bg-purple-100 text-purple-700",
    border: "border-purple-500",
    bg: "from-purple-50 to-purple-100",
  },
];

const FEATURES = [
  {
    icon: FaShieldAlt,
    title: "Secure File Access",
    desc: "Papers are served via authenticated endpoints — no direct file URLs are ever exposed to the public.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: FaMobileAlt,
    title: "M-Pesa Integrated",
    desc: "All payments — submission fees and downloads — are handled through Safaricom's M-Pesa with instant confirmation.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: FaCheckCircle,
    title: "Admin Review Workflow",
    desc: "Every proposal passes through a structured review process before proceeding to abstract and final paper stages.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const colorMap = {
  blue: {
    bg: "bg-blue-600",
    light: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-600",
    light: "bg-green-50",
    border: "border-green-500",
    text: "text-green-600",
  },
  purple: {
    bg: "bg-purple-600",
    light: "bg-purple-50",
    border: "border-purple-500",
    text: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-50",
    border: "border-orange-500",
    text: "text-orange-500",
  },
};

const Research = () => {
  const navigate = useNavigate();
  const [hoveredCta, setHoveredCta] = useState(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <main className="flex-grow">
        <section className="relative bg-blue-500 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 backdrop-blur-sm">
              <FaFlask className="text-green-400" />
              Nyahururu Research Repository
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Advancing Knowledge,
              <br />
              <span className="text-green-400">One Paper at a Time</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10">
              A structured platform for submitting, reviewing, and sharing
              research. Browse free abstracts or download full papers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/research/public")}
                onMouseEnter={() => setHoveredCta("browse")}
                onMouseLeave={() => setHoveredCta(null)}
                className="flex items-center justify-center gap-2 
                bg-white text-blue-700 font-bold px-8 py-4 rounded-xl 
                shadow-lg hover:bg-blue-50 transition-all duration-200
                 hover:-translate-y-0.5 cursor-pointer"
              >
                <FaSearch />
                Browse Research
              </button>

              <button
                onClick={() => navigate("/research/register")}
                onMouseEnter={() => setHoveredCta("register")}
                onMouseLeave={() => setHoveredCta(null)}
                className="flex items-center justify-center gap-2 bg-green-300 text-gray-900 
                font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-green-400 
                transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <FaUserCheck />
                Register as Researcher
              </button>
            </div>

            <p className="mt-5 text-blue-200 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/hmis")}
                className="text-white font-semibold underline underline-offset-2
                 hover:text-green-400 cursor-pointer transition-colors"
              >
                Log in here
              </button>
            </p>
          </div>
        </section>
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="text-xl text-blue-600" />
                </div>
                <span className="text-2xl font-extrabold text-gray-900">
                  {value}
                </span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                About the Portal
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                A Trusted Home for Laikipia Research
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Nyahururu Research Portal is an institutional repository
                that supports researchers through a structured three-stage
                submission process — from initial proposal through to final
                publication. It is designed for medical, environmental, social,
                and applied science research relevant to the Laikipia County
                region and beyond.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Abstracts are freely accessible to the public, encouraging
                knowledge sharing and academic engagement. Full papers can be
                downloaded after a small access fee collected via M-Pesa,
                ensuring sustainable maintenance of the platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <Icon className={`text-lg ${color}`} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Submission Process
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                Three Stages to Publication
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Every research submission follows a structured review path to
                maintain quality and ensure proper academic oversight.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {STAGES.map(
                ({
                  icon: Icon,
                  title,
                  desc,
                  badge,
                  badgeColor,
                  border,
                  bg,
                }) => (
                  <div
                    key={title}
                    className={`bg-gradient-to-br ${bg} rounded-xl  p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <Icon
                      className={`text-2xl mb-3 ${border.replace("border-", "text-")}`}
                    />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {desc}
                    </p>
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}
                    >
                      {badge}
                    </span>
                  </div>
                ),
              )}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Resubmissions at any stage do <strong>not</strong> require
              additional payment.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span
              className="inline-block bg-green-100 text-green-700 text-xs font-bold 
            uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            >
              Step by Step
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Getting started takes just a few minutes. Here's the full journey
              from registration to published research.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => {
              const c = colorMap[color];
              return (
                <div
                  key={step}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-6
                   hover:shadow-sm transition-shadow relative"
                >
                  <span
                    className={`absolute top-4 right-4 text-xs font-extrabold ${c.text} opacity-30 text-2xl`}
                  >
                    {step}
                  </span>
                  <div
                    className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <Icon className="text-xl text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        main section {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Research;

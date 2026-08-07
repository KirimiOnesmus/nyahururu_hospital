import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../../common/layouts";
import {
  FaFlask,
  FaFileAlt,
  FaUserCheck,
  FaArrowRight,
  FaBookOpen,
  FaUsers,
  FaChartBar,
  FaShieldAlt,
  FaMobileAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaGavel,
  FaEdit,
  FaCalendarAlt,
  FaArchive,
  FaCertificate,
  FaLock,
  FaHandshake,
} from "react-icons/fa";

const STATS = [
  { icon: FaFileAlt, value: "120+", label: "Protocols Reviewed" },
  { icon: FaUsers, value: "80+", label: "Researchers" },
  { icon: FaCheckCircle, value: "95+", label: "Approvals Issued" },
  { icon: FaChartBar, value: "6", label: "Research Programmes" },
];

const LIFECYCLE = [
  {
    icon: FaFileAlt,
    title: "Initial Proposal",
    type: "Type A — Full Committee Review",
    desc: "Submit a structured research proposal with SERU-required fields: objectives, methodology, ethics considerations, budget, and study counties. A one-time M-Pesa fee is collected before submission.",
    badge: "Paid submission",
    badgeColor: "bg-blue-100 text-blue-700",
    bg: "from-blue-50 to-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: FaClipboardCheck,
    title: "Review & Approval",
    type: "Minimum 2 Reviewers + Committee",
    desc: "At least two independent reviewers evaluate your protocol using SERU criteria. On approval by all reviewers, the research committee casts the final vote. A unique SERU number is issued on approval.",
    badge: "12-month validity",
    badgeColor: "bg-green-100 text-green-700",
    bg: "from-green-50 to-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: FaCalendarAlt,
    title: "Ongoing Oversight",
    type: "Amendments · Annual Reviews · Closure",
    desc: "Submit protocol amendments, annual continuing review reports, or study closure requests as your research progresses — all through the same portal with full audit trails.",
    badge: "Full lifecycle",
    badgeColor: "bg-purple-100 text-purple-700",
    bg: "from-purple-50 to-purple-100",
    iconColor: "text-purple-600",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: FaUserCheck,
    title: "Register",
    desc: "Create your researcher account with your institutional affiliation and credentials.",
    color: "blue",
  },
  {
    step: "02",
    icon: FaMobileAlt,
    title: "Pay via M-Pesa",
    desc: "A one-time submission fee is collected securely via M-Pesa STK Push before proposal submission.",
    color: "green",
  },
  {
    step: "03",
    icon: FaFileAlt,
    title: "Submit Protocol",
    desc: "Fill in the SERU-aligned proposal form with ethics, methodology, and study details. Upload your protocol PDF.",
    color: "purple",
  },
  {
    step: "04",
    icon: FaGavel,
    title: "Committee Approval",
    desc: "Reviewers evaluate your protocol. On approval, the committee issues a SERU number with 12-month validity.",
    color: "amber",
  },
];

const SUBMISSION_TYPES = [
  {
    icon: FaFileAlt,
    title: "Initial Proposal",
    desc: "New research protocols submitted for scientific and ethics review.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: FaEdit,
    title: "Amendments",
    desc: "Changes to approved protocols — purpose, procedures, or population (one at a time).",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: FaClipboardCheck,
    title: "Continuing Review",
    desc: "Annual progress reports to renew your 12-month approval validity.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: FaArchive,
    title: "Study Closure",
    desc: "Final reports when research is complete, including data and specimen disposition plans.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

const FEATURES = [
  {
    icon: FaShieldAlt,
    title: "SERU-Aligned Standards",
    desc: "Every submission follows KEMRI Scientific and Ethics Review Unit protocols, ensuring compliance with ICH-GCP and the Helsinki Declaration.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: FaMobileAlt,
    title: "M-Pesa Integrated",
    desc: "Submission fees are handled through Safaricom M-Pesa with instant confirmation — no bank transfers or manual receipts.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: FaGavel,
    title: "Multi-Reviewer System",
    desc: "Every protocol is evaluated by at least two independent reviewers before advancing to the research committee for final approval.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: FaCertificate,
    title: "Auto SERU Numbers",
    desc: "On committee approval, a unique sequential SERU number is generated automatically with 12-month validity tracking.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: FaLock,
    title: "Confidential & Secure",
    desc: "Research protocols are not published publicly. Only authorized reviewers and committee members can access submissions.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: FaHandshake,
    title: "Transparent Review",
    desc: "Assigned reviewers and committee members can see all comments — fostering collaborative, accountable evaluation.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

const colorMap = {
  blue:   { bg: "bg-blue-600",   light: "bg-blue-50",   text: "text-blue-600" },
  green:  { bg: "bg-green-600",  light: "bg-green-50",  text: "text-green-600" },
  purple: { bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-600" },
  amber:  { bg: "bg-amber-500",  light: "bg-amber-50",  text: "text-amber-500" },
};

const Research = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md">
        <Header />
      </div>

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="relative bg-blue-500 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 backdrop-blur-sm">
              <FaFlask className="text-green-400" />
              NCRH Research Ethics Portal
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Scientific & Ethics
              <br />
              <span className="text-green-400">Review Made Simple</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10">
              Submit research proposals, track reviews, and receive ethics
              approval — all through one portal aligned to KEMRI SERU standards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/research/register")}
                className="flex items-center justify-center gap-2
                  bg-white text-blue-700 font-bold px-8 py-4 rounded-xl
                  hover:bg-blue-50 transition-all duration-200
                  hover:-translate-y-0.5 cursor-pointer"
              >
                <FaUserCheck />
                Register as Researcher
              </button>

              <button
                onClick={() => navigate("/hmis")}
                className="flex items-center justify-center gap-2 bg-green-300 text-gray-900
                  font-bold px-8 py-4 rounded-xl hover:bg-green-400
                  transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <FaArrowRight />
                Log In to Dashboard
              </button>
            </div>

            <p className="mt-5 text-blue-200 text-sm">
              For reviewers & committee members —{" "}
              <button
                onClick={() => navigate("/hmis")}
                className="text-white font-semibold underline underline-offset-2
                  hover:text-green-400 cursor-pointer transition-colors"
              >
                sign in here
              </button>
            </p>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="text-xl text-blue-600" />
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── About ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                About the Portal
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                Ethics Review for Nyahururu & Beyond
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The NCRH Research Ethics Portal provides a structured, transparent
                process for submitting research proposals for scientific and ethics
                review. Aligned with KEMRI SERU standards, the portal supports the
                full research lifecycle — from initial submission through annual
                renewals to study closure.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Research protocols are reviewed by a minimum of two independent
                investigators before the research committee makes its final
                decision. All submissions are confidential and accessible only to
                authorized reviewers and committee members.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <FaCheckCircle /> ICH-GCP Compliant
                </div>
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <FaCheckCircle /> Helsinki Declaration
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.slice(0, 4).map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="bg-white rounded-xl border border-gray-100 p-5 transition-shadow hover:shadow-sm">
                  <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`text-lg ${color}`} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Lifecycle ── */}
        <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Research Lifecycle
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                From Submission to Approval
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Every research protocol follows a structured SERU-aligned review
                path to ensure scientific rigour and ethical compliance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {LIFECYCLE.map(({ icon: Icon, title, type, desc, badge, badgeColor, bg, iconColor }) => (
                <div key={title} className={`bg-gradient-to-br ${bg} rounded-xl p-6 transition-shadow hover:shadow-sm`}>
                  <Icon className={`text-2xl mb-3 ${iconColor}`} />
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 font-semibold mb-3">{type}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{desc}</p>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Resubmissions after revision requests do <strong>not</strong> require additional payment.
            </p>
          </div>
        </section>

        {/* ── Submission Types ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Submission Types
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Four Types of Submissions
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              The portal supports the full SERU research lifecycle through four
              distinct submission types.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBMISSION_TYPES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`text-xl ${color}`} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-gradient-to-br from-gray-50 to-green-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Step by Step
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                How It Works
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Getting started takes just a few minutes. Here's the journey from
                registration to ethics approval.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => {
                const c = colorMap[color];
                return (
                  <div key={step} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow relative">
                    <span className={`absolute top-4 right-4 text-2xl font-extrabold ${c.text} opacity-20`}>
                      {step}
                    </span>
                    <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="text-xl text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Additional features ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Built for Research Excellence
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`text-lg ${color}`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-blue-500 text-white py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-extrabold mb-4">
              Ready to Submit Your Research?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join researchers across Laikipia County and beyond. Register today
              and submit your first research proposal for ethics review.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/research/register")}
                className="flex items-center justify-center gap-2 bg-white text-blue-700
                  font-bold px-8 py-4 rounded-xl hover:bg-blue-50
                  transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <FaUserCheck /> Create Account
              </button>
              <button
                onClick={() => navigate("/hmis")}
                className="flex items-center justify-center gap-2 border-2 border-white/40
                  text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10
                  transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <FaArrowRight /> Log In
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Research;
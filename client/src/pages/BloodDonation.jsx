import React, { useEffect, useState } from "react";
import { Header, Footer } from "../common/layouts";
import DonationBanner from "../assets/blood-donation.jpeg";
import { PiSirenFill } from "react-icons/pi";
import { BiDonateBlood } from "react-icons/bi";
import { BsPeople } from "react-icons/bs";
import {
  FaRegChartBar,
  FaStethoscope,
  FaRegHeart,
  FaTint,
  FaPhone,
  FaArrowRight,
} from "react-icons/fa";
import { TfiWrite } from "react-icons/tfi";
import { GiCoffeeCup } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import notify from "../common/utils/notify";

const STEPS = [
  {
    num: "1",
    icon: TfiWrite,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    title: "Registration",
    body: "Share your name and contact details and request a preferred donation time. Eligibility and health screening take place in person with the donation team.",
  },
  {
    num: "2",
    icon: FaStethoscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Health Screening",
    body: "The donation team will ask about your health and may check your pulse, blood pressure, weight and haemoglobin. Staff will confirm whether it is safe for you to donate that day.",
  },
  {
    num: "3",
    icon: FaRegHeart,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    title: "Blood Donation",
    body: "Blood collection usually takes about 10 minutes. Trained staff use sterile, single-use collection equipment; allow extra time for screening and recovery.",
  },
  {
    num: "4",
    icon: GiCoffeeCup,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Rest & Recovery",
    body: "Rest and have a refreshment after donating. Drink fluids and avoid strenuous activity for the rest of the day, following any instructions from the donation team.",
  },
];

const STATS = [
  {
    icon: BiDonateBlood,
    color: "text-red-600",
    bg: "bg-red-50",
    value: "About 450 ml",
    label: "Typical whole-blood collection",
  },
  {
    icon: BsPeople,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    value: "Several patients",
    label: "May benefit when blood components are used separately",
  },
  {
    icon: FaRegChartBar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    value: "Staff assessed",
    label: "Eligibility and repeat-donation timing",
  },
];

const BloodDonation = () => {
  const navigate = useNavigate();
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrgentRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get("/urgent-request/active");
        if (res.data.success) setUrgentRequests(res.data.data || []);
        else setUrgentRequests([]);
      } catch (err) {
        if (err.response?.status !== 404)
          notify.error("Failed to load urgent blood requests");
        setUrgentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentRequests();
    const interval = setInterval(fetchUrgentRequests, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      {loading && (
        <div className="px-6 py-3 max-w-5xl mx-auto w-full">
          <div className="animate-pulse bg-slate-200 h-20 rounded-xl" />
        </div>
      )}

      {!loading && urgentRequests.length > 0 && (
        <div className="max-w-5xl mx-auto w-full px-6 pt-5 space-y-3">
          {urgentRequests.map((req, i) => (
            <div
              key={req.id || i}
              className="bg-red-600 text-white rounded-2xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <PiSirenFill className="text-xl animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">
                    Urgent Blood Request
                  </h3>
                  <PiSirenFill className="text-xl animate-pulse" />
                </div>

                <div className="flex flex-col items-center mb-4">
                  <p className="text-xs text-red-200 mb-2 uppercase tracking-wide font-semibold">
                    Blood Groups Urgently Needed
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(() => { const bgs = typeof req.bloodGroups === "string" ? JSON.parse(req.bloodGroups) : (req.bloodGroups || []); return bgs.length > 0 ? (
                      bgs.map((bg) => (
                        <span
                          key={bg}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white text-red-600
                                     rounded-full text-sm font-bold"
                        >
                          <FaTint className="text-xs" /> {bg}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-red-200">
                        All blood types needed
                      </span>
                    ); })()}
                  </div>
                </div>

                <div
                  className="flex flex-col sm:flex-row items-center justify-center gap-3
                                pt-4 border-t border-red-500"
                >
                  <p className="text-sm text-red-100">
                    Visit our donation centre or call us immediately:
                  </p>
                  {req.contactNumber && (
                    <a
                      href={`tel:${req.contactNumber}`}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-red-600
                                 rounded-full text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                      <FaPhone className="text-xs" /> {req.contactNumber}
                    </a>
                  )}
                </div>
              </div>

              <div className="h-0.5 bg-white/30 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="relative rounded-2xl overflow-hidden mb-10 h-64 md:h-80">
          <img
            src={DonationBanner}
            alt="Blood Donation"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/45 flex items-end">
            <div className="p-7 text-white">
              <h1 className="text-2xl md:text-4xl font-bold mb-1">
                Every Drop Counts
              </h1>
              <p className="text-sm md:text-base text-white/80">
                Join the life-saving mission today
              </p>
            </div>
          </div>
         
        </div>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-1">
            Why It Matters
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug">
            Blood Donation Has the Power to{" "}
            <span className="text-red-600">Save Lives</span> Across Kenya
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {STATS.map(({ icon: Icon, color, bg, value, label }) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center"
            >
              <div
                className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center mb-4`}
              >
                <Icon className={`${color} text-2xl`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-1">
            The Process
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">
            How Blood Donation Works
          </h3>
          <p className="text-slate-500 text-sm mb-7">
            Your visit includes registration, screening, collection and recovery. The full visit takes longer than collection alone.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {STEPS.map(
              ({ num, icon: Icon, color, bg, border, title, body }) => (
                <div
                  key={num}
                  className={`bg-white border ${border} rounded-2xl p-6 flex items-start gap-4`}
                >
                  <div
                    className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`${color} text-xl`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xl font-bold ${color}`}>
                        {num}
                      </span>
                      <h4 className="font-bold text-slate-800">{title}</h4>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <section className="mb-14 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8" aria-labelledby="donor-guidance-heading">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-1">Helpful guidance</p>
          <h3 id="donor-guidance-heading" className="text-2xl font-bold text-slate-800 mb-5">Before and after your visit</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Before screening</h4>
              <p>Tell the donation team about your current health, medical history and any medicines you take. If you feel unwell, let staff know before donation. The team will decide whether it is safe for you to donate.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-2">After donating</h4>
              <p>Rest and take a refreshment, drink plenty of fluids over the next day, and avoid strenuous activity for the rest of the day. Follow the donation team’s advice if you feel unwell.</p>
            </div>
          </div>
          <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Donation eligibility and the interval before another donation vary by country and personal circumstances. Hospital staff will advise you after screening. Read the <a href="https://www.who.int/news-room/questions-and-answers/item/blood-products-why-should-i-donate-blood" target="_blank" rel="noreferrer" className="font-semibold text-red-700 underline">World Health Organization blood donation guidance</a> for general information.
          </p>
        </section>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-2">
            Make a Difference
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            Ready to Save a Life?
          </h3>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            Join thousands of Kenyans who donate blood regularly. The process is
            simple, safe, and incredibly rewarding.
          </p>
          <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-semibold mb-6">
            <FaRegHeart />
            <span>Join the "I Am Kenyan By Blood" Community</span>
            <FaRegHeart />
          </div>
          <button
            onClick={() => navigate("/blood-registration")}
            className="inline-flex items-center gap-2 px-7 py-3 bg-red-600 hover:bg-red-700
                       text-white font-semibold text-sm rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Start Donating Today <FaArrowRight className="text-xs" />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BloodDonation;

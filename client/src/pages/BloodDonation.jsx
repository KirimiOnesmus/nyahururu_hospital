import React from "react";
import { Header, Footer } from "../components/layouts";
import DonationBanner from "../assets/blood-donation.jpeg";
import { PiSirenFill } from "react-icons/pi";
import { BiDonateBlood } from "react-icons/bi";
import { BsPeople } from "react-icons/bs";
import { FaRegChartBar, FaStethoscope, FaRegHeart } from "react-icons/fa";
import { TfiWrite } from "react-icons/tfi";
import { GiCoffeeCup } from "react-icons/gi";
const BloodDonation = () => {
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body flex flex-col min-h-screen">
        <div className="bg-red-600 text-white text-center py-2 px-6 rounded-sm shadow-md animate-pulse">
          <p className="text-md md:text-lg font-bold uppercase tracking-wide">
            <PiSirenFill />
            Urgent: O- (Negative) & A+ (Positive) Blood Needed Immediately!
          </p>
          <p className="mt-1 text-sm md:text-base">
            Please visit our donation center or call{" "}
            <span className="font-bold">+254 700 123 456</span>.
          </p>
        </div>
        <div className="main flex-1 px-6 md:px-12 py-6 max-w-6xl mx-auto w-full ">
          <div className="mt-4">
            <img
              src={DonationBanner}
              alt="Blood Donation"
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          </div>
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
            {" "}
            Blood Donation Has <span className="text-red-600">
              The Power
            </span>{" "}
            to <span className="text-green-600">Save Lives</span> Across Kenya
          </h2>
          <div className="cards flex flex-col md:flex-row gap-6 mt-6 justify-between">
            <div
              className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                  bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                  transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
            >
              <BiDonateBlood className="text-red-600 text-5xl mb-2" />
              <p className="text-lg font-semibold">
                450 ml{" "}
                <span className="block text-sm text-gray-700">
                  Per Donation
                </span>
              </p>
            </div>

            <div
              className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                  bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                  transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
            >
              <BsPeople className="text-green-600 text-5xl mb-2" />
              <p className="text-lg font-semibold">
                3 Lives{" "}
                <span className="block text-sm text-gray-700">Saved</span>
              </p>
            </div>

            <div
              className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                  bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                  transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
            >
              <FaRegChartBar className="text-blue-600 text-5xl mb-2" />
              <p className="text-lg font-semibold">
                56 Days{" "}
                <span className="block text-sm text-gray-700">Recovered</span>
              </p>
            </div>
          </div>

          <div className="content mt-8 space-y-6">
            <h3 className=" text-xl font-bold ">How Blood Donation Works</h3>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <TfiWrite className="text-red-600  text-5xl" />
                  <h3 className="text-lg font-semibold">
                    <span className="text-red-600 font-bold">1.</span>{" "}
                    Registration
                  </h3>
                </div>
                <p className="text-gray-700">
                  Complete a simple registration form with your personal
                  information.
                </p>
              </div>

              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <FaStethoscope className="text-green-600 text-5xl" />
                  <h3 className="text-lg font-semibold">
                    <span className="text-green-600 font-bold">2.</span>{" "}
                    Screening
                  </h3>
                </div>
                <p className="text-gray-700">
                  Brief medical check to ensure you're eligible to donate blood
                  safely.
                </p>
              </div>

              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <FaRegHeart className="text-red-600 text-5xl" />
                  <h3 className="text-lg font-semibold">
                    <span className="text-red-600 font-bold">3.</span> Donation
                  </h3>
                </div>
                <p className="text-gray-700">
                  The actual blood donation takes just 8-10 minutes in a safe
                  environment.
                </p>
              </div>

              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <GiCoffeeCup className="text-green-600  text-5xl" />
                  <h3 className="text-lg font-semibold">
                    <span className="text-green-600 font-bold">4.</span>{" "}
                    Recovery
                  </h3>
                </div>
                <p className="text-gray-700">
                  Enjoy refreshments and rest for 15 minutes before resuming
                  your day.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center my-4 space-y-2">
          <h3 className="text-xl font-bold">Ready to Make a Difference?</h3>
          <p>
            Join thousands of Kenyans who donate blood regularly to help save
            lives. The process is simple, safe, and incredibly rewarding.
          </p>
          <p className="text-red-600 animate-pulse font-bold">

              Join I am Kenyan By Blood Community
          
          </p>
          <button
           className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition duration-300 cursor-pointer mt-4"
           onClick={() => window.location.href = 'https://www.iamkenyanbyblood.org/'}
           >
            Start Donating Today
          </button>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default BloodDonation;

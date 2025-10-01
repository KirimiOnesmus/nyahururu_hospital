import React, { useState } from "react";
import { Header, Footer } from "../components/layouts";


const FinancialAid = () => {
    const [activeMethod, setActiveMethod] = useState("mpesa");
  return (
    <div>
      {" "}
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="main flex-1 px-6 md:px-12 py-6 max-w-7xl mx-auto w-full md:h-full">
        <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
          How Your Donation Helps
        </h2>
        <p className="text-lg text-gray-600">
          Your support enables us to save lives within our county and across
          Kenya through these critical programs.
        </p>
        <div className="cards flex flex-col md:flex-row gap-6 mt-6 justify-between">
          <div
            className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
          >
            <p className="text-lg font-semibold underline p-2">
              Blood Donation Drives
            </p>
            <p>
              Support our nation-wide blood collection initiatives and save
              lives.
            </p>
          </div>

          <div
            className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
          >
            <p className="text-lg font-semibold underline p-2">
              Financial Support
            </p>
            <p>
              Your donations fund essential medical supplies and infrastructure.
            </p>
          </div>

          <div
            className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
          >
            <p className="text-lg font-semibold underline p-2">
              Mobile Units & Logistics
            </p>
            <p>
              Helps us reach underserved areas with funding mobile clinics and
              transportion.
            </p>
          </div>
          <div
            className="card w-full md:w-1/3 h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
          >
            <p className="text-lg font-semibold underline p-2">
              Outreach & Education
            </p>
            <p>Empower communities with blood safety awareness and training.</p>
          </div>
        </div>
  <div className="w-full bg-white/30  p-6 text-center mt-6">
    
      <h3 className="text-2xl font-bold mb-6">Donation Methods</h3>

 
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveMethod("mpesa")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all  cursor-pointer ${
            activeMethod === "mpesa"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          M-Pesa
        </button>
        <button
          onClick={() => setActiveMethod("bank")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
            activeMethod === "bank"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Bank Transfer
        </button>
      </div>

      {/* Method Details */}
      <div>
        {activeMethod === "mpesa" && (
          <div className="my-2 p-4 bg-blue-100 rounded-lg inline-block">
            <p className="font-mono text-lg">Paybill: 123456</p>
            <p className="font-mono text-lg">Account: DONATION</p>
          </div>
        )}

        {activeMethod === "bank" && (
          <div className="my-2 p-4 bg-blue-100 rounded-lg inline-block">
            <p className="font-mono text-lg">Bank: KCB Bank</p>
            <p className="font-mono text-lg">Account No: 1234567890</p>
            <p className="font-mono text-lg">Account Name: NCRH Foundation</p>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="card h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
          <p className="text-lg font-semibold underline mb-2">Secure Payment</p>
          <p className="text-gray-700">All transactions are encrypted and secure.</p>
        </div>

        <div className="card h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
          <p className="text-lg font-semibold underline mb-2">Need Help?</p>
          <p className="text-gray-700">Contact us at +254 712 345 678</p>
        </div>

        <div className="card h-40 flex flex-col items-center justify-center 
                        bg-white/30 backdrop-blur-md shadow-lg rounded-xl p-6 text-center
                        transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
          <p className="text-lg font-semibold underline mb-2">Tax Deductible</p>
          <p className="text-gray-700">All donations are eligible for tax deductions.</p>
        </div>
      </div>
    </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default FinancialAid;

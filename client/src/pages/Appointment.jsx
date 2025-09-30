import React from "react";
import { Header, Footer } from "../components/layouts";

const Appointment = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="body">
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="main flex-1 px-6 md:px-12 py-10 max-w-4xl mx-auto w-full">
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
            Book Service With Us:
          </h2>
          <div className="form bg-white shadow-md rounded-lg p-6 md:p-10">
            <form action="" className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="David Kamau"
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="davidkamanu@gmail.com"
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="0712345678"
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Service</label>
                <select
                  name="service"
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="radiology">Radiology & Imaging</option>
                  <option value="bbestetrics">Obstetrics & Gynacology</option>
                  <option value="dialysis">Renal unit & Dialysis</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="rehab">Rehabilitative</option>
                  <option value="paediatric">Paediatric</option>
                  <option value="surgery">Surgical Services</option>
                  <option value="physiotherapy">Physiotherapy</option>
                  <option value="medical">Medical Check Ups</option>
                  <option value="ultrasound">X-Ray & Ultrasound</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                <div>
                  <label className="block mb-2 font-semibold">
                    {" "}
                    Date of Appointment
                  </label>
                  <input
                    type="date"
                    name="date"
                    className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">
                    Preffered Appointment Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Appointment;

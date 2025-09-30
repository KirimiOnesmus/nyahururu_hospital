import React from "react";
import { Header, Footer } from "../components/layouts";

const Feedback = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="body">
        {" "}
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="px-6 md:px-12 py-8 space-y-10 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
            Contact Us
          </h2>
          <div className="flex flex-col md:flex-row md:justify-between text-md font-semibold text-blue-500 gap-4">
            <p>
              Phone Number: <span>0712345678</span>
            </p>
            <p>
              Email: <span>info@ncrhospital.com</span>
            </p>
            <p>
              Location: <span>Along Nyahururu - Nakuru Highway</span>
            </p>
          </div>
          <div className="form max-w-lg mx-auto w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Talk to Us</h3>
            <form action="" className="space-y-4">
              <div>
                <label className="block mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  id=""
                  placeholder="David Kamau"
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                        focus:border-blue-500
                        "
                />
              </div>
              <div>
                <label className="block mb-1">Email:</label>
                <input
                  type="email"
                  name="email"
                  id=""
                  placeholder="davidkamau@gmail.com"
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                        focus:border-blue-500
                        "
                />
              </div>
              <div>
                <label className="block mb-1">Message:</label>
                <textarea
                  name=""
                  id=""
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                        focus:border-blue-500
                        "
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 hover:cursor-pointer"
              >
                Send
              </button>
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

export default Feedback;

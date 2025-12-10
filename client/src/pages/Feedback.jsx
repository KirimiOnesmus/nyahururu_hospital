import React, { useState } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import {toast} from "react-toastify"

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/feedback", formData);
      // console.log("Feedback submitted successfully:", response.data);
      toast.success("Feedback submitted successfully.")

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "general",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Error submitting feedback")
    } finally {
      setLoading(false);
    }
  };
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
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
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="davidkamau@gmail.com"
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                        focus:border-blue-500
                        "
                />
              </div>
              <div>
                <label className="block mb-1">Subject:</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Feedback subject"
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1">Message:</label>
                <textarea
                  name="message"
                  value={formData.message}
                  required
                  onChange={handleChange}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                        focus:border-blue-500
                        "
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 hover:cursor-pointer"
              >
                {loading ? "Sending..." : "Send"}
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

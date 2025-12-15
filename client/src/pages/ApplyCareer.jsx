import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
// import axios from "axios";
import api from "../api/axios"
import { Header, Footer } from "../components/layouts";
const ApplyCareer = () => {
  const { id } = useParams();
  const [career, setCareer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cv: null,
    coverLetter: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCareer = async () => {
      try {
        const res = await api.get(`/careers/${id}`);
        setCareer(res.data);
      } catch (error) {
        console.error("Failed to fetch career details", error);
      }
    };
    fetchCareer();
  }, [id]);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/applications", formData);
      console.log("Your job application was successfull");
      setFormData({
        name: "",
        email: "",
        phone: "",
        cv: null,
        coverLetter: null,
      });
    } catch (error) {
      console.error("Error submitting the application:", error);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="main flex-1 px-6 md:px-12 py-10 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-6 border-l-4 border-blue-500 pl-3">
          Apply for this Position
        </h2>

        {career && (
          <div className="mb-6 p-4  bg-gray-50 flex justify-between items-center text-lg">
            <div>
              <h3 className=" font-bold">{career.title}</h3>
             <p className="text-gray-500">Location: {career.location}</p> 
            </div>

            <p className=" ">
              {career.deadline && (
                <p className=" font-semibold text-red-500">
                  Deadline: {new Date(career.deadline).toLocaleDateString()}
                </p>
              )}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6  rounded-xl shadow-md space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
              placeholder="johndoe@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
              placeholder="+254712345678"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Attach CV</label>
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              required
              className="block w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Attach Cover Letter
            </label>
            <input
              type="file"
              name="coverLetter"
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              required
              className="block w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-500 text-white w-full py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer font-semibold"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default ApplyCareer;

import React, { useState, useEffect } from "react";
import { Header, Footer } from "../components/layouts";
import axios from "axios";

const ReportFraud = () => {
  const [formData, setFormData] = useState({
    issue: "", 
    dateOfIncident: "",
    location: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/fraud", formData);
      setFormData({ issue: "", dateOfIncident: "", location: "", details: "" });
      console.log("Feedback submitted successfully:", response.data);
    } catch (error) {
      console.error(error);
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
            Grievance Services
          </h2>
          <p>
            We are committed to upholding high ethical standards and fostering a
            fair, respectful, and safe working environment. We recognize that
            employees and stakeholders may sometimes experience grievances such
            as unfair treatment, harassment, discrimination, or other
            workplace-related concerns. To ensure that such matters are
            addressed appropriately, we have established a confidential
            reporting channel through which individuals can raise their
            grievances without fear of retaliation or victimization. If you wish
            to submit a grievance or report workplace-related concerns
            confidentially, please use the form below:
          </p>
          <div className="form max-w-2xl mx-auto w-full">
            <h3 className="text-xl font-bold mb-4 text-center">
              Describe your issue
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">What is your concern?</label>
                <input
                  type="text"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>
              <div>
                <label className="block mb-1">When did this happen ?</label>
                <input
                  type="text"
                  name="dateOfIncident"
                  value={formData.dateOfIncident}
                  onChange={handleChange}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>

              <div>
                <label className="block mb-1">Where did it happen ?</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>

              <div>
                <label className="block mb-1">Details of the Case:</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  cols={10}
                  rows={10}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                  placeholder="Please describe what has happened and why you are submmit this report. If you wish to be anonymous make sure that you do not include information in the report that can reveal your identity."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 hover:cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit"}
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

export default ReportFraud;

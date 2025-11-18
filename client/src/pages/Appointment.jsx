import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
import axios from "axios";

const Appointment = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
   
      const fetchServices = async () => {
        try {
          const res = await axios.get("/api/services");
          setServices(res.data);
        } catch (error) {
          console.error("Error fetching services", error);
        }
      };
      fetchServices();
    
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/appointments", formData);
      setFormData({
        name: " ",
        email: "",
        phone: "",
        service: "",
        date: "",
        time: "",
      });
      console.log("Booked successfully:", res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="David Kamau"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Service</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a Service</option>
                  {services.map((service) => (
                    <option key={service._id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
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
                    value={formData.date}
                    onChange={handleChange}
                    required
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
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 cursor-pointer"
                >
                  {loading ? "Booking..." : "Book Appointment"}
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

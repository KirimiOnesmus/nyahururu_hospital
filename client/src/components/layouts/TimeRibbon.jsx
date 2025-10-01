import React from "react";
import { useNavigate } from "react-router-dom";

const TimeRibbon = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-blue-400 text-white py-16">
      <div className=" flex flex-col justify-center md:flex-row md:justify-around mx-6 space-y-6 md:space-y-0">
        <div className="hours space-y-2">
          <div>
            <h3 className="text-2xl font-semibold mb-2 underline">Work Hours</h3>
            <p className="font-serif">Monday-Sunday: 24/7</p>
          </div>
          <div>
            {" "}
            <h3 className="text-2xl font-semibold underline">Visiting Hours</h3>
            <p className="font-serif">Monday-Sunday: 12noon-2pm, 4pm-6 pm</p>
          </div>
        </div>
        <div className="specialist-hours">
          <h3 className="text-2xl font-semibold mb-2 underline">Specialist Clinics</h3>
          <p className="font-serif">Monday-Friday: 8am-5pm</p>
          <p className="font-serif">Saturday & Sunday: 9am-4pm</p>
          <button 
          className="mt-2 font-bold rounded-lg border p-2 cursor-pointer"
          onClick={() => navigate("/appointment ")}
          >Book Appointment</button>
        </div>
        <div>
          <h3 className="text-2xl font-semibold mb-2 underline">Feedback</h3>
          <p className="font-serif">We'd love to hear from you.</p>
          <button 
          className="mt-2 font-bold rounded-lg border p-2 cursor-pointer"
          onClick={() => navigate("/feedback")}
          >Send Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default TimeRibbon;

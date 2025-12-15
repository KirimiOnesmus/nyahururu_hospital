import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
// import api from " ../"
import axios from "axios";

const Careers = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await axios.get("/api/careers");
        setCareers(res.data);
      } catch (error) {
        console.error("failed to fetch jobs", error);
      }
      finally {
      setLoading(false); 
    }
    };
    fetchCareers();
  }, []);
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="main flex-1 px-6 md:px-12 py-6 max-w-5xl mx-auto w-full md:min-h-[80vh]">
        <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
          Join Us:
        </h2>
        {loading && <p>Loading available positions...</p>}

        {!loading && careers.length === 0 && (
          <p>No open positions available right now.</p>
        )}
        <div className="grid gap-6">
          {careers.map((careers) => (
            <div
              key={careers._id}
              className="px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition bg-white"
            >
              <h3 className="text-2xl font-semibold text-gray-800 flex justify-between">
                {careers.title}
                {careers.deadline && (
                  <p className="text-sm text-red-500">
                    Deadline: {new Date(careers.deadline).toLocaleDateString()}
                  </p>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Location: {careers.location}
              </p>

             
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => setSelectedCareer(careers)}
                  className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  View Details
                </button>
                <a
                  href={`/apply/${careers._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Apply Now
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
      {selectedCareer && (
        <div
          className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50 "
          onClick={() => setSelectedCareer(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-xl">
                          <button
              onClick={() => setSelectedCareer(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-700 cursor-pointer font-bold text-xl"
            >
              X
            </button>
            <div className="py-4">
              {" "}
              <h2 className="text-2xl font-bold mb-2">
                {selectedCareer.title}
              </h2>
              <p className="mt-2 text-gray-600">
                Department: {selectedCareer.department}
              </p>
              <p className="text-gray-600">
                Location: {selectedCareer.location}
              </p>
              {selectedCareer.deadline && (
                <p className="text-red-500 mt-2 font-semibold">
                  Deadline:{" "}
                  {new Date(selectedCareer.deadline).toLocaleDateString()}
                </p>
              )}
            </div>

            <p className="text-gray-700">{selectedCareer.description}</p>

            <div className="mt-4 flex justify-end">
              <a
                href={`/apply/${selectedCareer._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Now
              </a>
            </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Careers;

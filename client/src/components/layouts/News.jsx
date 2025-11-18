import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const startIndex = currentPage * itemsPerPage;
  const visibleNews = Array.isArray(news)
    ? news.slice(startIndex, startIndex + itemsPerPage)
    : [];

  const hasNext = startIndex + itemsPerPage < news.length;
  const hasPrev = currentPage > 0;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/news");
        setNews(res.data);
        console.log("Fetched news data:", res.data);
      } catch (error) {
        console.error("Error fetching news data:", error);
      }
      finally {
      setLoading(false);
    }
    };

    fetchNews();
  }, []);

if (!Array.isArray(news) || news.length === 0) return <p className="px-6 font-bold font-xl">No news available......</p>;

  return (
    <div className="news my-8 mx-6">
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleNews.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/news/${item._id}`)}
            className="rounded-2xl shadow-md p-4 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            {item.imageUrl && (
              <img
                src={`http://localhost:5000${item.imageUrl}`}
                alt={item.title}
                className="rounded-lg mb-3 h-40 w-full object-cover"
              />
            )}
            <h4 className="font-bold text-lg mb-2 text-center">{item.title}</h4>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-6 gap-4">
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={!hasPrev}
          className={`px-6 py-2 rounded-lg font-bold ${
            hasPrev
              ? "bg-blue-500 text-white hover:bg-white hover:text-blue-500 border border-blue-500 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Previous
        </button>

        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!hasNext}
          className={`px-6 py-2 rounded-lg font-bold ${
            hasNext
              ? "bg-blue-500 text-white hover:bg-white hover:text-blue-500 border border-blue-500 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default News;

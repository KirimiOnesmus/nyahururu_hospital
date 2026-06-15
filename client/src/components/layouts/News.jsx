import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { FaArrowRight, FaArrowLeft, FaNewspaper } from "react-icons/fa";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const itemsPerPage = 2;
  const startIndex = currentPage * itemsPerPage;
  const visibleNews = news.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const hasNext = startIndex + itemsPerPage < news.length;
  const hasPrev = currentPage > 0;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("/news");
        
        setNews(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching news data:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading news…</p>
      </div>
    );
  }


  if (news.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
        <FaNewspaper className="text-4xl" />
        <p className="font-semibold text-slate-600">No news available</p>
        <p className="text-sm">Check back later for updates.</p>
      </div>
    );
  }

  return (
    <section className="py-12 px-6 max-w-6xl mx-auto">
   
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
          Updates
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Latest News</h2>
        <p className="text-slate-500 text-sm mt-1">Stay informed with our latest stories and announcements.</p>
      </div>


      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {visibleNews.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/news/${item._id}`)}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer
                       hover:border-blue-400 transition-colors duration-200 flex flex-col"
          >
         
            <div className="h-52 bg-slate-100 overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={`${BACKEND_URL}${item.imageUrl}`}
                  alt={item.title}
                  className="w-fit h-full object-cover"
                />
              ) : (
                <FaNewspaper className="text-5xl text-slate-300" />
              )}
            </div>

   
            <div className="p-5 flex flex-col flex-1">
              <h4 className="font-bold text-base text-slate-800 mb-3 line-clamp-2">
                {item.title}
              </h4>
              <div className="flex-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/news/${item._id}`);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600
                           hover:text-blue-800 transition-colors duration-200 self-start mt-2"
              >
                Read more <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>


      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={!hasPrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200
                       text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <FaArrowLeft className="text-xs" /> Prev
          </button>

          <span className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50
                           border border-slate-200 rounded-lg">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!hasNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200
                       text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next <FaArrowRight className="text-xs" />
          </button>
        </div>
      )}
    </section>
  );
};

export default News;
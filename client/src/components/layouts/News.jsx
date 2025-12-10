import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;

  const startIndex = currentPage * itemsPerPage;
  const visibleNews = Array.isArray(news)
    ? news.slice(startIndex, startIndex + itemsPerPage)
    : [];

  const hasNext = startIndex + itemsPerPage < news.length;
  const hasPrev = currentPage > 0;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("/news");
        setNews(res.data);
        console.log("Fetched news data:", res.data);
      } catch (error) {
        console.error("Error fetching news data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading news...</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(news) || news.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-xl font-bold text-gray-700">No news available</p>
          <p className="text-gray-500 mt-2">Check back later for updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-3xl  font-bold text-gray-900 mb-3">
            Latest News
          </h1>
          <p className="mt-4 text-gray-600">Stay updated with our latest stories</p>
        </div>

 
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {visibleNews.map((item, index) => (
            <div
              key={item._id}
              onClick={() => navigate(`/news/${item._id}`)}
              className="group relative rounded-2xl shadow-lg overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                {item.imageUrl ? (
                  <img
                    src={`http://localhost:5000${item.imageUrl}`}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

 
              <div className="p-6">
                <h4 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                  {item.title}
                </h4>
                

                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                  <span>Read more</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>


              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            </div>
          ))}
        </div>


        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={!hasPrev}
              className={`group relative px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                hasPrev
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${hasPrev ? 'group-hover:-translate-x-1' : ''} transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </span>
            </button>

     
            <div className="px-6 py-3 bg-white rounded-xl shadow-md font-semibold text-gray-700">
              Page {currentPage + 1} of {Math.ceil(news.length / itemsPerPage)}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!hasNext}
              className={`group relative px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                hasNext
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-2">
                Next
                <svg className={`w-5 h-5 ${hasNext ? 'group-hover:translate-x-1' : ''} transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
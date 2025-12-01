import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header, Footer } from "../../components/layouts";
import axios from "axios";

const NewsDetails = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`/api/news/${id}`);
        setNews(response.data);
      } catch (err) {
        setError("Failed to fetch news details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  if (!news) {
    return <p className="text-center text-red-500">News not found</p>;
  }
    if (loading) return <p className="text-center mt-10">Loading...</p>;
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm ">
        <Header />
      </div>
 <div className="px-6 py-10 max-w-5xl mx-auto h-full md:h-[80vh]">
        {news.imageUrl && (
          <img
            src={`http://localhost:5000${news.imageUrl}`}
            alt={news.title}
            className="w-full h-72 object-cover rounded-2xl shadow-md mb-6"
          />
        )}
        <h1 className="text-3xl font-bold mb-4">{news.title}</h1>
        <p className="text-gray-500 text-sm mb-6">
          Published on {new Date(news.createdAt).toLocaleDateString()}
        </p>
        <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
          {news.content}
        </p>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default NewsDetails;

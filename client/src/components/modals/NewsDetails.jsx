import React from "react";
import { useParams } from "react-router-dom";
import newsData from "../../data/newsData";
import { Header, Footer } from "../../components/layouts";
const NewsDetails = () => {
  const { id } = useParams();
  const news = newsData.find((n) => n.id === parseInt(id));
  if (!news) {
    return <p className="text-center text-red-500">News not found</p>;
  }
  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm ">
        <Header />
      </div>
      <div className="px-6 py-10 max-w-5xl mx-auto h-full md:h-[80vh]">
        <img
          src={news.image}
          alt={news.title}
          className="w-full h-72 object-cover rounded-2xl shadow-md mb-6"
        />
        <h1 className="text-3xl font-bold mb-4">{news.title}</h1>
        <p className="text-gray-500 text-sm mb-6">Published on {news.date}</p>
        <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
          {news.excerpt}
        </p>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default NewsDetails;

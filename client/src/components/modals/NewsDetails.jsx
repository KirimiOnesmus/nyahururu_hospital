import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../components/layouts";
import api from "../../api/axios";
import {
  FaArrowLeft,
  FaNewspaper,
  FaCalendarAlt,
  FaClock,
  FaFacebookF,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace("/api", "") ||
  "http://localhost:5000";

const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <Header />
    </div>
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      {children}
    </main>
    <Footer />
  </div>
);

const NewsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get(`/news/${id}`);
        setNews(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch news details.");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading article…</p>
        </div>
      </Shell>
    );
  }

  if (error || !news) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <FaNewspaper className="text-2xl text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Article Not Found
          </h2>
          <p className="text-slate-500 text-sm max-w-sm">
            {error ||
              "The article you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-semibold rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Back Home
          </button>
        </div>
      </Shell>
    );
  }

  const readTime = news.content
    ? Math.max(1, Math.ceil(news.content.split(" ").length / 200))
    : null;

  const formattedDate = news.createdAt
    ? new Date(news.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(news.title || "");

  const shareLinks = [
    {
      label: "Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "text-blue-600 border-blue-200 hover:bg-blue-600",
    },
    {
      label: "Twitter",
      icon: FaTwitter,
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      color: "text-sky-500 border-sky-200 hover:bg-sky-500",
    },
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
      color: "text-emerald-600 border-emerald-200 hover:bg-emerald-600",
    },
  ];

  return (
    <Shell>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
                   hover:text-blue-600 transition-colors duration-150 mb-8 cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to News
      </button>

      <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {news.imageUrl && (
          <div className="h-72 md:h-96 overflow-hidden bg-slate-100 flex items-center justify-center">
            <img
              src={`${BACKEND_URL}${news.imageUrl}`}
              alt={news.title}
              className="w-fit h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 md:p-10">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                           bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-5"
          >
            <FaNewspaper className="text-[10px]" /> News
          </span>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug mb-6">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 pb-6 mb-8 border-b border-slate-100">
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <FaCalendarAlt className="text-blue-400 text-xs" />
                <time>{formattedDate}</time>
              </div>
            )}
            {readTime && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <FaClock className="text-blue-400 text-xs" />
                <span>{readTime} min read</span>
              </div>
            )}
          </div>

          <div className="text-slate-700 text-[0.97rem] leading-relaxed whitespace-pre-line">
            {news.content}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Share this article
            </p>
            <div className="flex items-center gap-2">
              {shareLinks.map(({ label, icon: Icon, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share on ${label}`}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center
                              text-sm transition-colors duration-150 hover:text-white cursor-pointer ${color}`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Shell>
  );
};

export default NewsDetails;

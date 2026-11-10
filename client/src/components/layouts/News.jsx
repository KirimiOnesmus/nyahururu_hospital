import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ASSET_BASE_URL } from "../../config/env";
import { IconArrowRight, IconArrowLeft, IconNewspaper } from "../../common/icons";

const BACKEND_URL = ASSET_BASE_URL;

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
        <div className="w-10 h-10 border-2 border-line border-t-primary rounded-full animate-spin" />
        <p className="text-ink-muted text-sm">Loading news…</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-ink-muted">
        <IconNewspaper className="w-10 h-10" aria-hidden="true" />
        <p className="font-semibold text-ink">No news available</p>
        <p className="text-sm">Check back later for updates.</p>
      </div>
    );
  }

  return (
    <section className="py-12 px-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Updates
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-ink">Latest News</h2>
        <p className="text-ink-muted text-sm mt-1">
          Stay informed with our latest stories and announcements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {visibleNews.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/news/${item.id}`)}
            className="bg-surface border border-line rounded-2xl overflow-hidden cursor-pointer
                       hover:border-primary transition-colors duration-200 flex flex-col shadow-sm"
          >
            <div className="h-52 bg-canvas overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={`${BACKEND_URL}${item.imageUrl}`}
                  alt={item.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <IconNewspaper className="w-12 h-12 text-ink-muted" aria-hidden="true" />
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <h4 className="font-bold text-base text-ink mb-3 line-clamp-2">{item.title}</h4>
              <div className="flex-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/news/${item.id}`);
                }}
                className="flex items-center gap-1.5 min-h-11 text-sm font-semibold text-primary
                           hover:text-primary-hover self-start mt-2"
              >
                Read more <IconArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={!hasPrev}
            className="flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-line
                       text-sm font-semibold text-ink-muted hover:border-primary hover:text-primary
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconArrowLeft className="w-4 h-4" /> Previous
          </button>

          <span className="px-4 min-h-11 inline-flex items-center text-sm font-semibold text-ink bg-canvas border border-line rounded-xl">
            {currentPage + 1} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!hasNext}
            className="flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-line
                       text-sm font-semibold text-ink-muted hover:border-primary hover:text-primary
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default News;

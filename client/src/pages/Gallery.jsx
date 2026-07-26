import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Header, Footer } from "../common/layouts";
import api from "../api/axios";
import { ASSET_BASE_URL } from "../config/env";
import {
  FaImages, FaVideo, FaTh, FaThLarge, FaSearch,
  FaTimes, FaChevronLeft, FaChevronRight, FaExpand,
  FaCalendarAlt, FaEye, FaCamera,
} from "react-icons/fa";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "";


const Lightbox = ({ item, items, onClose, onNav }) => {
  const idx = items.findIndex((i) => i.id === item?.id);

  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && idx > 0) onNav(items[idx - 1]);
      if (e.key === "ArrowRight" && idx < items.length - 1) onNav(items[idx + 1]);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, items, idx, onClose, onNav]);

  if (!item) return null;
  const src = item.fileUrl?.startsWith("http") ? item.fileUrl : `${ASSET_BASE_URL}${item.fileUrl}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >

      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
      >
        <FaTimes />
      </button>


      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(items[idx - 1]); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
        >
          <FaChevronLeft />
        </button>
      )}
      {idx < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(items[idx + 1]); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
        >
          <FaChevronRight />
        </button>
      )}


      <div className="max-w-5xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <video src={src} controls autoPlay className="max-h-[75vh] rounded-xl mx-auto" />
        ) : (
          <img src={src} alt={item.title} className="max-h-[75vh] w-auto rounded-xl mx-auto object-contain" />
        )}
        <div className="mt-4 text-center">
          <h3 className="text-white text-lg font-bold">{item.title}</h3>
          {item.description && <p className="text-white/60 text-sm mt-1">{item.description}</p>}
          <div className="flex items-center justify-center gap-4 mt-2 text-white/40 text-xs">
            {item.category && <span>{item.category}</span>}
            {item.createdAt && <span>{fmtDate(item.createdAt)}</span>}
            <span>{idx + 1} / {items.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const Gallery = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [lightboxItem, setLightboxItem] = useState(null);
  const [gridSize, setGridSize] = useState("normal"); // "normal" | "large"

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const [galleryRes, catRes] = await Promise.all([
        api.get("/gallery", { params: { visible: true } }),
        api.get("/gallery/categories").catch(() => ({ data: [] })),
      ]);
      const data = Array.isArray(galleryRes.data) ? galleryRes.data : galleryRes.data.data || [];
      setItems(data.filter((i) => i.visible !== false));
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchSearch = !q || item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const matchType = activeType === "all" || item.type === activeType;
      return matchSearch && matchCat && matchType;
    });
  }, [items, search, activeCategory, activeType]);

  const stats = useMemo(() => ({
    total: items.length,
    images: items.filter((i) => i.type === "image").length,
    videos: items.filter((i) => i.type === "video").length,
  }), [items]);

  const allCategories = useMemo(() => {
    const fromItems = [...new Set(items.map((i) => i.category).filter(Boolean))];
    const fromApi = categories.map((c) => c.name || c);
    return [...new Set([...fromItems, ...fromApi])].sort();
  }, [items, categories]);

  const imgSrc = (item) => {
    const url = item.thumbnailUrl || item.fileUrl;
    return url?.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1">

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
                Hospital Gallery
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Photos & Videos
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Explore our facilities, events, staff, and the community we serve.
              </p>
            </div>
            <div className="flex items-center gap-5">
              {[
                { label: "Photos", value: stats.images, icon: FaImages },
                { label: "Videos", value: stats.videos, icon: FaVideo },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

 
        <section className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
       
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search photos and videos…"
                  className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>

    
              <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                {[
                  { key: "all", label: "All", icon: null },
                  { key: "image", label: "Photos", icon: FaImages },
                  { key: "video", label: "Videos", icon: FaVideo },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveType(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeType === key
                        ? "bg-white text-blue-600 border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {Icon && <Icon className="text-[10px]" />}
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid toggle */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                <button onClick={() => setGridSize("normal")} className={`p-2 rounded-lg transition-all cursor-pointer ${gridSize === "normal" ? "bg-white text-blue-600 border border-slate-200" : "text-slate-400"}`}>
                  <FaTh className="text-sm" />
                </button>
                <button onClick={() => setGridSize("large")} className={`p-2 rounded-lg transition-all cursor-pointer ${gridSize === "large" ? "bg-white text-blue-600 border border-slate-200" : "text-slate-400"}`}>
                  <FaThLarge className="text-sm" />
                </button>
              </div>
            </div>

          
            {allCategories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                {allCategories.map((cat) => {
                  const count = items.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeCategory === cat
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                      <span className={`ml-1.5 text-[10px] ${activeCategory === cat ? "text-blue-200" : "text-slate-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

  
        <section className="max-w-6xl mx-auto px-6 py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="w-12 h-12 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading gallery…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FaImages className="text-3xl text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">
                {search || activeCategory !== "all" || activeType !== "all"
                  ? "No items match your filters"
                  : "No gallery items yet"}
              </p>
              {(search || activeCategory !== "all" || activeType !== "all") && (
                <button
                  onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); }}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
    
              <p className="text-xs text-slate-400 mb-5">
                Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {items.length} items
              </p>

              <div className={`grid gap-4 ${
                gridSize === "large"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              }`}>
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer"
                    onClick={() => setLightboxItem(item)}
                  >
                  
                    <div className={`relative overflow-hidden ${gridSize === "large" ? "aspect-[4/3]" : "aspect-square"}`}>
                      {item.type === "video" ? (
                        <video
                          src={imgSrc(item)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          muted
                        />
                      ) : (
                        <img
                          src={imgSrc(item)}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                     
                      {item.type === "video" && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <FaVideo className="text-[8px]" /> VIDEO
                        </div>
                      )}


                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{item.title}</p>
                          {item.category && (
                            <p className="text-white/60 text-xs mt-0.5">{item.category}</p>
                          )}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-2">
                          <FaExpand className="text-white text-sm" />
                        </div>
                      </div>
                    </div>

           
                    <div className="px-3.5 py-3">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.category && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                        {item.createdAt && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <FaCalendarAlt className="text-[8px]" />
                            {fmtDate(item.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />

   
      <Lightbox
        item={lightboxItem}
        items={filtered}
        onClose={() => setLightboxItem(null)}
        onNav={(item) => setLightboxItem(item)}
      />
    </div>
  );
};

export default Gallery;

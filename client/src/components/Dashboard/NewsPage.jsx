import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import { ASSET_BASE_URL } from "../../config/env";
import { MdEdit, MdDelete } from "react-icons/md";
import {
  FaSearch, FaPlus, FaImage, FaRegFileAlt, FaCalendarAlt,
  FaUser, FaTimes, FaNewspaper, FaEye,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge, Avatar, DataTable,
} from "../../common/components";



const EMPTY_FORM = { title: "", content: "", author: "", image: null };


const IMG_BASE = ASSET_BASE_URL;

const resolveImage = (url) => {
  if (!url) return null;
  
  return url.startsWith("http") || url.startsWith("blob:") ? url : `${IMG_BASE}${url}`;
};



const Thumb = ({ url, title, size = "sm" }) => {
  const sizes = { sm: "w-14 h-14", lg: "w-full h-52" };
  const resolved = resolveImage(url);
  return resolved ? (
    <img src={resolved} alt={title} className={`${sizes[size]} object-cover rounded-xl`} />
  ) : (
    <div className={`${sizes[size]} bg-gray-100 rounded-xl flex items-center justify-center shrink-0`}>
      <FaImage className="text-gray-300 text-lg" />
    </div>
  );
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const NewsPage = () => {
  const [newsList,    setNewsList]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingNews,  setEditingNews]  = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [previewImage, setPreviewImage] = useState(null);

  const [viewModal,    setViewModal]    = useState(false);
  const [viewingNews,  setViewingNews]  = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/news");
      setNewsList(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  useSocket("news:created", fetchNews);
  useSocket("news:updated", fetchNews);
  useSocket("news:deleted", fetchNews);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return newsList;
    return newsList.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.author?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q)
    );
  }, [newsList, search]);

  const stats = useMemo(() => ({
    total:        newsList.length,
    withImage:    newsList.filter(n => n.imageUrl).length,
    withoutImage: newsList.filter(n => !n.imageUrl).length,
  }), [newsList]);

 
  const openModal = (news = null) => {
    setEditingNews(news);
    setFormData(news
      ? { title: news.title || "", content: news.content || "", author: news.author || "", image: null }
      : EMPTY_FORM
    );

    setPreviewImage(news?.imageUrl ? resolveImage(news.imageUrl) : null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingNews(null);
    setFormData(EMPTY_FORM);
    setPreviewImage(null);
    setModalOpen(false);
  };

  const setField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { notify.error("Image must be under 5 MB"); return; }
    setField("image", file);
  
    if (previewImage?.startsWith("blob:")) URL.revokeObjectURL(previewImage);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())   { notify.error("Title is required"); return; }
    if (!formData.author.trim())  { notify.error("Author is required"); return; }
    if (!formData.content.trim()) { notify.error("Content is required"); return; }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title",   formData.title.trim());
      payload.append("content", formData.content.trim());
      payload.append("author",  formData.author.trim());
      if (formData.image) payload.append("image", formData.image);

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingNews) {
        await api.put(`/news/${editingNews.id}`, payload, cfg);
        notify.success("News updated");
      } else {
        await api.post("/news", payload, cfg);
        notify.success("News created");
      }
      closeModal();
      fetchNews();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving news");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this news article?")) return;
    try {
      await api.delete(`/news/${id}`);
      notify.success("News deleted");
      setNewsList(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting news");
    }
  };

  const openView = (news) => { setViewingNews(news); setViewModal(true); };

  const newsColumns = [
    {
      key: "thumb", label: "Image", priority: "C",
      render: (n) => <Thumb url={n.imageUrl} title={n.title} />,
    },
    {
      key: "title", label: "Title", priority: "A", mobileSlot: "identity",
      render: (n) => (
        <div className="max-w-xs">
          <p className="font-semibold text-gray-900 line-clamp-2">{n.title}</p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{n.content}</p>
        </div>
      ),
    },
    {
      key: "author", label: "Author", priority: "B", mobileSlot: "status",
      render: (n) => (
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaUser className="text-gray-300 shrink-0" />{n.author}
        </span>
      ),
    },
    {
      key: "date", label: "Date", priority: "B", mobileSlot: "value",
      render: (n) => (
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaCalendarAlt className="text-gray-300 shrink-0" />{fmtDate(n.createdAt)}
        </span>
      ),
    },
    {
      key: "actions", label: "Actions", align: "right", priority: "A", mobileSlot: "actions",
      render: (n) => (
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openView(n)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View"><FaEye className="text-sm" /></button>
          <button onClick={() => openModal(n)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit"><MdEdit className="text-sm" /></button>
          <button onClick={() => handleDelete(n.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete"><MdDelete className="text-sm" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <FaNewspaper className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">News Management</h1>
              <p className="text-xs text-gray-400">Create, edit, and manage hospital news and updates</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors  cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add News
          </button>
        </div>

    
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Articles"  value={stats.total}        icon={FaRegFileAlt} accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="With Image"      value={stats.withImage}    icon={FaImage}      accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Without Image"   value={stats.withoutImage} icon={FaImage}      accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, or content…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          {search && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 self-center">
              <span className="font-semibold text-gray-700">{filtered.length}</span> of {newsList.length}
              <button onClick={() => setSearch("")} className="ml-1 text-gray-300 hover:text-rose-400 cursor-pointer">
                <FaTimes />
              </button>
            </div>
          )}
        </div>

  
        {loading ? (
          <Spinner text="Loading articles…" />
        ) : filtered.length === 0 ? (
          <EmptyState text={search ? "No articles match your search" : "No news articles yet"} icon={FaNewspaper} />
        ) : (
          <>
  
            <div className="hidden md:block">
              <DataTable columns={newsColumns} data={filtered} rowKey={(n) => n.id} />
              <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{newsList.length}</span> articles
                </p>
              </div>
            </div>

              <div className="md:hidden space-y-3 p-4">
                {filtered.map(n => (
                  <div key={n.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-4">
                    <Thumb url={n.imageUrl} title={n.title} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.content}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <FaUser className="text-gray-300" />{n.author}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <FaCalendarAlt className="text-gray-300" />{fmtDate(n.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => openView(n)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer"><FaEye /></button>
                      <button onClick={() => openModal(n)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"><MdEdit /></button>
                      <button onClick={() => handleDelete(n.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer"><MdDelete /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title="Article Preview"
        size="xl"
      >
        {viewingNews && (
          <>
            <Thumb url={viewingNews.imageUrl} title={viewingNews.title} size="lg" />
            <div className="mt-5 space-y-4">
              <h3 className="text-xl font-black text-gray-900">{viewingNews.title}</h3>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaUser className="text-gray-300" />{viewingNews.author}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaCalendarAlt className="text-gray-300" />{fmtDate(viewingNews.createdAt)}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{viewingNews.content}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => { setViewModal(false); openModal(viewingNews); }}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  <MdEdit /> Edit
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingNews ? "Edit Article" : "New Article"}
        subtitle={editingNews ? "Update news details" : "Create a new news article"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Title" required>
            <input
              name="title" value={formData.title}
              onChange={e => setField("title", e.target.value)}
              placeholder="e.g., Hospital Wins Excellence Award"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required
            />
          </FormField>

          <FormField label="Author" required>
            <input
              name="author" value={formData.author}
              onChange={e => setField("author", e.target.value)}
              placeholder="e.g., Dr. Jane Wanjiru"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required
            />
          </FormField>

          <FormField label="Content" required>
            <textarea
              name="content" value={formData.content}
              onChange={e => setField("content", e.target.value)}
              placeholder="Write the full news article here…"
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none"
              required
            />
          </FormField>

          <FormField label="Thumbnail (optional)">
            {previewImage && (
              <div className="relative mb-3 group/img">
                <img src={previewImage} alt="Preview" className="w-full h-44 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                  
                    if (previewImage.startsWith("blob:")) URL.revokeObjectURL(previewImage);
                    setPreviewImage(null);
                    setField("image", null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-gray-500 hover:text-rose-500 cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaImage className="text-gray-300 text-lg shrink-0" />
              <span className="text-sm text-gray-400 truncate">
                {formData.image ? formData.image.name : "Click to upload image (JPG, PNG, WEBP · max 5 MB)"}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button" onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors "
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <>{editingNews ? "Update Article" : "Publish Article"}</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NewsPage;

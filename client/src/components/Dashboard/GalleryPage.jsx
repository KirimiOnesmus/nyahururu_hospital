import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../api/axios";
import {
  FaPlus, FaSearch, FaImage, FaVideo, FaFolder, FaClock,
  FaTrash, FaEye, FaEyeSlash, FaTimes, FaUpload, FaCheckCircle,
  FaFolderPlus, FaSpinner, FaTh, FaList, FaLayerGroup,
} from "react-icons/fa";
import { toast } from "react-toastify";


const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const EMPTY_UPLOAD = { files: [], title: "", description: "", category: "", tags: "", visible: true };


const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${accent.num}`}>{value}</p>
    </div>
  </div>
);

const TypeBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
    type === "image" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
  }`}>
    {type === "image" ? <FaImage className="text-[9px]" /> : <FaVideo className="text-[9px]" />}
    {type}
  </span>
);

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading gallery…</p>
  </div>
);

const Empty = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <FaImage className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">No media found</p>
  </div>
);

const Modal = ({ open, onClose, title, subtitle, children, maxW = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors shrink-0">
            <FaTimes className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow";


const GalleryPage = () => {
  const [galleryItems,   setGalleryItems]   = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType,     setFilterType]     = useState("all");
  const [sortBy,         setSortBy]         = useState("newest");
  const [viewMode,       setViewMode]       = useState("grid");
  const [selectedItems,  setSelectedItems]  = useState([]);
  const [uploadModal,    setUploadModal]    = useState(false);
  const [categoryModal,  setCategoryModal]  = useState(false);
  const [newCategory,    setNewCategory]    = useState("");
  const [uploadData,     setUploadData]     = useState(EMPTY_UPLOAD);


  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory !== "all") params.category = filterCategory;
      if (filterType     !== "all") params.type     = filterType;
      if (searchTerm)               params.search   = searchTerm;
      const sortMap = { newest:"-uploadDate", oldest:"uploadDate", alphabetical:"title" };
      params.sort = sortMap[sortBy] || "-uploadDate";
      const res = await api.get("/gallery", { params });
      setGalleryItems(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching gallery");
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterType, sortBy, searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/gallery/categories");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setCategories(data.map(c => c.name));
    } catch {
      toast.error("Error fetching categories");
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const stats = useMemo(() => ({
    totalImages:    galleryItems.filter(i => i.type === "image").length,
    totalVideos:    galleryItems.filter(i => i.type === "video").length,
    totalCategories:categories.length,
    recentItems:    galleryItems.filter(i =>
      new Date(i.uploadDate) > new Date(Date.now() - 7*24*60*60*1000)
    ).length,
  }), [galleryItems, categories]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const oversized = files.filter(f => f.size > 50*1024*1024);
    if (oversized.length) { toast.error("Some files exceed the 50 MB limit"); return; }
    setUploadData(p => ({ ...p, files }));
  };

  const setUploadField = (key, val) => setUploadData(p => ({ ...p, [key]: val }));

  const handleUploadSubmit = async () => {
    if (!uploadData.files.length)   { toast.error("Please select at least one file"); return; }
    if (!uploadData.title.trim())   { toast.error("Title is required"); return; }
    if (!uploadData.category)       { toast.error("Category is required"); return; }
    setSubmitting(true);
    try {

      const results = await Promise.allSettled(
        uploadData.files.map(file => {
          const fd = new FormData();
          fd.append("file",        file);
          fd.append("title",       uploadData.title.trim());
          fd.append("description", uploadData.description.trim());
          fd.append("category",    uploadData.category);
          fd.append("tags",        uploadData.tags);
          fd.append("visible",     uploadData.visible);
          return api.post("/gallery", fd, { headers:{ "Content-Type":"multipart/form-data" } });
        })
      );
      const failed    = results.filter(r => r.status === "rejected").length;
      const succeeded = results.length - failed;
      if (succeeded > 0) toast.success(`${succeeded} file(s) uploaded`);
      if (failed > 0)    toast.error(`${failed} file(s) failed`);
      setUploadModal(false);
      setUploadData(EMPTY_UPLOAD);
      fetchGallery();
    } catch {
      toast.error("Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) { toast.error("Category name is required"); return; }
    setSubmitting(true);
    try {
      await api.post("/gallery/categories", { name: newCategory.trim() });
      toast.success("Category added");
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await api.get("/gallery/categories");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      const cat = data.find(c => c.name === name);
      if (cat) { await api.delete(`/gallery/categories/${cat._id}`); toast.success("Category deleted"); fetchCategories(); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting category");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/gallery/${id}`);
      setGalleryItems(prev => prev.filter(i => i._id !== id));
      setSelectedItems(prev => prev.filter(i => i !== id));
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting item");
    }
  };

  const handleToggleVisibility = async (id, current) => {
    try {
      await api.patch(`/gallery/${id}/toggle-visibility`);
      setGalleryItems(prev => prev.map(i => i._id === id ? { ...i, visible: !current } : i));
      toast.success(`Item ${!current ? "shown" : "hidden"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error toggling visibility");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedItems.length || !window.confirm(`Delete ${selectedItems.length} item(s)?`)) return;
    try {
      await api.post("/gallery/bulk/delete", { ids: selectedItems });
      toast.success(`${selectedItems.length} item(s) deleted`);
      setSelectedItems([]);
      fetchGallery();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting items");
    }
  };

  const toggleSelection = (id) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedItems(selectedItems.length === galleryItems.length ? [] : galleryItems.map(i => i._id));

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        .fade-up { animation: fadeUp .3s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaLayerGroup className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gallery Management</h1>
              <p className="text-xs text-gray-400">Manage hospital images, videos, and media content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
              <FaFolderPlus className="text-xs" /> Categories
            </button>
            <button onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-200 transition-colors">
              <FaPlus className="text-xs" /> Add Media
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Images"     value={stats.totalImages}     icon={FaImage}  accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Videos"     value={stats.totalVideos}     icon={FaVideo}  accent={{ bg:"bg-violet-50",  icon:"text-violet-500",  num:"text-violet-600"  }} />
          <StatCard label="Categories" value={stats.totalCategories} icon={FaFolder} accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="This Week"  value={stats.recentItems}     icon={FaClock}  accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by title, category…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { val: filterCategory, set: setFilterCategory, opts: [["all","All Categories"], ...categories.map(c=>[c,c])] },
                { val: filterType,     set: setFilterType,     opts: [["all","All Types"],["image","Images"],["video","Videos"]] },
                { val: sortBy,         set: setSortBy,         opts: [["newest","Newest"],["oldest","Oldest"],["alphabetical","A→Z"]] },
              ].map(({ val, set, opts }, i) => (
                <select key={i} value={val} onChange={e => set(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                {[["grid", FaTh], ["list", FaList]].map(([mode, Icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`p-2.5 cursor-pointer transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}>
                    <Icon className="text-sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>


          {selectedItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{selectedItems.length} selected</span>
                <button onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer underline">
                  {selectedItems.length === galleryItems.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 cursor-pointer transition-colors">
                  <FaTrash className="text-[10px]" /> Delete selected
                </button>
                <button onClick={() => setSelectedItems([])}
                  className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : galleryItems.length === 0 ? <Empty /> : viewMode === "grid" ? (

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
              {galleryItems.map(item => (
                <div key={item._id} className={`group relative bg-gray-50 border rounded-2xl overflow-hidden transition-all ${
                  selectedItems.includes(item._id) ? "border-blue-400 ring-2 ring-blue-300" : "border-gray-100 hover:shadow-md hover:border-gray-200"
                }`}>
               
                  <div onClick={() => toggleSelection(item._id)}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                      selectedItems.includes(item._id) ? "bg-blue-600 border-blue-600" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                    }`}>
                    {selectedItems.includes(item._id) && <FaCheckCircle className="text-white text-[10px]" />}
                  </div>

                  <div className="absolute top-2 right-2 z-10"><TypeBadge type={item.type} /></div>

                  <div className="relative h-40 bg-gray-100">
                    <img src={item.thumbnailUrl || item.fileUrl} alt={item.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = "none"; }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => handleToggleVisibility(item._id, item.visible)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 cursor-pointer" title={item.visible ? "Hide" : "Show"}>
                        {item.visible ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                      </button>
                      <button onClick={() => handleDeleteItem(item._id)}
                        className="p-2 bg-rose-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-rose-600 cursor-pointer">
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-xs truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400">{fmtDate(item.uploadDate)}</span>
                      <span className={`text-[10px] font-semibold ${item.visible ? "text-emerald-500" : "text-gray-400"}`}>
                        {item.visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            <div className="divide-y divide-gray-50">
              <div className="px-5 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-1">
                  <input type="checkbox"
                    checked={selectedItems.length === galleryItems.length && galleryItems.length > 0}
                    onChange={selectAll} className="w-4 h-4 rounded cursor-pointer" />
                </div>
                <div className="col-span-5">Title</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {galleryItems.map(item => (
                <div key={item._id} className={`px-5 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/80 transition-colors group ${selectedItems.includes(item._id) ? "bg-blue-50/50" : ""}`}>
                  <div className="col-span-1">
                    <input type="checkbox" checked={selectedItems.includes(item._id)}
                      onChange={() => toggleSelection(item._id)} className="w-4 h-4 rounded cursor-pointer" />
                  </div>
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <img src={item.thumbnailUrl || item.fileUrl} alt={item.title}
                      className="w-10 h-10 object-cover rounded-xl shrink-0"
                      onError={e => { e.target.style.display = "none"; }} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                      <p className={`text-[10px] font-medium ${item.visible ? "text-emerald-500" : "text-gray-400"}`}>
                        {item.visible ? "Visible" : "Hidden"}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-gray-500">{item.category || "—"}</div>
                  <div className="col-span-2"><TypeBadge type={item.type} /></div>
                  <div className="col-span-1 text-xs text-gray-400">{fmtDate(item.uploadDate)}</div>
                  <div className="col-span-1 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleVisibility(item._id, item.visible)}
                      className={`p-1.5 rounded-xl cursor-pointer transition-colors ${item.visible ? "text-emerald-500 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}>
                      {item.visible ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                    </button>
                    <button onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors">
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100">
                <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{galleryItems.length}</span> items</p>
              </div>
            </div>
          )}
        </div>
      </div>


      <Modal open={uploadModal} onClose={() => { setUploadModal(false); setUploadData(EMPTY_UPLOAD); }}
        title="Upload New Media" subtitle="Images and videos accepted">
        <div className="space-y-5">
          <Field label="Files" required>
            <label className="flex flex-col items-center gap-3 px-6 py-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors bg-gray-50/50">
              <FaUpload className={`text-2xl ${uploadData.files.length ? "text-blue-500" : "text-gray-300"}`} />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {uploadData.files.length ? `${uploadData.files.length} file(s) selected` : "Click to browse files"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Images and videos · max 50 MB each</p>
              </div>
              {uploadData.files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {uploadData.files.map((f, i) => (
                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">{f.name}</span>
                  ))}
                </div>
              )}
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </Field>

          <Field label="Title" required>
            <input value={uploadData.title} onChange={e => setUploadField("title", e.target.value)}
              placeholder="e.g., Staff Training Day 2025" className={inputCls} />
          </Field>

          <Field label="Description">
            <textarea value={uploadData.description} onChange={e => setUploadField("description", e.target.value)}
              placeholder="Brief description…" rows={3} className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select value={uploadData.category} onChange={e => setUploadField("category", e.target.value)} className={inputCls}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tags">
              <input value={uploadData.tags} onChange={e => setUploadField("tags", e.target.value)}
                placeholder="tag1, tag2" className={inputCls} />
            </Field>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" checked={uploadData.visible} onChange={e => setUploadField("visible", e.target.checked)} className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition-colors ${uploadData.visible ? "bg-blue-500" : "bg-gray-200"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${uploadData.visible ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
            <span className="text-sm text-gray-700 font-medium">Make visible on public gallery</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => { setUploadModal(false); setUploadData(EMPTY_UPLOAD); }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">Cancel</button>
            <button onClick={handleUploadSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer shadow-sm shadow-blue-200 transition-colors">
              {submitting ? <><FaSpinner className="animate-spin text-xs" />Uploading…</> : <><FaCheckCircle className="text-xs" />Upload Media</>}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)}
        title="Manage Categories" subtitle={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`} maxW="max-w-md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()}
              placeholder="New category name…" className={`${inputCls} flex-1`} />
            <button onClick={handleAddCategory} disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors shrink-0">
              {submitting ? <FaSpinner className="animate-spin" /> : "Add"}
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No categories yet</p>
            ) : categories.map(cat => (
              <div key={cat} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl group">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FaFolder className="text-blue-400 text-xs" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{cat}</span>
                </div>
                <button onClick={() => handleDeleteCategory(cat)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                  <FaTrash className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button onClick={() => setCategoryModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GalleryPage;
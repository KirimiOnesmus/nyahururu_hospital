import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaPlus, FaSearch, FaBullhorn, FaCalendarAlt, FaClock,
  FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaSave,
  FaCopy, FaBell, FaFileDownload, FaCheckCircle, FaUsers,
  FaFileAlt, FaPaperclip, FaFilter,
} from "react-icons/fa";
import api from "../../api/axios";
import { toast } from "react-toastify";

const CATEGORIES = ["General","Emergency","Event","System Update","Policy","Maintenance","Health Advisory"];
const AUDIENCES  = ["All","Staff","Patients","Doctors","Nurses","Public","Specific Department"];

const STATUS_CONFIG = {
  active:    { bg:"bg-emerald-100", text:"text-emerald-700", dot:"bg-emerald-500", icon: FaCheckCircle },
  scheduled: { bg:"bg-sky-100",     text:"text-sky-700",     dot:"bg-sky-500",     icon: FaClock       },
  expired:   { bg:"bg-gray-100",    text:"text-gray-600",    dot:"bg-gray-400",    icon: FaClock       },
  hidden:    { bg:"bg-rose-100",    text:"text-rose-700",    dot:"bg-rose-400",    icon: FaEyeSlash    },
};

const CAT_COLORS = {
  Emergency:     "bg-red-50 text-red-600",
  Event:         "bg-violet-50 text-violet-600",
  Maintenance:   "bg-orange-50 text-orange-600",
  Policy:        "bg-blue-50 text-blue-600",
  "System Update":"bg-indigo-50 text-indigo-600",
  "Health Advisory":"bg-teal-50 text-teal-600",
  General:       "bg-gray-50 text-gray-600",
};

const EMPTY_FORM = {
  title:"", category:"", audience:"", content:"",
  startDate:"", startTime:"", endDate:"", endTime:"",
  visible: true, sendNotification: false, attachments:[],
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";


const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${accent.num}`}>{value ?? 0}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const CatBadge = ({ category }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[category] || CAT_COLORS.General}`}>
    {category}
  </span>
);

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading notices…</p>
  </div>
);

const Empty = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <FaBullhorn className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">No notices found</p>
  </div>
);


const Modal = ({ open, onClose, title, subtitle, children, maxW = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
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

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white";


const NoticesManagement = () => {
  const [notices,         setNotices]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [submitting,      setSubmitting]       = useState(false);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [filterAudience,  setFilterAudience]  = useState("all");
  const [filterCategory,  setFilterCategory]  = useState("all");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [sortBy,          setSortBy]          = useState("newest");
  const [selectedNotices, setSelectedNotices] = useState([]);

  const [createModal,     setCreateModal]     = useState(false);
  const [detailsModal,    setDetailsModal]    = useState(false);
  const [selectedNotice,  setSelectedNotice]  = useState(null);
  const [formData,        setFormData]        = useState(EMPTY_FORM);


  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices");
      setNotices(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch notices");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);


  const stats = useMemo(() => ({
    total:     notices.length,
    active:    notices.filter(n => n.status === "active").length,
    scheduled: notices.filter(n => n.status === "scheduled").length,
    expired:   notices.filter(n => n.status === "expired").length,
  }), [notices]);


  const filteredNotices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return notices
      .filter(n => {
        const matchSearch =
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q);
        const matchAudience  = filterAudience  === "all" || n.audience  === filterAudience;
        const matchCategory  = filterCategory  === "all" || n.category  === filterCategory;
        const matchStatus    = filterStatus    === "all" || n.status    === filterStatus;
        return matchSearch && matchAudience && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest")      return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "oldest")      return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === "alphabetical")return a.title?.localeCompare(b.title);
        if (sortBy === "upcoming")    return new Date(a.startDate) - new Date(b.startDate);
        return 0;
      });
  }, [notices, searchTerm, filterAudience, filterCategory, filterStatus, sortBy]);

  const setField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const openCreate = (notice = null) => {

    if (notice) {
      setFormData({
        _id:             notice._id || notice.id,
        title:           notice.title           || "",
        category:        notice.category        || "",
        audience:        notice.audience        || "",
        content:         notice.content         || "",
        startDate:       notice.startDate       || "",
        startTime:       notice.startTime       || "",
        endDate:         notice.endDate         || "",
        endTime:         notice.endTime         || "",
        visible:         notice.visible         ?? true,
        sendNotification:notice.sendNotification ?? false,
        attachments:     notice.attachments     || [],
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setCreateModal(true);
  };

  const handleSaveNotice = async () => {
    if (!formData.title.trim())   { toast.error("Title is required"); return; }
    if (!formData.category)       { toast.error("Category is required"); return; }
    if (!formData.audience)       { toast.error("Audience is required"); return; }
    if (!formData.content.trim()) { toast.error("Content is required"); return; }
    if (!formData.startDate)      { toast.error("Start date is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        title:           formData.title.trim(),
        category:        formData.category,
        audience:        formData.audience,
        content:         formData.content.trim(),
        startDate:       formData.startDate,
        startTime:       formData.startTime,
        endDate:         formData.endDate,
        endTime:         formData.endTime,
        visible:         formData.visible,
        sendNotification:formData.sendNotification,
      };

      const id = formData._id;
      if (id) {
        await api.put(`/notices/${id}`, payload);
        toast.success("Notice updated");
      } else {
        await api.post("/notices", payload);
        toast.success("Notice created");
      }
      setCreateModal(false);
      setFormData(EMPTY_FORM);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);

      setNotices(prev => prev.filter(n => (n._id || n.id) !== id));
      setSelectedNotices(prev => prev.filter(i => i !== id));
      toast.success("Notice deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete notice");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await api.patch(`/notices/${id}/toggle-visibility`, {});

      setNotices(prev => prev.map(n => {
        const nid = n._id || n.id;
        return nid === id ? { ...n, visible: !n.visible, status: n.visible ? "hidden" : "active" } : n;
      }));
      toast.success("Visibility updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle visibility");
    }
  };

  const handleDuplicate = async (notice) => {
    const id = notice._id || notice.id;
    try {
      await api.post(`/notices/${id}/duplicate`, {});
      toast.success("Notice duplicated");
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate notice");
    }
  };


  const handleExport = () => {

    const csv = [
      ["Title","Category","Audience","Status","Start Date","End Date","Created By"],
      ...notices.map(n => [n.title, n.category, n.audience, n.status, n.startDate, n.endDate || "", n.createdBy || ""]),
    ].map(row => row.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "notices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const handleBulkDelete = async () => {
    if (!selectedNotices.length || !window.confirm(`Delete ${selectedNotices.length} notice(s)?`)) return;
    try {
      await api.post("/notices/bulk/delete", { ids: selectedNotices });
      toast.success(`${selectedNotices.length} notice(s) deleted`);
      setSelectedNotices([]);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete notices");
    }
  };

  const handleBulkHide = async () => {
    try {

      const results = await Promise.allSettled(
        selectedNotices.map(id => api.patch(`/notices/${id}/toggle-visibility`, {}))
      );
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed) toast.error(`${failed} notice(s) failed to update`);
      else toast.success("Visibility updated");
      setSelectedNotices([]);
      fetchNotices();
    } catch (err) {
      toast.error("Failed to update visibility");
    }
  };

  const nid = (n) => n._id || n.id;

  const toggleSelection = (id) =>
    setSelectedNotices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedNotices(selectedNotices.length === filteredNotices.length
      ? []
      : filteredNotices.map(nid)
    );

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
              <FaBullhorn className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notices & Announcements</h1>
              <p className="text-xs text-gray-400">Manage public notices and important announcements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
              <FaFileDownload className="text-xs" /> Export CSV
            </button>
            <button onClick={() => openCreate()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-200 transition-colors">
              <FaPlus className="text-xs" /> Create Notice
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total"     value={stats.total}     icon={FaBullhorn}    accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Active"    value={stats.active}    icon={FaCheckCircle} accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Scheduled" value={stats.scheduled} icon={FaClock}       accent={{ bg:"bg-sky-50",     icon:"text-sky-500",     num:"text-sky-600"     }} />
          <StatCard label="Expired"   value={stats.expired}   icon={FaCalendarAlt} accent={{ bg:"bg-gray-100",   icon:"text-gray-400",    num:"text-gray-600"    }} />
        </div>

 
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by title or content…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { val: filterAudience,  set: setFilterAudience,  opts: [["all","All Audiences"],  ...AUDIENCES.map(a=>[a,a])]  },
                { val: filterCategory,  set: setFilterCategory,  opts: [["all","All Categories"], ...CATEGORIES.map(c=>[c,c])] },
                { val: filterStatus,    set: setFilterStatus,    opts: [["all","All Status"],["active","Active"],["scheduled","Scheduled"],["expired","Expired"],["hidden","Hidden"]] },
                { val: sortBy,          set: setSortBy,          opts: [["newest","Newest"],["oldest","Oldest"],["alphabetical","A→Z"],["upcoming","Upcoming"]] },
              ].map(({ val, set, opts }, i) => (
                <select key={i} value={val} onChange={e => set(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
          </div>


          {(searchTerm || filterAudience !== "all" || filterCategory !== "all" || filterStatus !== "all") && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-700">{filteredNotices.length}</span> of {notices.length} notices
              </span>
              <button onClick={() => { setSearchTerm(""); setFilterAudience("all"); setFilterCategory("all"); setFilterStatus("all"); }}
                className="text-xs text-gray-400 hover:text-rose-500 cursor-pointer underline">Clear all</button>
            </div>
          )}

  
          {selectedNotices.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {selectedNotices.length} selected
                </span>
                <button onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer underline">
                  {selectedNotices.length === filteredNotices.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleBulkHide}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  Toggle Visibility
                </button>
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 cursor-pointer transition-colors">
                  <FaTrash className="text-[10px]" /> Delete
                </button>
                <button onClick={() => setSelectedNotices([])}
                  className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>

   
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : filteredNotices.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-4 text-left">
                      <input type="checkbox"
                        checked={selectedNotices.length === filteredNotices.length && filteredNotices.length > 0}
                        onChange={selectAll}
                        className="w-4 h-4 rounded cursor-pointer" />
                    </th>
                    {["Title", "Category", "Audience", "Start", "End", "Status", ""].map((h, i) => (
                      <th key={i} className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>
                        {h || "Actions"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredNotices.map(notice => {
                    const id = nid(notice);
                    return (
                      <tr key={id} className={`hover:bg-gray-50/80 transition-colors group ${selectedNotices.includes(id) ? "bg-blue-50/40" : ""}`}>

                        <td className="px-5 py-4">
                          <input type="checkbox"
                            checked={selectedNotices.includes(id)}
                            onChange={() => toggleSelection(id)}
                            className="w-4 h-4 rounded cursor-pointer" />
                        </td>

                
                        <td className="px-5 py-4 max-w-xs">
                          <p className="font-semibold text-gray-900 truncate">{notice.title}</p>
                          {notice.createdBy && (
                            <p className="text-[10px] text-gray-400 mt-0.5">By {notice.createdBy}</p>
                          )}
                        </td>

                        <td className="px-5 py-4"><CatBadge category={notice.category} /></td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <FaUsers className="text-gray-300 shrink-0" />{notice.audience}
                          </span>
                        </td>

                      
                        <td className="px-5 py-4 text-xs text-gray-600">{fmtDate(notice.startDate)}</td>

                 
                        <td className="px-5 py-4 text-xs text-gray-500">{notice.endDate ? fmtDate(notice.endDate) : "—"}</td>

            
                        <td className="px-5 py-4"><StatusBadge status={notice.status} /></td>

                   
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedNotice(notice); setDetailsModal(true); }}
                              className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View">
                              <FaEye className="text-sm" />
                            </button>
                            <button onClick={() => openCreate(notice)}
                              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit">
                              <FaEdit className="text-sm" />
                            </button>
                            <button onClick={() => handleToggleVisibility(id)}
                              className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 cursor-pointer transition-colors" title="Toggle visibility">
                              {notice.visible ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                            </button>
                            <button onClick={() => handleDuplicate(notice)}
                              className="p-2 rounded-xl text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors" title="Duplicate">
                              <FaCopy className="text-sm" />
                            </button>
                            <button onClick={() => handleDeleteNotice(id)}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete">
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filteredNotices.length}</span> of <span className="font-semibold text-gray-600">{notices.length}</span> notices
                </p>
              </div>
            </div>
          )}
        </div>
      </div>


      <Modal open={detailsModal} onClose={() => setDetailsModal(false)}
        title={selectedNotice?.title || "Notice Details"}
        subtitle={selectedNotice ? `By ${selectedNotice.createdBy || "Unknown"} · ${fmtDate(selectedNotice.createdAt)}` : ""}
        maxW="max-w-3xl">
        {selectedNotice && (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              <StatusBadge status={selectedNotice.status} />
              <CatBadge category={selectedNotice.category} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label:"Audience",   icon: FaUsers,       value: selectedNotice.audience },
                { label:"Start Date", icon: FaCalendarAlt, value: fmtDate(selectedNotice.startDate) },
                { label:"End Date",   icon: FaCalendarAlt, value: selectedNotice.endDate ? fmtDate(selectedNotice.endDate) : "No expiry" },
                { label:"Visible",    icon: FaEye,         value: selectedNotice.visible ? "Yes" : "No" },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Icon className="text-[10px]" />{label}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FaFileAlt className="text-[10px]" />Content
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
            </div>

            {selectedNotice.attachments?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaPaperclip className="text-[10px]" />Attachments
                </p>
                <div className="space-y-2">
                  {selectedNotice.attachments.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl">
                      <span className="text-xs text-gray-700">{f.name}</span>
                      <button className="text-xs text-blue-600 hover:underline cursor-pointer">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setDetailsModal(false)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                Close
              </button>
              <button onClick={() => handleDuplicate(selectedNotice)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 cursor-pointer transition-colors">
                <FaCopy className="text-xs" /> Duplicate
              </button>
              <button onClick={() => { setDetailsModal(false); openCreate(selectedNotice); }}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition-colors">
                <FaEdit className="text-xs" /> Edit
              </button>
            </div>
          </>
        )}
      </Modal>


      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setFormData(EMPTY_FORM); }}
        title={formData._id ? "Edit Notice" : "Create New Notice"}
        subtitle={formData._id ? "Update notice details" : "Publish a new announcement"}
        maxW="max-w-3xl"
      >
        <div className="space-y-5">
          <Field label="Notice Title" required>
            <input value={formData.title} onChange={e => setField("title", e.target.value)}
              placeholder="e.g., Hospital Closure — Public Holiday" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select value={formData.category} onChange={e => setField("category", e.target.value)} className={inputCls}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Audience" required>
              <select value={formData.audience} onChange={e => setField("audience", e.target.value)} className={inputCls}>
                <option value="">Select Audience</option>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Content" required>
            <textarea value={formData.content} onChange={e => setField("content", e.target.value)}
              placeholder="Enter the full notice text…" rows={6} className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <input type="date" value={formData.startDate} onChange={e => setField("startDate", e.target.value)} className={inputCls} />
            </Field>
            <Field label="End Date">
              <input type="date" value={formData.endDate} onChange={e => setField("endDate", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time">
              <input type="time" value={formData.startTime} onChange={e => setField("startTime", e.target.value)} className={inputCls} />
            </Field>
            <Field label="End Time">
              <input type="time" value={formData.endTime} onChange={e => setField("endTime", e.target.value)} className={inputCls} />
            </Field>
          </div>


          <Field label="Attachments (optional)">
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaPaperclip className="text-gray-300 text-lg shrink-0" />
              <span className="text-sm text-gray-400">Click to upload PDFs or images</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
            </label>
          </Field>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { key:"visible",          label:"Make this notice visible immediately" },
              { key:"sendNotification", label:"Send notification to audience" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setField(key, !formData[key])} className="relative">
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData[key] ? "bg-blue-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData[key] ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => { setCreateModal(false); setFormData(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveNotice} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer shadow-sm shadow-blue-200 transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FaSave className="text-xs" />{formData._id ? "Update Notice" : "Create Notice"}</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticesManagement;
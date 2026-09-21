import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import {
  FaPlus, FaBullhorn, FaCalendarAlt, FaClock,
  FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaSave,
  FaCopy, FaBell, FaFileDownload, FaCheckCircle, FaUsers,
  FaFileAlt, FaPaperclip, FaFilter,
} from "react-icons/fa";
import api from "../../api/axios";
import notify from "../../common/utils/notify";
import {
  Button, DataTable, Modal, PageHeader, SearchBox,
  Spinner, EmptyState, StatCard, StatusBadge as SharedStatusBadge,
  Input, TextArea, Select, FormField,
} from "../../common/components";

const CATEGORIES = ["General","Emergency","Event","System Update","Policy","Maintenance","Health Advisory"];
const AUDIENCES  = ["All","Staff","Patients","Doctors","Nurses","Public","Specific Department"];

const STATUS_CONFIG = {
  active:    { bg:"bg-emerald-100", text:"text-emerald-700", dot:"bg-emerald-500", icon: FaCheckCircle },
  scheduled: { bg:"bg-sky-100",     text:"text-sky-700",     dot:"bg-sky-500",     icon: FaClock       },
  expired:   { bg:"bg-gray-100",    text:"text-gray-600",    dot:"bg-gray-400",    icon: FaClock       },
  hidden:    { bg:"bg-rose-100",    text:"text-rose-700",    dot:"bg-rose-400",    icon: FaEyeSlash    },
};

const CAT_COLORS = {
  Emergency:       "bg-red-50 text-red-600",
  Event:           "bg-violet-50 text-violet-600",
  Maintenance:     "bg-orange-50 text-orange-600",
  Policy:          "bg-blue-50 text-blue-600",
  "System Update": "bg-indigo-50 text-indigo-600",
  "Health Advisory":"bg-teal-50 text-teal-600",
  General:         "bg-gray-50 text-gray-600",
};

const EMPTY_FORM = {
  title:"", category:"", audience:"", content:"",
  startDate:"", startTime:"", endDate:"", endTime:"",
  visible: true, sendNotification: false, attachments:[],
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const LocalStatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return <SharedStatusBadge status={status} colors={{ bg: c.bg, text: c.text, dot: c.dot }} icon={c.icon} />;
};

const CatBadge = ({ category }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[category] || CAT_COLORS.General}`}>
    {category}
  </span>
);


const NoticesManagement = () => {
  const [notices,         setNotices]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
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
      notify.error(err.response?.data?.message || "Failed to fetch notices");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  // Real-time updates via Socket.IO
  useSocket("notices:created", fetchNotices);
  useSocket("notices:updated", fetchNotices);
  useSocket("notices:deleted", fetchNotices);

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
        const matchSearch = n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
        const matchAudience  = filterAudience  === "all" || n.audience  === filterAudience;
        const matchCategory  = filterCategory  === "all" || n.category  === filterCategory;
        const matchStatus    = filterStatus    === "all" || n.status    === filterStatus;
        return matchSearch && matchAudience && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest")       return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "oldest")       return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === "alphabetical") return a.title?.localeCompare(b.title);
        if (sortBy === "upcoming")     return new Date(a.startDate) - new Date(b.startDate);
        return 0;
      });
  }, [notices, searchTerm, filterAudience, filterCategory, filterStatus, sortBy]);

  const setField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const openCreate = (notice = null) => {
    if (notice) {
      setFormData({
        id:              notice.id,
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
    if (!formData.title.trim())   { notify.error("Title is required"); return; }
    if (!formData.category)       { notify.error("Category is required"); return; }
    if (!formData.audience)       { notify.error("Audience is required"); return; }
    if (!formData.content.trim()) { notify.error("Content is required"); return; }
    if (!formData.startDate)      { notify.error("Start date is required"); return; }

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
      if (formData.id) {
        await api.put(`/notices/${formData.id}`, payload);
        notify.success("Notice updated");
      } else {
        await api.post("/notices", payload);
        notify.success("Notice created");
      }
      setCreateModal(false);
      setFormData(EMPTY_FORM);
      fetchNotices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices(prev => prev.filter(n => n.id !== id));
      setSelectedNotices(prev => prev.filter(i => i !== id));
      notify.success("Notice deleted");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete notice");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await api.patch(`/notices/${id}/toggle-visibility`, {});
      setNotices(prev => prev.map(n => n.id === id ? { ...n, visible: !n.visible, status: n.visible ? "hidden" : "active" } : n));
      notify.success("Visibility updated");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to toggle visibility");
    }
  };

  const handleDuplicate = async (notice) => {
    try {
      await api.post(`/notices/${notice.id}/duplicate`, {});
      notify.success("Notice duplicated");
      fetchNotices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to duplicate notice");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Title","Category","Audience","Status","Start Date","End Date","Created By"],
      ...notices.map(n => [n.title, n.category, n.audience, n.status, n.startDate, n.endDate || "", n.creator?.name || n.createdBy || ""]),
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
    notify.success("Exported successfully");
  };

  const handleBulkDelete = async () => {
    if (!selectedNotices.length || !window.confirm(`Delete ${selectedNotices.length} notice(s)?`)) return;
    try {
      await api.post("/notices/bulk/delete", { ids: selectedNotices });
      notify.success(`${selectedNotices.length} notice(s) deleted`);
      setSelectedNotices([]);
      fetchNotices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete notices");
    }
  };

  const handleBulkHide = async () => {
    try {
      const results = await Promise.allSettled(selectedNotices.map(id => api.patch(`/notices/${id}/toggle-visibility`, {})));
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed) notify.error(`${failed} notice(s) failed to update`);
      else notify.success("Visibility updated");
      setSelectedNotices([]);
      fetchNotices();
    } catch (err) {
      notify.error("Failed to update visibility");
    }
  };

  const nid = (n) => n.id;

  const toggleSelection = (id) =>
    setSelectedNotices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedNotices(selectedNotices.length === filteredNotices.length ? [] : filteredNotices.map(nid));

  const columns = [
    {
      key: "checkbox", label: "",
      render: (notice) => (
        <input type="checkbox" checked={selectedNotices.includes(nid(notice))} onChange={() => toggleSelection(nid(notice))} className="w-4 h-4 rounded cursor-pointer" />
      ),
      headerClassName: "w-10",
    },
    {
      key: "title", label: "Title",
      render: (notice) => (
        <div className="max-w-xs">
          <p className="font-semibold text-gray-900 truncate">{notice.title}</p>
          {(notice.creator?.name || notice.createdBy) && (
            <p className="text-[10px] text-gray-400 mt-0.5">By {notice.creator?.name || notice.createdBy}</p>
          )}
        </div>
      ),
    },
    {
      key: "category", label: "Category",
      render: (notice) => <CatBadge category={notice.category} />,
    },
    {
      key: "audience", label: "Audience",
      render: (notice) => (
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaUsers className="text-gray-300 shrink-0" />{notice.audience}
        </span>
      ),
    },
    { key: "startDate", label: "Start", render: (n) => <span className="text-xs text-gray-600">{fmtDate(n.startDate)}</span> },
    { key: "endDate",   label: "End",   render: (n) => <span className="text-xs text-gray-500">{n.endDate ? fmtDate(n.endDate) : "—"}</span> },
    { key: "status",    label: "Status", render: (n) => <LocalStatusBadge status={n.status} /> },
    {
      key: "actions", label: "Actions", align: "right",
      render: (notice) => (
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setSelectedNotice(notice); setDetailsModal(true); }} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View">
            <FaEye className="text-sm" />
          </button>
          <button onClick={() => openCreate(notice)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit">
            <FaEdit className="text-sm" />
          </button>
          <button onClick={() => handleToggleVisibility(nid(notice))} className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 cursor-pointer transition-colors" title="Toggle visibility">
            {notice.visible ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
          </button>
          <button onClick={() => handleDuplicate(notice)} className="p-2 rounded-xl text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors" title="Duplicate">
            <FaCopy className="text-sm" />
          </button>
          <button onClick={() => handleDeleteNotice(nid(notice))} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete">
            <FaTrash className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <PageHeader
          title="Notices & Announcements"
          subtitle="Manage public notices and important announcements"
          icon={FaBullhorn}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" icon={FaFileDownload} onClick={handleExport}>Export CSV</Button>
              <Button icon={FaPlus} onClick={() => openCreate()}>Create Notice</Button>
            </div>
          }
        />


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total"     value={stats.total}     icon={FaBullhorn}    accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Active"    value={stats.active}    icon={FaCheckCircle} accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Scheduled" value={stats.scheduled} icon={FaClock}       accent={{ bg:"bg-sky-50",     icon:"text-sky-500",     num:"text-sky-600"     }} />
          <StatCard label="Expired"   value={stats.expired}   icon={FaCalendarAlt} accent={{ bg:"bg-gray-100",   icon:"text-gray-400",    num:"text-gray-600"    }} />
        </div>

   
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchBox
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder="Search by title or content…"
              className="flex-1"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { val: filterAudience, set: setFilterAudience, opts: [["all","All Audiences"], ...AUDIENCES.map(a=>[a,a])] },
                { val: filterCategory, set: setFilterCategory, opts: [["all","All Categories"], ...CATEGORIES.map(c=>[c,c])] },
                { val: filterStatus,   set: setFilterStatus,   opts: [["all","All Status"],["active","Active"],["scheduled","Scheduled"],["expired","Expired"],["hidden","Hidden"]] },
                { val: sortBy,         set: setSortBy,         opts: [["newest","Newest"],["oldest","Oldest"],["alphabetical","A→Z"],["upcoming","Upcoming"]] },
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
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{selectedNotices.length} selected</span>
                <button onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer underline">
                  {selectedNotices.length === filteredNotices.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleBulkHide}>Toggle Visibility</Button>
                <Button variant="danger" size="sm" icon={FaTrash} onClick={handleBulkDelete}>Delete</Button>
                <button onClick={() => setSelectedNotices([])} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner text="Loading notices…" />
        ) : filteredNotices.length === 0 ? (
          <EmptyState text="No notices found" icon={FaBullhorn} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredNotices}
              rowKey={(n) => nid(n)}
            />
            <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filteredNotices.length}</span> of <span className="font-semibold text-gray-600">{notices.length}</span> notices
              </p>
            </div>
          </>
        )}
      </div>


      <Modal
        open={detailsModal}
        onClose={() => setDetailsModal(false)}
        title={selectedNotice?.title || "Notice Details"}
        subtitle={selectedNotice ? `By ${selectedNotice.creator?.name || selectedNotice.createdBy || "Unknown"} · ${fmtDate(selectedNotice.createdAt)}` : ""}
        size="xl"
      >
        {selectedNotice && (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              <LocalStatusBadge status={selectedNotice.status} />
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

            {(() => { const att = typeof selectedNotice.attachments === "string" ? JSON.parse(selectedNotice.attachments) : (selectedNotice.attachments || []); return att.length > 0 ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaPaperclip className="text-[10px]" />Attachments
                </p>
                <div className="space-y-2">
                  {att.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl">
                      <span className="text-xs text-gray-700">{f.name}</span>
                      <button className="text-xs text-blue-600 hover:underline cursor-pointer">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null; })()}

            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setDetailsModal(false)}>Close</Button>
              <Button variant="primary" className="bg-violet-600 hover:bg-violet-700" icon={FaCopy} onClick={() => handleDuplicate(selectedNotice)}>Duplicate</Button>
              <Button icon={FaEdit} onClick={() => { setDetailsModal(false); openCreate(selectedNotice); }}>Edit</Button>
            </div>
          </>
        )}
      </Modal>


      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setFormData(EMPTY_FORM); }}
        title={formData.id ? "Edit Notice" : "Create New Notice"}
        subtitle={formData.id ? "Update notice details" : "Publish a new announcement"}
        size="xl"
      >
        <div className="space-y-5">
          <Input
            label="Notice Title"
            required
            value={formData.title}
            onChange={e => setField("title", e.target.value)}
            placeholder="e.g., Hospital Closure — Public Holiday"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              required
              value={formData.category}
              onChange={e => setField("category", e.target.value)}
              placeholder="Select Category"
              options={CATEGORIES}
            />
            <Select
              label="Audience"
              required
              value={formData.audience}
              onChange={e => setField("audience", e.target.value)}
              placeholder="Select Audience"
              options={AUDIENCES}
            />
          </div>

          <TextArea
            label="Content"
            required
            value={formData.content}
            onChange={e => setField("content", e.target.value)}
            placeholder="Enter the full notice text…"
            rows={6}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" required type="date" value={formData.startDate} onChange={e => setField("startDate", e.target.value)} />
            <Input label="End Date" type="date" value={formData.endDate} onChange={e => setField("endDate", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" value={formData.startTime} onChange={e => setField("startTime", e.target.value)} />
            <Input label="End Time" type="time" value={formData.endTime} onChange={e => setField("endTime", e.target.value)} />
          </div>

          <FormField label="Attachments (optional)">
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaPaperclip className="text-gray-300 text-lg shrink-0" />
              <span className="text-sm text-gray-400">Click to upload PDFs or images</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
            </label>
          </FormField>

    
          <div className="space-y-3">
            {[
              { key:"visible",          label:"Make this notice visible immediately" },
              { key:"sendNotification", label:"Send notification to audience" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setField(key, !formData[key])} className="relative">
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData[key] ? "bg-blue-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData[key] ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setCreateModal(false); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button icon={FaSave} loading={submitting} loadingText="Saving…" onClick={handleSaveNotice}>
              {formData.id ? "Update Notice" : "Create Notice"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticesManagement;

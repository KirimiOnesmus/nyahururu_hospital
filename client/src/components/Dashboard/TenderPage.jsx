import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import {
  FaPlus, FaSearch, FaFilter, FaGavel, FaCalendarAlt, FaClock,
  FaEdit, FaTrash, FaEye, FaTimes, FaSave, FaFileDownload,
  FaCheckCircle, FaClipboardList, FaFileAlt, FaPaperclip, FaAward,
  FaExclamationTriangle, FaBan, FaHourglass, FaUsers, FaDollarSign,
  FaChartLine, FaFileContract, FaBullhorn,
} from "react-icons/fa";
import api from "../../api/axios";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge as SharedStatusBadge, Avatar, DataTable,
} from "../../common/components";



const CATEGORIES = [
  "Medical Equipment","Drugs & Pharmaceuticals","ICT Services",
  "Construction","Maintenance","Consultancy","Laboratory Supplies",
  "Food Services","Others",
];

const STATUS_CONFIG = {
  draft:            { bg:"bg-gray-100",    text:"text-gray-600",    dot:"bg-gray-400",    icon: FaFileAlt,    label:"Draft"            },
  active:           { bg:"bg-emerald-100", text:"text-emerald-700", dot:"bg-emerald-500", icon: FaCheckCircle,label:"Active"            },
  closed:           { bg:"bg-rose-100",    text:"text-rose-700",    dot:"bg-rose-400",    icon: FaBan,        label:"Closed"           },
  under_evaluation: { bg:"bg-amber-100",   text:"text-amber-700",   dot:"bg-amber-400",   icon: FaHourglass,  label:"Under Evaluation" },
  awarded:          { bg:"bg-sky-100",     text:"text-sky-700",     dot:"bg-sky-500",     icon: FaAward,      label:"Awarded"          },
  cancelled:        { bg:"bg-rose-100",    text:"text-rose-700",    dot:"bg-rose-400",    icon: FaTimes,      label:"Cancelled"        },
};

const CAT_COLORS = {
  "Medical Equipment":       "bg-blue-50 text-blue-600",
  "Drugs & Pharmaceuticals": "bg-violet-50 text-violet-600",
  "ICT Services":            "bg-cyan-50 text-cyan-600",
  Construction:              "bg-orange-50 text-orange-600",
  Maintenance:               "bg-emerald-50 text-emerald-600",
  Consultancy:               "bg-indigo-50 text-indigo-600",
  "Laboratory Supplies":     "bg-pink-50 text-pink-600",
  "Food Services":           "bg-amber-50 text-amber-600",
};

const scfg  = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.draft;
const catCls = (c) => CAT_COLORS[c] || "bg-gray-50 text-gray-600";

const generateTenderNumber = () => {
  const year   = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `TND-${year}-${random}`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const fmtCurrency = (amount) =>
  amount ? new Intl.NumberFormat("en-KE", { style:"currency", currency:"KES" }).format(amount) : "—";

const toInputDate = (d) => d ? new Date(d).toISOString().split("T")[0] : "";

const EMPTY_FORM = () => ({
  title:"", tenderNumber: generateTenderNumber(), category:"", description:"",
  scopeOfWork:"", eligibilityCriteria:"", requiredDocuments:"", deliverables:"",
  budgetMin:"", budgetMax:"",
  publicationDate: new Date().toISOString().split("T")[0],
  submissionDeadline:"", evaluationDate:"",
  visibility:"public", status:"draft", attachments: null,
});

const LocalStatusBadge = ({ status }) => {
  const c = scfg(status);
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />
      {c.label}
    </span>
  );
};








const DetailItem = ({ icon: Icon, label, value, full = false }) => (
  <div className={`bg-gray-50 rounded-xl p-4 ${full ? "col-span-2" : ""}`}>
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
      <Icon className="text-[10px]" />{label}
    </p>
    <p className="text-sm text-gray-800 leading-relaxed">{value || "—"}</p>
  </div>
);


const SectionHead = ({ icon: Icon, label }) => (
  <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4 pt-5 border-t border-gray-100 first:pt-0 first:border-0">
    <Icon className="text-blue-500" />{label}
  </h3>
);


const TenderPage = () => {
  const [tenders,         setTenders]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [submitting,      setSubmitting]       = useState(false);
  const [stats,           setStats]           = useState({ total:0, active:0, closed:0, underEvaluation:0, awarded:0 });
  const [searchTerm,      setSearchTerm]      = useState("");
  const [filterCategory,  setFilterCategory]  = useState("all");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [sortBy,          setSortBy]          = useState("newest");
  const [selectedTenders, setSelectedTenders] = useState([]);

  const [createModal,    setCreateModal]    = useState(false);
  const [detailsModal,   setDetailsModal]   = useState(false);
  const [bidsModal,      setBidsModal]      = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [bids,           setBids]           = useState([]);
  const [bidsLoading,    setBidsLoading]    = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM());


  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search:   searchTerm    || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status:   filterStatus  !== "all" ? filterStatus   : undefined,
        sortBy,
      };
      const res = await api.get("/tenders", { params });
     
      if (res.data.success) {
        setTenders(res.data.data || []);
        setStats(res.data.stats || {});
      } else {
        setTenders(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching tenders");
      setTenders([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory, filterStatus, sortBy]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  // Real-time updates via Socket.IO
  useSocket("tenders:created", fetchTenders);
  useSocket("tenders:updated", fetchTenders);
  useSocket("tenders:deleted", fetchTenders);

  const fetchBids = async (tenderId) => {
    setBidsLoading(true);
    setBids([]);
    try {
      const res = await api.get(`/bids/tender/${tenderId}`);
      setBids(res.data.success ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      notify.error("Error fetching bids");
    } finally {
      setBidsLoading(false);
    }
  };


  const setField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const resetForm = () => setFormData(EMPTY_FORM());

  const openCreate = (tender = null) => {
    if (tender) {

      setFormData({
        id:                tender.id,
        title:              tender.title              || "",
        tenderNumber:       tender.tenderNumber       || "",
        category:           tender.category           || "",
        description:        tender.description        || "",
        scopeOfWork:        tender.scopeOfWork        || "",
        eligibilityCriteria:tender.eligibilityCriteria|| "",
        requiredDocuments:  tender.requiredDocuments  || "",
        deliverables:       tender.deliverables       || "",
        budgetMin:          tender.budgetMin          || "",
        budgetMax:          tender.budgetMax          || "",
        publicationDate:    toInputDate(tender.publicationDate),
        submissionDeadline: toInputDate(tender.submissionDeadline),
        evaluationDate:     toInputDate(tender.evaluationDate),
        visibility:         tender.visibility         || "public",
        status:             tender.status             || "draft",
        attachments:        null,
      });
    } else {
      resetForm();
    }
    setCreateModal(true);
  };

  const handleSaveTender = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())   { notify.error("Title is required"); return; }
    if (!formData.category)       { notify.error("Category is required"); return; }
    if (!formData.description.trim()) { notify.error("Description is required"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();

      const skip = new Set(["id", "attachments"]);
      Object.entries(formData).forEach(([k, v]) => {
        if (!skip.has(k) && v !== null && v !== undefined) fd.append(k, v);
      });
      if (formData.attachments) {
        Array.from(formData.attachments).forEach(f => fd.append("attachments", f));
      }

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };
      const res = formData.id
        ? await api.put(`/tenders/${formData.id}`, fd, cfg)
        : await api.post("/tenders", fd, cfg);

      if (res.data.success || res.status === 200 || res.status === 201) {
        notify.success(`Tender ${formData.id ? "updated" : "created"} successfully`);
        setCreateModal(false);
        resetForm();
        fetchTenders();
      }
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving tender");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTender = async (id) => {
    if (!window.confirm("Delete this tender?")) return;
    try {
      await api.delete(`/tenders/${id}`);
  
      setTenders(prev => prev.filter(t => t.id !== id));
      setSelectedTenders(prev => prev.filter(i => i !== id));
      notify.success("Tender deleted");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting tender");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedTenders.length || !window.confirm(`Delete ${selectedTenders.length} tender(s)?`)) return;
    try {
      await api.post("/tenders/bulk-delete", { ids: selectedTenders });
      notify.success(`${selectedTenders.length} tender(s) deleted`);
      setSelectedTenders([]);
      fetchTenders();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting tenders");
    }
  };

  const handleCloseTender = async (tender) => {
    if (!window.confirm(`Close tender: "${tender.title}"?`)) return;
    try {
      await api.patch(`/tenders/${tender.id}/close`);
      notify.success("Tender closed");
      setDetailsModal(false);
  
      setTenders(prev => prev.map(t => t.id === tender.id ? { ...t, status:"closed" } : t));
    } catch (err) {
      notify.error("Error closing tender");
    }
  };

  const handleExtendDeadline = async (tender) => {
    const defaultDate = toInputDate(tender.submissionDeadline);
    const newDeadline = prompt("Enter new deadline (YYYY-MM-DD):", defaultDate);
    if (!newDeadline) return;
    if (isNaN(Date.parse(newDeadline))) { notify.error("Invalid date format. Use YYYY-MM-DD."); return; }
    try {
      await api.patch(`/tenders/${tender.id}/extend-deadline`, { newDeadline });
      notify.success("Deadline extended");
      setTenders(prev => prev.map(t => t.id === tender.id ? { ...t, submissionDeadline: newDeadline } : t));
      if (selectedTender?.id === tender.id) setSelectedTender(p => ({ ...p, submissionDeadline: newDeadline }));
    } catch (err) {
      notify.error("Error extending deadline");
    }
  };

  const handleAwardTender = async (tender, vendorId) => {
    if (!window.confirm("Award this tender to the selected vendor?")) return;
    try {
      await api.patch(`/tenders/${tender.id}/award`, { awardedTo: vendorId });
      notify.success("Tender awarded");
      setBidsModal(false);
      setTenders(prev => prev.map(t => t.id === tender.id ? { ...t, status:"awarded" } : t));
    } catch (err) {
      notify.error("Error awarding tender");
    }
  };


  const handleExport = () => {
    const csv = [
      ["Tender Number","Title","Category","Status","Publication Date","Deadline","Budget Min","Budget Max"],
      ...tenders.map(t => [
        t.tenderNumber, t.title, t.category, t.status,
        fmtDate(t.publicationDate), fmtDate(t.submissionDeadline),
        t.budgetMin || "", t.budgetMax || "",
      ]),
    ].map(row => row.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tenders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    notify.success("Exported successfully");
  };

  const toggleSelection  = (id) => setSelectedTenders(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
  const selectAll        = ()   => setSelectedTenders(selectedTenders.length === tenders.length ? [] : tenders.map(t=>t.id));

  return (
    <div className="min-h-screen bg-canvas">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

  
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaGavel className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tender Management</h1>
              <p className="text-xs text-gray-400">Manage procurement tenders and bids</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <FaFileDownload className="text-xs" /> Export CSV
            </button>
            <button onClick={() => openCreate()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer  transition-colors">
              <FaPlus className="text-xs" /> Create Tender
            </button>
          </div>
        </div>

       
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total"      value={stats.total}           icon={FaGavel}       onClick={() => setFilterStatus("all")}              accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Active"     value={stats.active}          icon={FaCheckCircle} onClick={() => setFilterStatus("active")}            accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Closed"     value={stats.closed}          icon={FaBan}         onClick={() => setFilterStatus("closed")}            accent={{ bg:"bg-rose-50",    icon:"text-rose-500",    num:"text-rose-600"    }} />
          <StatCard label="Evaluating" value={stats.underEvaluation} icon={FaHourglass}   onClick={() => setFilterStatus("under_evaluation")} accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
          <StatCard label="Awarded"    value={stats.awarded}         icon={FaAward}       onClick={() => setFilterStatus("awarded")}          accent={{ bg:"bg-sky-50",     icon:"text-sky-500",     num:"text-sky-600"     }} />
        </div>

   
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by title, tender number, or description…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { val: filterCategory, set: setFilterCategory, opts: [["all","All Categories"], ...CATEGORIES.map(c=>[c,c])] },
                { val: filterStatus,   set: setFilterStatus,   opts: [["all","All Status"],["draft","Draft"],["active","Active"],["closed","Closed"],["under_evaluation","Under Evaluation"],["awarded","Awarded"],["cancelled","Cancelled"]] },
                { val: sortBy,         set: setSortBy,         opts: [["newest","Latest"],["oldest","Oldest"],["alphabetical","A→Z"],["deadline","Deadline Soon"]] },
              ].map(({ val, set, opts }, i) => (
                <select key={i} value={val} onChange={e => set(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
          </div>

     
          {selectedTenders.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{selectedTenders.length} selected</span>
                <button onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer underline">
                  {selectedTenders.length === tenders.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 cursor-pointer transition-colors">
                  <FaTrash className="text-[10px]" /> Delete
                </button>
                <button onClick={() => setSelectedTenders([])}
                  className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>

    
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? <Spinner text="Loading tenders…" /> : tenders.length === 0 ? (
            <EmptyState text="No tenders found matching your criteria" />
          ) : (
            <>
              <DataTable
                columns={[
                  {
                    key: "checkbox", label: "",
                    render: (t) => <input type="checkbox" checked={selectedTenders.includes(t.id)} onChange={() => toggleSelection(t.id)} className="w-4 h-4 rounded cursor-pointer" />,
                    headerClassName: "w-10",
                  },
                  {
                    key: "tender", label: "Tender",
                    render: (t) => (
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-900 truncate">{t.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.tenderNumber}</p>
                      </div>
                    ),
                  },
                  {
                    key: "category", label: "Category",
                    render: (t) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catCls(t.category)}`}>{t.category}</span>,
                  },
                  { key: "published", label: "Published", render: (t) => <span className="text-xs text-gray-600">{fmtDate(t.publicationDate)}</span> },
                  {
                    key: "deadline", label: "Deadline",
                    render: (t) => <span className="flex items-center gap-1.5 text-xs text-gray-600"><FaClock className="text-gray-300 shrink-0" />{fmtDate(t.submissionDeadline)}</span>,
                  },
                  {
                    key: "bids", label: "Bids",
                    render: (t) => (
                      <button onClick={() => { setSelectedTender(t); fetchBids(t.id); setBidsModal(true); }}
                        disabled={t.status === "draft"}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer">
                        <FaClipboardList className="text-[10px]" />{t.bidsCount ?? 0} Bids
                      </button>
                    ),
                  },
                  { key: "status", label: "Status", render: (t) => <LocalStatusBadge status={t.status} /> },
                  {
                    key: "actions", label: "Actions", align: "right",
                    render: (tender) => (
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedTender(tender); setDetailsModal(true); }} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View"><FaEye className="text-sm" /></button>
                        {(tender.status === "draft" || tender.status === "active") && (
                          <button onClick={() => openCreate(tender)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit"><FaEdit className="text-sm" /></button>
                        )}
                        {tender.status === "active" && (
                          <>
                            <button onClick={() => handleExtendDeadline(tender)} className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors" title="Extend Deadline"><FaClock className="text-sm" /></button>
                            <button onClick={() => handleCloseTender(tender)} className="p-2 rounded-xl text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors" title="Close Tender"><FaBan className="text-sm" /></button>
                          </>
                        )}
                        <button onClick={() => handleDeleteTender(tender.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete"><FaTrash className="text-sm" /></button>
                      </div>
                    ),
                  },
                ]}
                data={tenders}
                rowKey={(t) => t.id}
              />
              <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
                <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{tenders.length}</span> tenders</p>
              </div>
            </>
          )}
        </div>
      </div>

      
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); resetForm(); }}
        title={formData.id ? "Edit Tender" : "Create New Tender"}
        size="2xl"
      >
        <form onSubmit={handleSaveTender} className="space-y-4">
          <SectionHead icon={FaFileContract} label="Basic Information" />

          <FormField label="Tender Title" required>
            <input value={formData.title} onChange={e => setField("title", e.target.value)}
              placeholder="e.g., Supply of Medical Equipment" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tender Number">
              <input value={formData.tenderNumber} onChange={e => setField("tenderNumber", e.target.value)}
                disabled={!!formData.id}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white ${formData.id ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`} />
            </FormField>
            <FormField label="Category" required>
              <select value={formData.category} onChange={e => setField("category", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Description" required>
            <textarea value={formData.description} onChange={e => setField("description", e.target.value)}
              placeholder="Brief description of the tender…" rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none" required />
          </FormField>

          <FormField label="Scope of Work">
            <textarea value={formData.scopeOfWork} onChange={e => setField("scopeOfWork", e.target.value)}
              placeholder="Detailed requirements and outcomes…" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none" />
          </FormField>

          <SectionHead icon={FaCalendarAlt} label="Timeline & Budget" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Publication Date">
              <input type="date" value={formData.publicationDate} onChange={e => setField("publicationDate", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Submission Deadline">
              <input type="date" value={formData.submissionDeadline} onChange={e => setField("submissionDeadline", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Evaluation Date">
              <input type="date" value={formData.evaluationDate} onChange={e => setField("evaluationDate", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Status">
              <select value={formData.status} onChange={e => setField("status", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white">
                <option value="draft">Draft</option>
                <option value="active">Active (Published)</option>
                <option value="closed">Closed</option>
                <option value="under_evaluation">Under Evaluation</option>
                <option value="awarded">Awarded</option>
              </select>
            </FormField>
            <FormField label="Budget Min (KES)">
              <input type="number" value={formData.budgetMin} onChange={e => setField("budgetMin", e.target.value)}
                placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Budget Max (KES)">
              <input type="number" value={formData.budgetMax} onChange={e => setField("budgetMax", e.target.value)}
                placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
          </div>

          <SectionHead icon={FaPaperclip} label="Documents & Attachments" />

          <FormField label="Required Documents from Vendors">
            <textarea value={formData.requiredDocuments} onChange={e => setField("requiredDocuments", e.target.value)}
              placeholder="e.g., Company Registration, Tax Certificate, Technical Proposal…"
              rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none" />
          </FormField>

          <FormField label="Upload Tender Documents">
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaPaperclip className="text-gray-300 text-lg shrink-0" />
              <span className="text-sm text-gray-400">
                {formData.attachments ? `${formData.attachments.length} file(s) selected` : "Click to upload (PDF, DOCX, ZIP)"}
              </span>
              <input type="file" multiple accept=".pdf,.doc,.docx,.zip,.xlsx"
                onChange={e => setField("attachments", e.target.files)} className="hidden" />
            </label>
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setCreateModal(false); resetForm(); }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer  transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FaSave className="text-xs" />{formData.id ? "Save Changes" : "Create Tender"}</>
              }
            </button>
          </div>
        </form>
      </Modal>

      
      <Modal
        open={detailsModal}
        onClose={() => setDetailsModal(false)}
        title={`Tender: ${selectedTender?.tenderNumber || ""}`}
        size="2xl"
      >
        {selectedTender && (
          <>
            <h3 className="text-xl font-black text-gray-900 mb-4">{selectedTender.title}</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              <LocalStatusBadge status={selectedTender.status} />
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catCls(selectedTender.category)}`}>{selectedTender.category}</span>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <FaUsers className="text-[9px]" />{selectedTender.visibility?.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <DetailItem icon={FaCalendarAlt}  label="Publication Date"   value={fmtDate(selectedTender.publicationDate)} />
              <DetailItem icon={FaClock}        label="Deadline"           value={fmtDate(selectedTender.submissionDeadline)} />
              <DetailItem icon={FaCalendarAlt}  label="Evaluation Date"    value={fmtDate(selectedTender.evaluationDate)} />
              <DetailItem icon={FaDollarSign}   label="Budget Range"       value={`${fmtCurrency(selectedTender.budgetMin)} – ${fmtCurrency(selectedTender.budgetMax)}`} />
              <DetailItem icon={FaAward}        label="Awarded To"         value={selectedTender.awardedTo?.name || (selectedTender.status === "awarded" ? "See bids" : "N/A")} />
              <DetailItem icon={FaClipboardList}label="Required Documents" value={selectedTender.requiredDocuments} />
              <DetailItem icon={FaFileAlt}      label="Description"        value={selectedTender.description}  full />
              <DetailItem icon={FaBullhorn}     label="Scope of Work"      value={selectedTender.scopeOfWork}  full />
            </div>

 
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              {(() => { const atts = typeof selectedTender.attachments === "string" ? JSON.parse(selectedTender.attachments) : (selectedTender.attachments || []); return (
              <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FaPaperclip className="text-[10px]" />Attachments ({atts.length})
              </p>
              {atts.length > 0 ? (
                <div className="space-y-1.5">
                  {atts.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                      <FaFileDownload className="text-[10px]" />{f.filename}
                    </a>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No documents attached.</p>}
              </>); })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setDetailsModal(false)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

     
      <Modal
        open={bidsModal}
        onClose={() => setBidsModal(false)}
        title={`Bids — ${selectedTender?.title || ""}`}
        maxW="max-w-5xl"
      >
        {bidsLoading ? <Spinner text="Loading bids…" /> : bids.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
              <FaExclamationTriangle className="text-amber-400 text-xl" />
            </div>
            <p className="text-sm text-gray-400">No bids received yet</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4"><span className="font-semibold text-gray-700">{bids.length}</span> bid(s) received</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Vendor","Bid Amount","Submitted","Tech Score","Fin Score","Actions"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bids.map(bid => (
                    <tr key={bid.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-gray-900">{bid.vendorName || "Anonymous"}</td>
                      <td className="px-5 py-4 font-bold text-gray-800">{fmtCurrency(bid.bidAmount)}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{fmtDate(bid.createdAt)}</td>
                      <td className="px-5 py-4 text-xs text-gray-600">{bid.technicalScore ?? "—"}</td>
                      <td className="px-5 py-4 text-xs text-gray-600">{bid.financialScore ?? "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer" title="View bid docs"><FaEye className="text-sm" /></button>
                          <button className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 cursor-pointer" title="Score bid"><FaChartLine className="text-sm" /></button>
                          {selectedTender?.status !== "awarded" && (
                            <button onClick={() => handleAwardTender(selectedTender, bid.vendorId)}
                              className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 cursor-pointer" title="Award to this vendor">
                              <FaAward className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button onClick={() => setBidsModal(false)}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TenderPage;

import React, { useEffect, useState } from "react";
import {
  FaPlus, FaTrash, FaUser, FaSearch, FaFilter, FaEye,
  FaTimes, FaCheckCircle, FaClock, FaUserTie, FaEnvelope,
  FaUniversity, FaRedo, FaUserCheck, FaUserSlash, FaCrown,
  FaBookOpen, FaFilePdf, FaFileAlt, FaImage, FaEdit,
  FaDownload,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";
import {
  listReviewers, listAllResearchers, inviteReviewer,
  revokeReviewer, promoteToAdmin, resendInvite,
} from "../../api/research";


// ─── shared helpers ───────────────────────────────────────────────────────────
const ROLE_META = {
  admin:      { label: "Research Admin", color: "bg-purple-100 text-purple-700", icon: FaCrown },
  reviewer:   { label: "Reviewer",       color: "bg-blue-100 text-blue-700",     icon: FaUserTie },
  researcher: { label: "Researcher",     color: "bg-gray-100 text-gray-600",     icon: FaUser },
};
const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] ?? ROLE_META.researcher;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}>
      <Icon className="text-[10px]" />{meta.label}
    </span>
  );
};

const RESEARCH_CATEGORIES = [
  "Medical Research","Clinical Studies","Public Health",
  "Laboratory Research","Epidemiology","Health Policy",
  "Nursing Research","Other",
];
const EMPTY_INVITE  = { email:"", firstName:"", lastName:"", institution:"", department:"", discipline:"" };
const EMPTY_PAPER   = { title:"", author:"", abstract:"", category:"", pdf:null, thumbnail:null };

// ─── top-level tabs ───────────────────────────────────────────────────────────
const TOP_TABS = [
  { key:"papers",    label:"Research Papers",    icon: FaBookOpen },
  { key:"reviewers", label:"Reviewer Management",icon: FaUserTie  },
];

// ═════════════════════════════════════════════════════════════════════════════
const ResearchPage = () => {
  const [topTab, setTopTab] = useState("papers");

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

     
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Research Management</h1>
          <p className="text-gray-500 text-sm">Manage published research papers and reviewer assignments</p>
        </div>


        <div className="flex gap-1 mb-6  p-1 w-fit">
          {TOP_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTopTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold 
                cursor-pointer transition-all duration-200 ${
                topTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon className="text-xs" />{label}
            </button>
          ))}
        </div>

        {topTab === "papers"    && <PapersPanel />}
        {topTab === "reviewers" && <ReviewersPanel />}
      </div>
    </div>
  );
};


const PapersPanel = () => {
  const [research,       setResearch]       = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingItem,  setEditingItem]  = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_PAPER);
  const [previewImage, setPreviewImage] = useState(null);


  const [viewModal,        setViewModal]        = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);

  
  const fetchResearch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/research");
      setResearch(res.data);
    } catch {
      toast.error("Error fetching research papers");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchResearch(); }, []);


  const filtered = research.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.title?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.abstract?.toLowerCase().includes(q);
    return matchSearch && (filterCategory === "all" || item.category === filterCategory);
  });


  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item
      ? { title:item.title, author:item.author, abstract:item.abstract, category:item.category, pdf:null, thumbnail:null }
      : EMPTY_PAPER
    );
    setPreviewImage(item?.thumbnailUrl || null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setEditingItem(null); setFormData(EMPTY_PAPER);
    setPreviewImage(null); setModalOpen(false);
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFormData(p => ({ ...p, [name]: file }));
    if (name === "thumbnail" && file) setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) data.append(k, v); });
      if (editingItem) {
        await api.put(`/research/${editingItem._id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/research", data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success("Research paper saved successfully!");
      fetchResearch(); closeModal();
    } catch {
      toast.error("Error saving research paper");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this research paper?")) return;
    try {
      await api.delete(`/research/${id}`);
      toast.success("Research paper deleted!");
      fetchResearch();
    } catch {
      toast.error("Error deleting research paper");
    }
  };


  return (
    <>
  
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Total Papers",     value: research.length,                                         color:"blue",   icon: FaBookOpen },
          { label:"With PDFs",        value: research.filter(r => r.fileUrl).length,                  color:"green",  icon: FaFilePdf  },
          { label:"Categories",       value: new Set(research.map(r=>r.category).filter(Boolean)).size,color:"purple", icon: FaFileAlt  },
          { label:"With Thumbnails",  value: research.filter(r => r.thumbnailUrl).length,             color:"orange", icon: FaImage    },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>{value}</h3>
              </div>
              <div className={`w-11 h-11 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                <Icon className={`text-lg text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>


      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by title, author, or abstract…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring  focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 text-sm" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring  focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {RESEARCH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold
            cursor-pointer outline-none hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            <FaPlus /> Add Paper
          </button>
        </div>
      </div>


      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">Loading research papers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaBookOpen className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No research papers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filtered.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-44 bg-gradient-to-br from-blue-50 to-indigo-50">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBookOpen className="text-5xl text-blue-200" />
                    </div>
                  )}
                  {item.fileUrl && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <FaFilePdf /> PDF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    {item.category || "Uncategorized"}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-2 mb-1 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <FaUser className="mr-1 text-gray-400" />
                    <span className="truncate">{item.author}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {item.abstract || "No abstract available"}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedResearch(item); setViewModal(true); }}
                      className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 text-xs font-semibold gap-1"
                    >
                      <FaEye /> View
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {viewModal && selectedResearch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex-1 mr-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedResearch.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><FaUser className="text-gray-400" />{selectedResearch.author}</span>
                  <span className="text-purple-600 font-semibold">{selectedResearch.category}</span>
                </div>
              </div>
              <button onClick={() => setViewModal(false)} className="p-2  cursor-pointer rounded-lg shrink-0
              " title="Close">
                <FaTimes className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedResearch.thumbnailUrl && (
                <img src={selectedResearch.thumbnailUrl} alt={selectedResearch.title} className="w-full h-56 object-cover rounded-lg" />
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Abstract</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedResearch.abstract || "No abstract available"}</p>
              </div>
              {selectedResearch.fileUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFilePdf className="text-2xl text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">PDF Document</p>
                      <p className="text-xs text-gray-500">Full research paper available</p>
                    </div>
                  </div>
                  
                    <a href={selectedResearch.fileUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white
                    cursor-pointer rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    <FaDownload /> Download
                  </a>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setViewModal(false); openModal(selectedResearch); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                  cursor-pointer text-sm font-semibold hover:bg-blue-700"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:text-white rounded-lg text-sm
                   hover:bg-red-500 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

   
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingItem ? "Edit Research Paper" : "Add Research Paper"}</h3>
              <button onClick={closeModal} className="p-2  cursor-pointer rounded-lg">
                <FaTimes className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text" name="title" required
                  value={formData.title} onChange={handleChange}
                  placeholder="Research title"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Author <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="author" required
                    value={formData.author} onChange={handleChange}
                    placeholder="Author name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {RESEARCH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Abstract</label>
                <textarea
                  name="abstract" rows={4}
                  value={formData.abstract} onChange={handleChange}
                  placeholder="Abstract / summary…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upload PDF</label>
                <input
                  type="file" name="pdf" accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                   file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 
                   hover:file:bg-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Thumbnail (optional)</label>
                <input
                  type="file" name="thumbnail" accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg 
                  file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100 outline-none"
                />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="mt-2 w-full h-36 object-cover rounded-lg" />
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200
                 text-gray-600 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm 
                font-semibold hover:bg-blue-700 cursor-pointer transition-colors">
                  {editingItem ? "Update Paper" : "Save Paper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};


//  PANEL 2 — Reviewer Management 
const ReviewersPanel = () => {
  const [reviewers,     setReviewers]     = useState([]);
  const [allMembers,    setAllMembers]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [memberTab,     setMemberTab]     = useState("reviewers"); // "reviewers" | "all"
  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterRole,    setFilterRole]    = useState("all");
  const [inviteOpen,    setInviteOpen]    = useState(false);
  const [inviteForm,    setInviteForm]    = useState(EMPTY_INVITE);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [drawer,        setDrawer]        = useState(null);

  const loadReviewers = async () => {
    try {
      setLoading(true);
      const data = await listReviewers();
      setReviewers(data.reviewers ?? []);
    } catch { toast.error("Failed to load reviewers"); }
    finally { setLoading(false); }
  };
  const loadAll = async () => {
    try {
      setLoading(true);
      const data = await listAllResearchers({ limit: 100 });
      setAllMembers(data.researchers ?? []);
    } catch { toast.error("Failed to load members"); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadReviewers(); loadAll(); }, []);

  const source   = memberTab === "reviewers" ? reviewers : allMembers;
  const filtered = source.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      (m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) ||
       m.institution?.toLowerCase().includes(q) || m.discipline?.toLowerCase().includes(q)) &&
      (filterRole === "all" || m.role === filterRole)
    );
  });

  const totalReviewers   = reviewers.filter(r => r.role === "reviewer").length;
  const totalAdmins      = reviewers.filter(r => r.role === "admin").length;
  const pendingSetup     = reviewers.filter(r => !r.emailVerified).length;
  const totalResearchers = allMembers.filter(r => r.role === "researcher").length;

  const handleInvite = async (e) => {
    e.preventDefault(); setInviteLoading(true);
    try {
      const result = await inviteReviewer(inviteForm);
      toast.success(result.message);
      setInviteOpen(false); setInviteForm(EMPTY_INVITE);
      loadReviewers(); loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to invite reviewer"); }
    finally { setInviteLoading(false); }
  };
  const handleRevoke = async (member) => {
    if (!window.confirm(`Revoke reviewer access for ${member.name}?`)) return;
    try {
      const result = await revokeReviewer(member._id);
      toast.success(result.message);
      if (drawer?._id === member._id) setDrawer(null);
      loadReviewers(); loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to revoke reviewer"); }
  };
  const handlePromote = async (member) => {
    if (!window.confirm(`Promote ${member.name} to Research Admin?`)) return;
    try {
      const result = await promoteToAdmin(member._id);
      toast.success(result.message);
      if (drawer?._id === member._id) setDrawer({ ...drawer, role: "admin" });
      loadReviewers(); loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Promotion failed"); }
  };
  const handleResend = async (member) => {
    try {
      const result = await resendInvite(member._id);
      toast.success(result.message);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to resend invite"); }
  };
  const handleAssignFromTable = async (member) => {
    try {
      const result = await inviteReviewer({ email: member.email });
      toast.success(result.message);
      loadReviewers(); loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  return (
    <>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Active Reviewers", value: totalReviewers,   color:"blue",   icon: FaUserTie },
          { label:"Research Admins",  value: totalAdmins,      color:"purple", icon: FaCrown   },
          { label:"Pending Setup",    value: pendingSetup,     color:"orange", icon: FaClock   },
          { label:"Researchers",      value: totalResearchers, color:"teal",   icon: FaUser    },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>{value}</h3>
              </div>
              <div className={`w-11 h-11 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                <Icon className={`text-lg text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs + invite button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-white  p-1 w-fit">
          {[
            { key:"reviewers", label:"Reviewers & Admins" },
            { key:"all",       label:"All Members" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMemberTab(key); setSearchTerm(""); setFilterRole("all"); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                memberTab === key ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm
           font-semibold hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
        >
          <FaPlus /> Invite Reviewer
        </button>
      </div>

     
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, email, institution…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 outline-none rounded-lg text-sm focus:ring
               focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 text-sm" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer outline-none focus:ring focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Research Admin</option>
              <option value="reviewer">Reviewer</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
        </div>
      </div>

    
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaUser className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Member","Institution","Discipline","Role","Status",""].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h ? "text-left" : "text-right"}`}>{h || "Actions"}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{member.institution || "—"}</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{member.discipline || "—"}</td>
                    <td className="px-5 py-4"><RoleBadge role={member.role} /></td>
                    <td className="px-5 py-4">
                      {member.emailVerified
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><FaCheckCircle /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500"><FaClock /> Pending setup</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDrawer(member)} className="p-1.5 rounded-lg text-gray-400
                         hover:bg-gray-100 hover:text-gray-700 cursor-pointer" title="View details"><FaEye /></button>
                        {!member.emailVerified && <button onClick={() => handleResend(member)} 
                        className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 cursor-pointer" title="Resend invite"><FaRedo /></button>}
                        {member.role === "reviewer" && <button onClick={() => handlePromote(member)} 
                        className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 cursor-pointer" title="Promote to admin"><FaCrown /></button>}
                        {member.role === "researcher" && <button onClick={() => handleAssignFromTable(member)} 
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 cursor-pointer" title="Assign as reviewer"><FaUserCheck /></button>}
                        {member.role === "reviewer" && <button onClick={() => handleRevoke(member)}
                         className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer" title="Revoke reviewer access"><FaUserSlash /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

   
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invite Reviewer</h3>
                <p className="text-xs text-gray-500 mt-0.5">Enter an existing researcher's email to promote them, or fill all fields to create a new account.</p>
              </div>
              <button onClick={() => { setInviteOpen(false); setInviteForm(EMPTY_INVITE); }} className="p-2
                rounded-lg cursor-pointer" title="Close">
                <FaTimes className="text-gray-400 hover:text-red-500 text-xl"  />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email" required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="reviewer@institution.ac.ke"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">If this email belongs to an existing researcher they'll be promoted automatically.</p>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">New account details (leave blank if promoting existing)</p>
              <div className="grid grid-cols-2 gap-3">
                {[["firstName","First Name","Jane"],["lastName","Last Name","Wanjiru"]].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="text" value={inviteForm[name]} onChange={(e) => setInviteForm(p => ({ ...p, [name]: e.target.value }))} placeholder={ph}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1"><FaUniversity className="inline mr-1" />Institution</label>
                <input type="text" value={inviteForm.institution} onChange={(e) => setInviteForm(p => ({ ...p, institution: e.target.value }))} placeholder="University of Nairobi"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["department","Department","Medicine"],["discipline","Discipline","Public Health"]].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="text" value={inviteForm[name]} onChange={(e) => setInviteForm(p => ({ ...p, [name]: e.target.value }))} placeholder={ph}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm  outline-none focus:ring focus:ring-blue-500 focus:border-transparent" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setInviteOpen(false); setInviteForm(EMPTY_INVITE); }}
                 className="px-4 py-2 border border-gray-200 text-gray-600 cursor-pointer rounded-lg text-sm
                  hover:bg-red-500 hover:text-white">Cancel</button>
                <button type="submit" disabled={inviteLoading} className="px-5 py-2 bg-blue-600 text-white cursor-pointer
                 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {inviteLoading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</> : <><FaEnvelope /> Send Invite</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(null)} />
          <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Member Details</h3>
              <button onClick={() => setDrawer(null)} className="p-1.5 hover:bg-red-500 rounded-lg cursor-pointer"><FaTimes className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {drawer.name?.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-gray-900 text-lg">{drawer.name}</p>
                <p className="text-sm text-gray-400">{drawer.email}</p>
                <RoleBadge role={drawer.role} />
                {drawer.emailVerified
                  ? <span className="text-xs text-green-600 flex items-center gap-1"><FaCheckCircle /> Account active</span>
                  : <span className="text-xs text-orange-500 flex items-center gap-1"><FaClock /> Awaiting password setup</span>
                }
              </div>
              {[
                { label:"Institution", value: drawer.institution },
                { label:"Department",  value: drawer.department  },
                { label:"Discipline",  value: drawer.discipline  },
                { label:"Member since",value: drawer.createdAt ? new Date(drawer.createdAt).toLocaleDateString("en-KE", { year:"numeric", month:"long", day:"numeric" }) : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm text-gray-700">{value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 space-y-2">
              {!drawer.emailVerified && (
                <button onClick={() => handleResend(drawer)} className="w-full flex items-center justify-center
                 gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-semibold cursor-pointer
                  hover:bg-orange-100">
                  <FaRedo /> Resend Invite Email
                </button>
              )}
              {drawer.role === "reviewer" && (
                <>
                  <button onClick={() => handlePromote(drawer)} className="w-full flex items-center justify-center 
                  gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-semibold cursor-pointer
                   hover:bg-purple-100">
                    <FaCrown /> Promote to Admin
                  </button>
                  <button onClick={() => handleRevoke(drawer)} className="w-full flex items-center justify-center gap-2 
                  px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-100">
                    <FaUserSlash /> Revoke Reviewer Access
                  </button>
                </>
              )}
              {drawer.role === "researcher" && (
                <button
                  onClick={() => inviteReviewer({ email: drawer.email })
                    .then(r => { toast.success(r.message); loadReviewers(); loadAll(); setDrawer(null); })
                    .catch(err => toast.error(err.response?.data?.message || "Failed"))
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600
                   rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-100"
                >
                  <FaUserCheck /> Assign as Reviewer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResearchPage;
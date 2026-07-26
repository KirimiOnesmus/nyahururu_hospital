import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import {
  FaPlus, FaEdit, FaTrash, FaUsers, FaBriefcase,
  FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaEnvelope,
  FaDownload, FaTimes, FaCheckCircle, FaClock, FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge as SharedStatusBadge, Avatar, DataTable,
} from "../../common/components";



const STATUSES = ["pending", "reviewed", "shortlisted", "rejected"];

const STATUS_CONFIG = {
  pending:     { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400",   icon: FaClock       },
  reviewed:    { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-400",     icon: FaCheckCircle },
  shortlisted: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: FaCheckCircle },
  rejected:    { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-400",    icon: FaTimesCircle },
};

const EMPTY_FORM = { title: "", department: "", location: "", description: "", deadline: "" };


const LocalStatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
const CareersPage = () => {
  const [careers,            setCareers]            = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [searchTerm,         setSearchTerm]         = useState("");

  const [modalOpen,          setModalOpen]          = useState(false);
  const [editingCareer,      setEditingCareer]      = useState(null);
  const [formData,           setFormData]           = useState(EMPTY_FORM);
  const [submitting,         setSubmitting]         = useState(false);

  const [appsModal,          setAppsModal]          = useState(false);
  const [applications,       setApplications]       = useState([]);
  const [selectedJob,        setSelectedJob]        = useState(null);
  const [appsLoading,        setAppsLoading]        = useState(false);
  const [appSearch,          setAppSearch]          = useState("");
  const [appStatusFilter,    setAppStatusFilter]    = useState("all");

  
  const fetchCareers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/careers");
    
      setCareers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCareers(); }, [fetchCareers]);


  const stats = useMemo(() => ({
    total:             careers.length,
    active:            careers.filter(c => new Date(c.deadline) > new Date()).length,
    expired:           careers.filter(c => new Date(c.deadline) <= new Date()).length,
    totalApplications: careers.reduce((s, c) => s + (c.applicationsCount || 0), 0),
  }), [careers]);


  const filteredCareers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return careers.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
  }, [careers, searchTerm]);

  const openModal = (career = null) => {
    setEditingCareer(career);

    setFormData(career
      ? { title: career.title || "", department: career.department || "", location: career.location || "", description: career.description || "", deadline: career.deadline?.split("T")[0] || "" }
      : EMPTY_FORM
    );
    setModalOpen(true);
  };

  const closeModal = () => { setEditingCareer(null); setModalOpen(false); };

  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCareer) await api.put(`/careers/${editingCareer.id}`, formData);
      else await api.post("/careers", formData);
      notify.success(`Job ${editingCareer ? "updated" : "created"} successfully`);
      closeModal();
      fetchCareers();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job posting?")) return;
    try {
      await api.delete(`/careers/${id}`);
      notify.success("Job deleted");
      fetchCareers();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting job");
    }
  };

  const handleViewApplications = async (career) => {
    setSelectedJob(career);
    setAppsModal(true);
    setAppSearch("");
    setAppStatusFilter("all");
    setAppsLoading(true);
    try {
      const res = await api.get(`/applications/job/${career.id}`);
      setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to fetch applications");
    } finally {
      setAppsLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      notify.success("Status updated");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const filteredApps = useMemo(() => {
    const q = appSearch.toLowerCase();
    return applications.filter(a => {
      const matchSearch =
        a.applicantName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q);
      const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, appSearch, appStatusFilter]);


  const isExpired = (deadline) => new Date(deadline) <= new Date();
  const daysLeft  = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

    
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaBriefcase className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Career Opportunities</h1>
              <p className="text-xs text-gray-400">Manage job postings and applicant reviews</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors  cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add Job Posting
          </button>
        </div>

  
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Jobs"    value={stats.total}            icon={FaBriefcase}  accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Active"        value={stats.active}           icon={FaCheckCircle}accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Expired"       value={stats.expired}          icon={FaTimesCircle}accent={{ bg:"bg-rose-50",    icon:"text-rose-500",    num:"text-rose-600"    }} />
          <StatCard label="Applications"  value={stats.totalApplications}icon={FaUsers}      accent={{ bg:"bg-violet-50",  icon:"text-violet-500",  num:"text-violet-600"  }} />
        </div>

    
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by title, department, or location…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <Spinner text="Loading job postings…" />
        ) : filteredCareers.length === 0 ? (
          <EmptyState icon={FaBriefcase} text={searchTerm ? "No jobs match your search" : "No job postings yet"} />
        ) : (
          <>
            <DataTable
              columns={[
                {
                  key: "title", label: "Job Title",
                  render: (job) => {
                    const expired = isExpired(job.deadline);
                    const days = daysLeft(job.deadline);
                    return (
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${expired ? "bg-gray-100" : "bg-blue-50"}`}>
                          <FaBriefcase className={expired ? "text-gray-400" : "text-blue-500"} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          {expired
                            ? <span className="text-[10px] font-semibold text-rose-500">Expired</span>
                            : <span className="text-[10px] text-emerald-600 font-semibold">{days}d left</span>}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: "department", label: "Department",
                  render: (job) => (
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaBuilding className="text-gray-300 shrink-0" />{job.department || "—"}
                    </span>
                  ),
                },
                {
                  key: "location", label: "Location",
                  render: (job) => (
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaMapMarkerAlt className="text-gray-300 shrink-0" />{job.location || "—"}
                    </span>
                  ),
                },
                {
                  key: "deadline", label: "Deadline",
                  render: (job) => (
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaCalendarAlt className="text-gray-300 shrink-0" />
                      {new Date(job.deadline).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                  ),
                },
                {
                  key: "applications", label: "Applications",
                  render: (job) => (
                    <button onClick={() => handleViewApplications(job)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                      <FaUsers className="text-[10px]" />
                      {job.applicationsCount || 0} applicant{job.applicationsCount !== 1 ? "s" : ""}
                    </button>
                  ),
                },
                {
                  key: "actions", label: "Actions", align: "right",
                  render: (job) => (
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(job)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Edit">
                        <FaEdit className="text-sm" />
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 transition-colors cursor-pointer" title="Delete">
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredCareers}
              rowKey={(job) => job.id}
            />
            <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filteredCareers.length}</span> of <span className="font-semibold text-gray-600">{careers.length}</span> postings
              </p>
            </div>
          </>
        )}
      </div>

      <Modal
        open={appsModal}
        onClose={() => setAppsModal(false)}
        title={`Applications — ${selectedJob?.title || ""}`}
        subtitle={`${applications.length} total application${applications.length !== 1 ? "s" : ""}`}
        size="2xl"
      >

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
            <input
              value={appSearch}
              onChange={e => setAppSearch(e.target.value)}
              placeholder="Search applicant name or email…"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <select
            value={appStatusFilter}
            onChange={e => setAppStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {appsLoading ? <Spinner text="Loading applications…" /> : filteredApps.length === 0 ? (
          <EmptyState icon={FaUsers} text={appSearch || appStatusFilter !== "all" ? "No applications match your filters" : "No applications received yet"} />
        ) : (
          <div className="space-y-3">
            {filteredApps.map(app => (
              <div key={app.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {app.applicantName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{app.applicantName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                      <FaEnvelope className="text-[10px] shrink-0" />{app.email}
                    </p>
                  </div>
                </div>

                <LocalStatusBadge status={app.status} />

              
                <select
                  value={app.status}
                  onChange={e => handleStatusChange(app.id, e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600 shrink-0"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>

         
                {app.resumeUrl ? (
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <FaDownload className="text-[10px]" /> Download CV
                  </a>
                ) : (
                  <span className="text-xs text-gray-300 italic shrink-0">No CV</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-5 mt-4 border-t border-gray-100">
          <button
            onClick={() => setAppsModal(false)}
            className="px-5 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCareer ? "Edit Job Posting" : "New Job Posting"}
        subtitle={editingCareer ? "Update job details" : "Create a new career opportunity"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Job Title" required>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Nurse"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Department">
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Cardiology"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
            <FormField label="Location">
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Nyahururu, Kenya"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
          </div>

          <FormField label="Job Description" required>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter job description, requirements, and responsibilities…"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none"
              required
            />
          </FormField>

          <FormField label="Application Deadline" required>
            <input
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              
              min={editingCareer ? undefined : new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer "
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FaCheckCircle className="text-xs" />{editingCareer ? "Update Job" : "Create Job"}</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CareersPage;
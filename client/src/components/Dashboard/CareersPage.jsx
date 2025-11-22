import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBuilding,
  FaFileAlt,
  FaEnvelope,
  FaDownload,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

const CareersPage = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [applicationsModal, setApplicationsModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    deadline: "",
  });

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/careers");
      setCareers(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const handleOpenModal = (career = null) => {
    setEditingCareer(career);
    setFormData(
      career
        ? { ...career }
        : { title: "", department: "", location: "", description: "", deadline: "" }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCareer(null);
    setModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCareer) await api.put(`/careers/${editingCareer._id}`, formData);
      else await api.post("/careers", formData);
      fetchCareers();
      handleCloseModal();
      alert("Career saved successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Error saving career");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await api.delete(`/careers/${id}`);
      fetchCareers();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting career");
    }
  };

  const handleViewApplications = async (career) => {
    setSelectedJob(career);
    try {
      const res = await api.get(`/applications/job/${career._id}`);
      setApplications(res.data);
      setApplicationsModal(true);
    } catch (err) {
      alert(err.message || "Error fetching applications");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: FaClock },
      reviewed: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FaCheckCircle },
      shortlisted: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: FaCheckCircle },
      rejected: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: FaTimesCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: careers.length,
    active: careers.filter((c) => new Date(c.deadline) > new Date()).length,
    expired: careers.filter((c) => new Date(c.deadline) <= new Date()).length,
    totalApplications: careers.reduce((sum, c) => sum + (c.applicationsCount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Career Opportunities
            </h1>
            <p className="text-gray-600">Manage job postings and applications</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" />
            Add Job Posting
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Jobs</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaBriefcase className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Postings</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Expired</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.expired}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FaTimesCircle className="text-xl text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Applications</p>
                <h3 className="text-2xl font-bold text-purple-600">{stats.totalApplications}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaUsers className="text-xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading job postings...</p>
            </div>
          ) : careers.length === 0 ? (
            <div className="p-12 text-center">
              <FaBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No job postings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {careers.map((job) => {
                    const isExpired = new Date(job.deadline) <= new Date();
                    return (
                      <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <FaBriefcase className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{job.title}</p>
                              {isExpired && (
                                <span className="text-xs text-red-600">Expired</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-900">
                            <FaBuilding className="text-gray-400 mr-2" />
                            {job.department || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-900">
                            <FaMapMarkerAlt className="text-gray-400 mr-2" />
                            {job.location || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-900">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            {new Date(job.deadline).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewApplications(job)}
                            className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <FaUsers className="mr-2" />
                            {job.applicationsCount || 0}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(job)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Job"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(job._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Job"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Applications Modal */}
      {applicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Applications for {selectedJob?.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {applications.length} total application{applications.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setApplicationsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500 text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FaUsers className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No applications received yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Applicant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Resume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {applications.map((app) => (
                        <tr key={app._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {app.applicantName}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <FaEnvelope className="mr-1" />
                                {app.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app._id, e.target.value)
                              }
                              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            {app.resumeUrl ? (
                              <a
                                href={app.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <FaDownload className="mr-2" />
                                Download CV
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">No CV</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => setApplicationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCareer ? "Edit Job Posting" : "Add New Job Posting"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingCareer ? "Update job details" : "Create a new career opportunity"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Nurse"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Cardiology"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Nairobi, Kenya"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter job description, requirements, and responsibilities..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline *
                  </label>
                  <input
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaCheckCircle className="mr-2" />
                  {editingCareer ? "Update Job" : "Create Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
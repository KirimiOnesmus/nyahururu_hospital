import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdPeople } from "react-icons/md";

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
    if (!window.confirm("Are you sure you want to delete this career?")) return;
    try {
      await api.delete(`/careers/${id}`);
      fetchCareers();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting career");
    }
  };

  // Fetch applications for a job
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Career Opportunities</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Job
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Deadline</th>
                <th className="px-4 py-2 text-left">Applications</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {careers.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-2 ">{job.title}</td>
                  <td className="px-4 py-2 ">{job.department}</td>
                  <td className="px-4 py-2 ">{job.location}</td>
                  <td className="px-4 py-2  text-gray-600">
                    {new Date(job.deadline).toLocaleDateString(
                      "en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    }
                    )}
                  </td>
                  <td className="px-4 py-2  text-center">
                    <button
                      onClick={() => handleViewApplications(job)}
                      className="flex items-center justify-center text-blue-600 hover:text-blue-800"
                    >
                      <MdPeople className="mr-1" /> {job.applicationsCount || 0}
                    </button>
                  </td>
                  <td className="px-4 py-2  flex space-x-3 text-xl">
                    <MdEdit
                      title="Edit"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => handleOpenModal(job)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(job._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Modal */}
      {applicationsModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Applicants for {selectedJob?.title}
            </h2>

            {applications.length === 0 ? (
              <p>No applications yet.</p>
            ) : (
              <table className="min-w-full table-auto border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{app.applicantName}</td>
                      <td className="px-3 py-2">{app.email}</td>
                      <td className="px-3 py-2">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app._id, e.target.value)
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View CV
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end mt-5">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setApplicationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing job modal remains unchanged */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl font-semibold mb-4">
              {editingCareer ? "Edit Job Post" : "Add New Job"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" className="w-full p-2 border rounded" required />
              <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="w-full p-2 border rounded" />
              <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="w-full p-2 border rounded" />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Job Description" className="w-full p-2 border rounded h-24" />
              <label className="text-gray-600 text-sm">Application Deadline</label>
              <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="w-full p-2 border rounded" />
              <div className="flex justify-end space-x-3 pt-3">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  {editingCareer ? "Update" : "Add"}
                </button>
                <button type="button" onClick={handleCloseModal} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancel
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

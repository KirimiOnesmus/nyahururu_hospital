import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaSearch,
  FaFilter,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaEye,
  FaClock,
} from "react-icons/fa";
import { MdDelete, MdOutlineMarkEmailRead } from "react-icons/md";
import { toast } from "react-toastify";

const FeedbackPage = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch feedback
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback");
      setFeedbackList(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.log("Error fetching feedback");
      toast.error("Error fetching feedback");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Filter logic
  useEffect(() => {
    let data = feedbackList.filter(
      (fb) =>
        fb.name?.toLowerCase().includes(search.toLowerCase()) ||
        fb.email?.toLowerCase().includes(search.toLowerCase()) ||
        fb.message?.toLowerCase().includes(search.toLowerCase())
    );

    if (filterStatus !== "all") {
      data = data.filter(
        (fb) => fb.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    setFiltered(data);
  }, [search, filterStatus, feedbackList]);

  // Handlers
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("Feedback deleted");
      fetchFeedback();
    } catch (err) {
      console.log("Error deleting feedback:", err);
      toast.error("Error deleting feedback");
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await api.put(`/feedback/${id}/respond`, { status: "handled" });
      fetchFeedback();
      toast.success("Feedback marked as handled");
    } catch (err) {
      alert("Error updating status:", err);
      toast.error("Error updating status");
    }
  };

  const openViewModal = (fb) => {
    setSelectedFeedback(fb);
    setViewModalOpen(true);
  };

  const openReplyModal = (fb) => {
    setSelectedFeedback(fb);
    setReplyMessage(fb.response || "");
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e) => {
    if (!replyMessage.trim()) {
      alert("Please enter a reply message");
      return;
    }
    e.preventDefault();
    try {
      await api.put(`/feedback/${selectedFeedback._id}/respond`, {
        response: replyMessage,
        status: "handled",
      });
      setReplyModalOpen(false);
      setReplyMessage("");
      fetchFeedback();
      toast.success("Reply sent successfully!");
    } catch (err) {
      console.log("Error sending reply", err);
      toast.error("Error sending reply");
    }
  };

  // Stats
  const stats = {
    total: feedbackList.length,
    handled: feedbackList.filter((f) => f.status === "handled").length,
    pending: feedbackList.filter((f) => f.status !== "handled").length,
  };

  const getStatusBadge = (status) => {
    const map = {
      handled: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        icon: FaCheckCircle,
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: FaEnvelope,
      },
    };

    const key = status === "handled" ? "handled" : "pending";
    const Icon = map[key].icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${map[key].bg} ${map[key].text} ${map[key].border}`}
      >
        <Icon className="mr-1" />
        {key.charAt(0).toUpperCase() + key.slice(1)}
      </span>
    );
  };

  const truncate = (str, n = 100) =>
    str && str.length > n ? str.slice(0, n) + "…" : str;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Feedback Management
          </h1>
          <p className="text-gray-600">
            View, review, reply, and manage all user feedback
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Feedback</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.total}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaEnvelope className="text-xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Handled</p>
              <h3 className="text-2xl font-bold text-green-600">
                {stats.handled}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-xl text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </h3>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <FaEnvelope className="text-xl text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-0 focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-0"
              >
                <option value="all">All Status</option>
                <option value="handled">Handled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading feedback...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FaEnvelope className="text-5xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No feedback found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filtered.map((fb) => (
                    <tr key={fb._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{fb.name || "—"}</p>
                            <p className="text-sm text-gray-500">{fb.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-gray-900">
                          {truncate(fb.message, 80)}
                        </p>
                        {fb.response && (
                          <p className="text-sm text-gray-500 mt-1">
                            <strong>Response: </strong>
                            {truncate(fb.response, 80)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(fb.status)}</td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(fb.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3 text-xl">
                          <FaEye
                            className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                            title="View Details"
                            onClick={() => openViewModal(fb)}
                          />

                          {fb.status !== "handled" && (
                            <FaCheckCircle
                              className="text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                              title="Mark as Handled"
                              onClick={() => handleMarkReviewed(fb._id)}
                            />
                          )}

                          <MdOutlineMarkEmailRead
                            className="text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                            title="Reply"
                            onClick={() => openReplyModal(fb)}
                          />

                          <MdDelete
                            className="text-red-600 cursor-pointer hover:text-red-700 transition-colors"
                            title="Delete"
                            onClick={() => handleDelete(fb._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
          {/* VIEW MODAL */}
      {viewModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-md">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Feedback Details</h2>
                  <p className="text-blue-100 text-sm">
                    Submitted on {new Date(selectedFeedback.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <FaTimesCircle className="text-2xl" />
                </button>
              </div>
            </div>


            <div className="p-6 space-y-6">

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  User Information
                </h3>
                <div className="flex items-center mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-md">
                    <FaUser className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {selectedFeedback.name || "Anonymous"}
                    </p>
                    <p className="text-gray-600">{selectedFeedback.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    {getStatusBadge(selectedFeedback.status)}
                  </div>
                </div>
              </div>

  
              {selectedFeedback.subject && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Subject
                  </h3>
                  <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {selectedFeedback.subject}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Message
                </h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>
              </div>

              {selectedFeedback.response && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Our Response
                  </h3>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedFeedback.response}
                    </p>
                    {selectedFeedback.respondedAt && (
                      <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                        <FaClock />
                        Responded on {new Date(selectedFeedback.respondedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

        
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedFeedback.status !== "handled" && (
                  <button
                    onClick={() => {
                      handleMarkReviewed(selectedFeedback._id);
                      setViewModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors font-medium"
                  >
                    <FaCheckCircle />
                    Mark as Handled
                  </button>
                )}

                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    openReplyModal(selectedFeedback);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium"
                >
                  <MdOutlineMarkEmailRead />
                  {selectedFeedback.response ? "Update Reply" : "Send Reply"}
                </button>

                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleDelete(selectedFeedback._id);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition-colors font-medium"
                >
                  <MdDelete />
                  Delete
                </button>

                <button
                  onClick={() => setViewModalOpen(false)}
                  className="ml-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPLY MODAL */}
      {replyModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Reply to {selectedFeedback?.name}
              </h2>
              <FaTimesCircle
                className="text-gray-500 text-2xl cursor-pointer hover:text-gray-700"
                onClick={() => setReplyModalOpen(false)}
              />
            </div>

            <form onSubmit={handleSendReply}>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                rows={6}
                placeholder="Write your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                required
              ></textarea>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;

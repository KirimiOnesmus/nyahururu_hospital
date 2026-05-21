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
  FaTimes,
  FaReply,
  FaTrash,
  FaInbox,
} from "react-icons/fa";
import { MdDelete, MdOutlineMarkEmailRead } from "react-icons/md";
import { toast } from "react-toastify";

const truncate = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + "…" : str;

const formatDate = (iso, opts = {}) =>
  iso
    ? new Date(iso).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...opts,
      })
    : "—";

const STATUS_META = {
  handled: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    label: "Handled",
  },
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
};

const StatusBadge = ({ status }) => {
  const key = status === "handled" ? "handled" : "pending";
  const m = STATUS_META[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const FeedbackPage = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback");
      setFeedbackList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      toast.error("Error fetching feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);


  const filtered = feedbackList.filter((fb) => {
    const q = search.toLowerCase();
    const matchSearch =
      fb.name?.toLowerCase().includes(q) ||
      fb.email?.toLowerCase().includes(q) ||
      fb.message?.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "handled"
        ? fb.status === "handled"
        : fb.status !== "handled");
    return matchSearch && matchStatus;
  });

  const stats = {
    total: feedbackList.length,
    handled: feedbackList.filter((f) => f.status === "handled").length,
    pending: feedbackList.filter((f) => f.status !== "handled").length,
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("Feedback deleted");
      if (selectedFeedback?._id === id) {
        setViewModalOpen(false);
        setSelectedFeedback(null);
      }
      fetchFeedback();
    } catch (err) {
      console.error("Error deleting feedback:", err);
      toast.error("Error deleting feedback");
    }
  };

  const handleMarkHandled = async (id) => {
    try {
      await api.put(`/feedback/${id}/respond`, { status: "handled" });
      toast.success("Feedback marked as handled");
      fetchFeedback();
    } catch (err) {
      console.error("Error updating status:", err);
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
 
    e.preventDefault();

    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setReplySending(true);
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
      console.error("Error sending reply:", err);
      toast.error("Error sending reply");
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaEnvelope className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Feedback Management
              </h1>
              <p className="text-gray-500 text-sm">
                View, reply, and manage all user feedback
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Feedback",
              value: stats.total,
              color: "blue",
              icon: FaEnvelope,
            },
            {
              label: "Handled",
              value: stats.handled,
              color: "green",
              icon: FaCheckCircle,
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "amber",
              icon: FaClock,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <h3 className={`text-2xl font-bold text-${color}-600`}>
                    {value}
                  </h3>
                </div>
                <div
                  className={`w-11 h-11 bg-${color}-50 rounded-lg flex items-center justify-center`}
                >
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
                placeholder="Search by name, email, or message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 text-sm" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer outline-none focus:ring focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="handled">Handled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {(search || filterStatus !== "all") && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
              <span className="text-xs text-gray-400">
                Showing {filtered.length} of {feedbackList.length}
              </span>
              {[
                search && { label: `"${search}"`, clear: () => setSearch("") },
                filterStatus !== "all" && {
                  label: STATUS_META[filterStatus]?.label || filterStatus,
                  clear: () => setFilterStatus("all"),
                },
              ]
                .filter(Boolean)
                .map((chip, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                  >
                    {chip.label}
                    <button
                      onClick={chip.clear}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                  </span>
                ))}
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("all");
                }}
                className="text-xs text-gray-400 hover:text-red-500 cursor-pointer underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-500 mt-3 text-sm">Loading feedback…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FaInbox className="text-4xl text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                No feedback found
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Try adjusting your search or filters
              </p>
              {(search || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("all");
                  }}
                  className="mt-3 text-blue-600 text-xs hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["User", "Message", "Status", "Date", ""].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                          h ? "text-left" : "text-right"
                        }`}
                      >
                        {h || "Actions"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((fb) => (
                    <tr
                      key={fb._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(fb.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {fb.name || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {fb.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-gray-700 text-xs leading-relaxed">
                          {truncate(fb.message, 90)}
                        </p>
                        {fb.response && (
                          <p className="text-xs text-blue-600 mt-1 truncate">
                            <span className="font-semibold">Reply:</span>{" "}
                            {truncate(fb.response, 60)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={fb.status} />
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(fb.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openViewModal(fb)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                            title="View details"
                          >
                            <FaEye className="text-sm" />
                          </button>

                          {fb.status !== "handled" && (
                            <button
                              onClick={() => handleMarkHandled(fb._id)}
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                              title="Mark as handled"
                            >
                              <FaCheckCircle className="text-sm" />
                            </button>
                          )}

                          <button
                            onClick={() => openReplyModal(fb)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title={fb.response ? "Update reply" : "Send reply"}
                          >
                            <MdOutlineMarkEmailRead className="text-base" />
                          </button>

                          <button
                            onClick={() => handleDelete(fb._id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <MdDelete className="text-base" />
                          </button>
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

      {/* ── VIEW MODAL ── */}
      {viewModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-blue-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    Feedback Details
                  </h2>
                  <p className="text-blue-200 text-xs mt-0.5">
                    Submitted on{" "}
                    {formatDate(selectedFeedback.createdAt, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-2 cursor-pointer rounded-lg bg-white/20 hover:bg-white/30 transition-colors ml-4 shrink-0"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  User
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {(selectedFeedback.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedFeedback.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedFeedback.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={selectedFeedback.status} />
                  </div>
                </div>
              </div>

              {/* subject */}
              {selectedFeedback.subject && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Subject
                  </p>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {selectedFeedback.subject}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Message
                </p>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>
              </div>

              {selectedFeedback.response && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Our Response
                  </p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedFeedback.response}
                    </p>
                    {selectedFeedback.respondedAt && (
                      <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                        <FaClock />
                        Responded on{" "}
                        {formatDate(selectedFeedback.respondedAt, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                {selectedFeedback.status !== "handled" && (
                  <button
                    onClick={() => {
                      handleMarkHandled(selectedFeedback._id);
                      setViewModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                  >
                    <FaCheckCircle /> Mark as Handled
                  </button>
                )}
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    openReplyModal(selectedFeedback);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <MdOutlineMarkEmailRead className="text-base" />
                  {selectedFeedback.response ? "Update Reply" : "Send Reply"}
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleDelete(selectedFeedback._id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-700 transition-colors"
                >
                  <MdDelete className="text-base" /> Delete
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="ml-auto px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REPLY MODAL ── */}
      {replyModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="relative bg-blue-600 px-6 pt-6 pb-8">
              <button
                onClick={() => setReplyModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <FaTimes className="text-white text-xs" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MdOutlineMarkEmailRead className="text-white text-xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {selectedFeedback.response ? "Update Reply" : "Send Reply"}
                  </h3>
                  <p className="text-blue-200 text-xs truncate">
                    To: {selectedFeedback.name || "Anonymous"} ·{" "}
                    {selectedFeedback.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-gradient-to-br from-blue-600 to-blue-700 relative">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>

            <form
              onSubmit={handleSendReply}
              className="px-6 pb-6 pt-3 space-y-4"
            >
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Original message
                </p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {selectedFeedback.message}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your Reply <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write your reply…"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replySending}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {replySending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <MdOutlineMarkEmailRead className="text-base" /> Send
                      Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default FeedbackPage;

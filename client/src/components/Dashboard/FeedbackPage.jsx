import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdDelete, MdCheckCircle, MdOutlineMarkEmailRead } from "react-icons/md";

const FeedbackPage = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback"); // expects backend to require auth if needed
      setFeedbackList(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert("Error fetching feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      await fetchFeedback();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting feedback");
    }
  };

  // Note: the backend expects PUT /feedback/:id/respond
  const handleMarkReviewed = async (id) => {
    try {
      await api.put(`/feedback/${id}/respond`, { status: "handled" });
      await fetchFeedback();
    } catch (err) {
      alert(err.response?.data?.message || "Error marking as reviewed");
    }
  };

  const openReplyModal = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyMessage(feedback.response || "");
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedFeedback) return alert("No feedback selected");
    try {
      await api.put(`/feedback/${selectedFeedback._id}/respond`, {
        response: replyMessage,
        status: "handled",
      });
      setReplyModalOpen(false);
      setReplyMessage("");
      alert("Reply sent successfully!");
      await fetchFeedback();
    } catch (err) {
      alert(err.response?.data?.message || "Error sending reply");
    }
  };

  const truncate = (str, n = 100) => (str && str.length > n ? str.slice(0, n) + "…" : str);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feedback Management</h1>
      </div>

      {loading ? (
        <p>Loading feedback...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map((fb) => (
                <tr key={fb._id} className="hover:bg-gray-50 border-b border-gray-300">
                  <td className="px-4 py-2 ">{fb.name || "—"}</td>
                  <td className="px-4 py-2 ">{fb.email || "—"}</td>
                  <td className="px-4 py-2 ">
                    <div title={fb.message}>{truncate(fb.message, 140)}</div>
                    {fb.response && (
                      <div className="mt-1 text-sm text-gray-600">
                        <strong>Response:</strong> {truncate(fb.response, 140)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 ">
                    {fb.status === "handled" ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        Handled
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2  text-gray-600">
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleString(
                      "en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    }
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2  flex space-x-4 text-xl">
                    {fb.status !== "handled" && (
                      <MdCheckCircle
                        title="Mark as Reviewed"
                        className="text-green-500 cursor-pointer hover:text-green-600"
                        onClick={() => handleMarkReviewed(fb._id)}
                      />
                    )}
                    <MdOutlineMarkEmailRead
                      title="Reply"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => openReplyModal(fb)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(fb._id)}
                    />
                  </td>
                </tr>
              ))}
              {feedbackList.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-600">
                    No feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {replyModalOpen && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Reply to: {selectedFeedback?.name}</h2>
            <form onSubmit={handleSendReply}>
              <textarea
                placeholder="Type your reply message..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 mb-4"
                rows="6"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-red-600 cursor-pointer font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 cursor-pointer"
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

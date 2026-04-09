import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaShieldAlt,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";

/* ── Stage labels defined here so the modal is fully self-contained ── */
const STAGE_LABELS = {
  proposal:    "Proposal",
  abstract:    "Abstract",
  final_paper: "Final Paper",
};

const ReviewModal = ({ item, onClose, onDecision }) => {
  const [decision, setDecision] = useState("");
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Please select a decision");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please add a review comment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/research/${item.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ decision, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Review submission failed");

      onDecision(item.id, decision, comment);
      toast.success(
        decision === "approved"
          ? "Proposal approved successfully"
          : "Revision request sent to researcher"
      );
      onClose();
    } catch (err) {
      toast.error(err.message || "Review submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ animation: "fadeIn .2s ease" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden"
        style={{ animation: "slideUp .25s ease" }}
      >


        <div className="p-8">
      
          {!loading && (
            <button
              onClick={onClose}
              className="absolute top-7 right-7 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              <FaTimes size={24} />
            </button>
          )}

         
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaShieldAlt className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Review Decision
              </p>
              <p className="text-xs text-gray-400">
                {STAGE_LABELS[item.stage] ?? item.stage}
              </p>
            </div>
          </div>

      
          <h3 className="font-bold text-gray-900 text-base  mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            {item.author} · {item.institution}
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-5 text-sm text-gray-600 leading-relaxed max-h-28 overflow-y-auto">
            {item.abstract}
          </div>

        
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Decision <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setDecision("approved")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 
                font-semibold text-sm transition-all duration-150 cursor-pointer ${
                decision === "approved"
                  ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-white"
              }`}
            >
              <FaCheck
                className={`text-xs transition-transform ${
                  decision === "approved" ? "scale-110" : ""
                }`}
              />
              Approve
            </button>

            <button
              type="button"
              onClick={() => setDecision("rejected")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 
                font-semibold text-sm transition-all duration-150 cursor-pointer ${
                decision === "rejected"
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50"
              }`}
            >
              <FaTimes
                className={`text-xs transition-transform ${
                  decision === "rejected" ? "scale-110" : ""
                }`}
              />
              Request Revision
            </button>
          </div>

          
          <label className="block mb-6">
            <span className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Review Comment <span className="text-red-500">*</span>
            </span>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="Provide clear feedback for the researcher — what was done well and what specifically needs improvement…"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none text-gray-800
               placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500 transition-all 
               resize-none bg-gray-50 hover:border-gray-300"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">
                Be specific — vague feedback delays researchers
              </span>
              <span
                className={`text-xs font-medium ${
                  comment.length > 450 ? "text-orange-500" : "text-gray-400"
                }`}
              >
                {comment.length}/500
              </span>
            </div>
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !decision || !comment.trim()}
            className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center
               justify-center gap-2 text-sm shadow-md cursor-pointer
              ${
                decision === "approved"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  : decision === "rejected"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              hover:-translate-y-0.5 hover:shadow-lg
            `}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <FaShieldAlt />
                {decision === "approved"
                  ? "Approve Submission"
                  : decision === "rejected"
                  ? "Request Revision"
                  : "Submit Review"}
              </>
            )}
          </button>

         
          {!loading && (
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-3 text-sm font-semibold text-gray-400
               hover:text-white hover:bg-red-500 cursor-pointer rounded-lg
               border border-red-500 py-3.5 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

export default ReviewModal;
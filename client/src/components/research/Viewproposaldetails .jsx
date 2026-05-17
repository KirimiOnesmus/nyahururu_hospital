import React, { useState, useEffect } from "react";
import {
  FaArrowLeft, FaFlask, FaCalendarAlt, FaDownload, FaCheckCircle,
  FaTimesCircle, FaClock, FaCommentAlt, FaUserCircle, FaUniversity,
  FaBookOpen, FaChevronRight, FaShieldAlt, FaStar, FaFileAlt,
  FaTag, FaGlobe, FaLock, FaExternalLinkAlt, FaHistory,
} from "react-icons/fa";


const STAGE_LABELS = {
  proposal: "Proposal",
  abstract: "Abstract",
  final_paper: "Final Paper",
};

const STAGE_COLORS = {
  proposal: "bg-blue-100 text-blue-700 border border-blue-200",
  abstract: "bg-purple-100 text-purple-700 border border-purple-200",
  final_paper: "bg-green-100 text-green-700 border border-green-200",
};

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    icon: FaCheckCircle,
    cls: "text-green-700 bg-green-50 border-green-300",
    bar: "bg-green-500",
    banner: "bg-green-50 border-green-200",
    bannerText: "text-green-800",
  },
  pending: {
    label: "Under Review",
    icon: FaClock,
    cls: "text-yellow-700 bg-yellow-50 border-yellow-300",
    bar: "bg-yellow-400",
    banner: "bg-yellow-50 border-yellow-200",
    bannerText: "text-yellow-800",
  },
  rejected: {
    label: "Needs Revision",
    icon: FaTimesCircle,
    cls: "text-red-700 bg-red-50 border-red-300",
    bar: "bg-red-500",
    banner: "bg-red-50 border-red-200",
    bannerText: "text-red-800",
  },
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";


const STAGES = ["proposal", "abstract", "final_paper"];

const StageProgress = ({ currentStage, status }) => {
  const currentIdx = STAGES.indexOf(currentStage);
  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${isPast ? "bg-blue-600 border-blue-600 text-white" : ""}
                  ${isCurrent && status === "approved" ? "bg-green-500 border-green-500 text-white" : ""}
                  ${isCurrent && status === "pending" ? "bg-yellow-400 border-yellow-400 text-white" : ""}
                  ${isCurrent && status === "rejected" ? "bg-red-500 border-red-500 text-white" : ""}
                  ${isFuture ? "bg-gray-100 border-gray-200 text-gray-400" : ""}
                `}
              >
                {isPast ? <FaCheckCircle className="text-[10px]" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap
                  ${isPast ? "text-blue-600" : isCurrent ? "text-gray-800" : "text-gray-400"}`}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 rounded-full min-w-8
                  ${isPast ? "bg-blue-500" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    {Icon && (
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="text-blue-500 text-xs" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium leading-snug">{value || "—"}</p>
    </div>
  </div>
);


const ReviewerComment = ({ item }) => {
  const sc = STATUS_CONFIG[item.status];
  const StatusIcon = sc.icon;

  if (!item.reviewComment && !item.reviewedAt && !item.reviewedBy) {
    return (
      <div className={`rounded-xl border p-5 ${STATUS_CONFIG.pending.banner} border-yellow-200`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <FaClock className="text-yellow-500 text-xs" />
          </div>
          <div>
            <p className="text-sm font-bold text-yellow-800">Awaiting Review</p>
            <p className="text-xs text-yellow-600">Your submission is in the review queue</p>
          </div>
        </div>
        <p className="text-xs text-yellow-700 leading-relaxed mt-3 pl-11">
          Our panel typically reviews submissions within 3–5 business days. You'll receive an email
          notification once a decision has been made.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 ${sc.banner} border`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${item.status === "approved" ? "bg-green-100" : "bg-red-100"}`}
        >
          <StatusIcon
            className={`text-xs ${item.status === "approved" ? "text-green-600" : "text-red-600"}`}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className={`text-sm font-bold ${sc.bannerText}`}>
              {item.status === "approved" ? "Approved" : "Revision Required"}
            </p>
            {item.reviewedAt && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <FaCalendarAlt className="text-[9px]" /> {fmtTime(item.reviewedAt)}
              </span>
            )}
          </div>

          {item.reviewedBy && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaShieldAlt className="text-indigo-500 text-[9px]" />
              </div>
              <p className="text-xs text-gray-500">
                Reviewed by <span className="font-semibold text-gray-700">{item.reviewedBy}</span>
              </p>
            </div>
          )}

          {item.reviewComment && (
            <div className="bg-white/70 rounded-lg px-4 py-3 border border-white/60">
              <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                <FaCommentAlt className="text-[9px]" /> Reviewer Comment
              </p>
              <p className={`text-sm leading-relaxed ${sc.bannerText}`}>{item.reviewComment}</p>
            </div>
          )}

          {item.rating && (
            <div className="mt-3 flex items-center gap-1.5">
              <p className="text-xs text-gray-400 font-medium">Rating:</p>
              {[1, 2, 3, 4, 5].map((s) => (
                <FaStar
                  key={s}
                  className={`text-xs ${s <= item.rating ? "text-yellow-400" : "text-gray-200"}`}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">{item.rating}/5</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const Timeline = ({ item }) => {
  const events = [
    {
      date: item.submittedAt,
      label: `${STAGE_LABELS[item.stage]} submitted`,
      icon: FaFileAlt,
      color: "bg-blue-500",
    },
    item.reviewedAt && {
      date: item.reviewedAt,
      label: `Reviewed — ${STATUS_CONFIG[item.status]?.label}`,
      icon: item.status === "approved" ? FaCheckCircle : FaTimesCircle,
      color: item.status === "approved" ? "bg-green-500" : "bg-red-500",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full ${ev.color} flex items-center justify-center flex-shrink-0`}
            >
              <ev.icon className="text-white text-[10px]" />
            </div>
            {i < events.length - 1 && <div className="w-px h-4 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-semibold text-gray-800">{ev.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtTime(ev.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


const ViewProposalDetails = ({ item, onBack, onResubmit, onSubmitNextStage }) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!item) return null;

  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const StatusIcon = sc.icon;

  const tabs = [
    { id: "details", label: "Details", icon: FaBookOpen },
    { id: "review", label: "Review Feedback", icon: FaCommentAlt },
    { id: "timeline", label: "Timeline", icon: FaHistory },
  ];

  return (
    <div
      className="space-y-5"
      style={{ animation: "slideUp .35s cubic-bezier(.22,1,.36,1) both" }}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors cursor-pointer group"
        >
          <FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform text-xs" />
          Back to Dashboard
        </button>
        <FaChevronRight className="text-xs text-gray-300" />
        <span className="font-semibold text-gray-800 truncate max-w-xs">{item.title}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      
        <div className={`h-1.5 w-full ${sc.bar}`} />

        <div className="p-6">
         
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${STAGE_COLORS[item.stage]}`}
            >
              {STAGE_LABELS[item.stage]}
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.cls}`}
            >
              <StatusIcon className="text-[11px]" /> {sc.label}
            </span>
            {item.downloads > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                <FaDownload className="text-[10px]" /> {item.downloads} downloads
              </span>
            )}
          </div>

  
          <h1 className="text-xl font-extrabold text-gray-900 leading-snug mb-2">{item.title}</h1>

        
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-5">
            <span className="flex items-center gap-1">
              <FaCalendarAlt /> Submitted {fmt(item.submittedAt)}
            </span>
            {item.institution && (
              <span className="flex items-center gap-1">
                <FaUniversity /> {item.institution}
              </span>
            )}
            {item.author && (
              <span className="flex items-center gap-1">
                <FaUserCircle /> {item.author}
              </span>
            )}
          </div>

         
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-4">
              Submission Progress
            </p>
            <StageProgress currentStage={item.stage} status={item.status} />
          </div>

           <div className="flex flex-wrap gap-2">
            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <FaDownload /> Download File
              </a>
            )}
            {item.status === "rejected" && onResubmit && (
              <button
                onClick={() => onResubmit(item)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
              >
                <FaFileAlt /> Resubmit (Free)
              </button>
            )}
            {item.status === "approved" &&
              item.stage !== "final_paper" &&
              onSubmitNextStage && (
                <button
                  onClick={() => onSubmitNextStage(item)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                  <FaChevronRight />
                  {item.stage === "proposal" ? "Submit Abstract" : "Submit Final Paper"}
                </button>
              )}
          </div>
        </div>
      </div>

    
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
   
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px
                ${activeTab === tab.id
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 border-transparent hover:text-blue-600 hover:bg-gray-50"}`}
            >
              <tab.icon className="text-xs" />
              {tab.label}
              {tab.id === "review" && item.reviewComment && (
                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  1
                </span>
              )}
            </button>
          ))}
        </div>

  
        <div className="p-6">
      
          {activeTab === "details" && (
            <div className="space-y-6">
              
              {item.abstract && (
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    Abstract
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {item.abstract}
                  </p>
                </div>
              )}

       
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Submission Info
                  </p>
                  <InfoRow label="Stage" value={STAGE_LABELS[item.stage]} icon={FaFlask} />
                  <InfoRow label="Submitted" value={fmt(item.submittedAt)} icon={FaCalendarAlt} />
                  {item.discipline && (
                    <InfoRow label="Discipline" value={item.discipline} icon={FaTag} />
                  )}
                  {item.keywords && (
                    <InfoRow label="Keywords" value={item.keywords} icon={FaGlobe} />
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Author Info
                  </p>
                  {item.author && (
                    <InfoRow label="Author" value={item.author} icon={FaUserCircle} />
                  )}
                  {item.institution && (
                    <InfoRow label="Institution" value={item.institution} icon={FaUniversity} />
                  )}
                  {item.coAuthors && (
                    <InfoRow label="Co-authors" value={item.coAuthors} icon={FaUserCircle} />
                  )}
                  {item.email && (
                    <InfoRow label="Contact" value={item.email} icon={FaGlobe} />
                  )}
                </div>
              </div>

              {(item.fileName || item.fileUrl) && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FaFileAlt className="text-blue-500 text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.fileName || "Submitted File"}
                      </p>
                      {item.fileSize && (
                        <p className="text-xs text-gray-400">{item.fileSize}</p>
                      )}
                    </div>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold"
                    >
                      <FaExternalLinkAlt className="text-[10px]" /> Open
                    </a>
                  )}
                </div>
              )}
            </div>
          )}


          {activeTab === "review" && (
            <div className="space-y-5">
              <ReviewerComment item={item} />

            
              {item.reviewHistory && item.reviewHistory.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-3">
                    Previous Reviews
                  </p>
                  <div className="space-y-3">
                    {item.reviewHistory.map((rev, i) => {
                      const rsc = STATUS_CONFIG[rev.status] || STATUS_CONFIG.pending;
                      const RIcon = rsc.icon;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border p-4 ${rsc.banner}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`flex items-center gap-1.5 text-xs font-semibold ${rsc.bannerText}`}
                            >
                              <RIcon className="text-[10px]" /> {rsc.label}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {fmtTime(rev.reviewedAt)}
                            </span>
                          </div>
                          {rev.comment && (
                            <p className={`text-xs leading-relaxed ${rsc.bannerText}`}>
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                  <FaStar className="text-yellow-400" /> What happens next?
                </p>
                <ul className="space-y-1.5 text-xs text-blue-700">
                  {item.status === "approved" && item.stage !== "final_paper" && [
                    "Your submission has been approved — congratulations!",
                    `You may now proceed to submit your ${item.stage === "proposal" ? "Abstract" : "Final Paper"}.`,
                    "Your progress is automatically saved.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5">
                      <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" /> {t}
                    </li>
                  ))}
                  {item.status === "rejected" && [
                    "Review the feedback carefully above.",
                    "Address all comments before resubmitting.",
                    "Resubmission is free of charge.",
                    "A different reviewer may assess your resubmission.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5">
                      <FaCheckCircle className="text-blue-400 mt-0.5 flex-shrink-0" /> {t}
                    </li>
                  ))}
                  {item.status === "pending" && [
                    "Your submission is currently being reviewed.",
                    "Expected review time: 3–5 business days.",
                    "You will receive an email once a decision is made.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5">
                      <FaClock className="text-yellow-500 mt-0.5 flex-shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

      
          {activeTab === "timeline" && (
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-4">
                Submission History
              </p>
              <Timeline item={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProposalDetails;
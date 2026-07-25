const  RESEARCHER_ROLES=Object.freeze({
    RESEARCHER : "researcher",   
    REVIEWER: "reviewer",
   RESEARCH_COMMITTEE: "research_committee",
});

const RESEARCHER_STATUSES= Object.freeze({
    ACTIVE: "active",
    INVITED: "invited",
    INACTIVE: "inactive",
    SUSPENDED:"suspended",
});
 
const RESEARCH_STAGES = Object.freeze({
  PROPOSAL:    "proposal",
  PROGRESS:    "progress",
  FINAL_PAPER: "final_paper",
});

const RESEARCH_STATUSES =Object.freeze({
  DRAFT:              "draft",
  AWAITING_PAYMENT:   "awaiting_payment",
  PENDING:            "pending",          // submitted, awaiting reviewer assignment
  UNDER_REVIEW:       "under_review",     // assigned, reviewer actively reviewing
  REVISION_REQUESTED: "revision_requested",
  PENDING_COMMITTEE_REVIEW: "pending_committee_review",
  APPROVED:           "approved",
  REJECTED:           "rejected",
  SUSPENDED:          "suspended",
});



const PAYMENT_TYPES = Object.freeze({
  PROPOSAL_SUBMISSION: "proposal_submission",
  PAPER_DOWNLOAD:      "paper_download",
});


const PAYMENT_STATUSES = Object.freeze({
  PENDING:   "pending",
  COMPLETED: "completed",
  FAILED:    "failed",
  CANCELLED: "cancelled",
  REFUNDED:  "refunded",
});


const REVIEW_DECISIONS = Object.freeze({
  APPROVED: "approved",
  REVISION: "revision",
  REJECTED: "rejected",
  SUSPENDED: "suspended", 
  NOTED: "noted"
});

const REVIEW_WINDOW_DAYS = Object.freeze({
  [RESEARCH_STAGES.PROPOSAL]: 21,
  [RESEARCH_STAGES.PROGRESS]: 14,
  [RESEARCH_STAGES.FINAL_PAPER]: 21,
});

const REVIEW_DECISION_DISPLAY = Object.freeze({
  approved: "approved",
  revision: "revision_needed",
  rejected: "rejected",
  suspended: "suspended",
});


const CERTIFICATE_TYPES = Object.freeze({
  PROPOSAL_APPROVAL: "proposal_approval",
  PUBLICATION:       "publication",
});


const MPESA_RESULT_CODES = Object.freeze({
  SUCCESS:    "0",
   INSUFFICIENT_FUNDS: "1",
  CANCELLED:  "1032",
  TIMEOUT:    "1037",
});

// ─── Proposal Submission Fee ─────────────────────────────────────────────────
// Change USE_PRODUCTION_AMOUNTS=true in .env to switch to real amounts
const FEES = Object.freeze({
  PROPOSAL_SUBMISSION: process.env.USE_PRODUCTION_AMOUNTS === "true" ? 150 : 1,
  DEFAULT_DOWNLOAD:    process.env.USE_PRODUCTION_AMOUNTS === "true" ? 150 : 1,
});


const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     50,
});

// ─── Token TTLs (hours) ───────────────────────────────────────────────────────
const TOKEN_TTL = Object.freeze({
  EMAIL_VERIFICATION:  24,
  PASSWORD_RESET:      1,
  REVIEWER_INVITE:     72,
  DOWNLOAD_TOKEN:      0.25, // 15 minutes
});


const STAGE_FLOW = Object.freeze({
  [RESEARCH_STAGES.PROPOSAL]:    RESEARCH_STAGES.PROGRESS,
  [RESEARCH_STAGES.PROGRESS]:    RESEARCH_STAGES.FINAL_PAPER,
  [RESEARCH_STAGES.FINAL_PAPER]: null,
});

const COMMITTEE_QUORUM = Object.freeze({ MIN_VOTES: 3, MAX_VOTES: 5 });

module.exports = { 
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  PAYMENT_TYPES, 
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  REVIEW_WINDOW_DAYS,
  REVIEW_DECISION_DISPLAY,
  CERTIFICATE_TYPES,
  MPESA_RESULT_CODES,
  FEES,
  PAGINATION,
  TOKEN_TTL,
  STAGE_FLOW,
  COMMITTEE_QUORUM
};
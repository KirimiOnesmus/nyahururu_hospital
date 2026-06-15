const  RESEARCHER_ROLES=Object.freeze({
    RESEARCHER : "researcher",   
    REVIEWER: "reviewer",
    ADMIN: "admin"
});

const RESEARCHER_STATUSES= Object.freeze({
    ACTIVE: "active",
    INVITED: "invited",
    INACTIVE: "inactive",
    SUSPENDED:"suspended",
});

const RESEARCH_STAGES = Object.freeze({
    PROPOSAL: "proposal",
    FINAL_PAPER: "final_paper",
});

const RESEARCH_STATUSES =Object.freeze({
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
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
  APPROVED:  "approved",
  REVISION:  "revision",
  REJECTED:  "rejected",
});


const CERTIFICATE_TYPES = Object.freeze({
  PROPOSAL_APPROVAL: "proposal_approval",
  PUBLICATION:       "publication",
});


const MPESA_RESULT_CODES = Object.freeze({
  SUCCESS:    "0",
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
  PASSWORD_RESET:      24,
  REVIEWER_INVITE:     72,
  DOWNLOAD_TOKEN:      0.25, // 15 minutes
});

module.exports = {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  CERTIFICATE_TYPES,
  MPESA_RESULT_CODES,
  FEES,
  PAGINATION,
  TOKEN_TTL,
};
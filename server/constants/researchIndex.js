const RESEARCHER_ROLES = Object.freeze({
  RESEARCHER:         "researcher",
  REVIEWER:           "reviewer",
  RESEARCH_COMMITTEE: "research_committee",
  CO_INVESTIGATOR:    "co_investigator",
});

const RESEARCHER_STATUSES = Object.freeze({
  ACTIVE:    "active",
  INVITED:   "invited",
  INACTIVE:  "inactive",
  SUSPENDED: "suspended",
});

const SUBMISSION_TYPES = Object.freeze({
  INITIAL_PROPOSAL:  "initial_proposal",
  AMENDMENT:         "amendment",
  CONTINUING_REVIEW: "continuing_review",
  STUDY_CLOSURE:     "study_closure",
});


const RESEARCH_STATUSES = Object.freeze({
  DRAFT:                    "draft",
  AWAITING_PAYMENT:         "awaiting_payment",
  SUBMITTED:                "submitted",
  RETURNED_FOR_CORRECTION:  "returned_for_correction",
  UNDER_REVIEW:             "under_review",
  REVISION_REQUESTED:       "revision_requested",
  PENDING_COMMITTEE_REVIEW: "pending_committee_review",
  // Chair's change #8: committee finalization no longer transitions
  // straight to a researcher-facing outcome. It holds here until the
  // Research Officer explicitly releases the Compiled Decision Report.
  PENDING_OFFICER_REVIEW:   "pending_officer_review",
  APPROVED:                 "approved",
  REJECTED:                 "rejected",
  EXPIRED:                  "expired",
  CLOSED:                   "closed",
  SUSPENDED:                "suspended",
});


const REVIEW_TYPES = Object.freeze({
  FULL_COMMITTEE: "full_committee",
  EXPEDITED:      "expedited",
  SECRETARIAT:    "secretariat",
});


const CLOSURE_REASONS = Object.freeze({
  COMPLETED:                 "completed",
  PREMATURE_DISCONTINUATION: "premature_discontinuation",
  NOT_STARTED:               "not_started",
  TRANSFERRED:               "transferred",
});


const PAYMENT_TYPES = Object.freeze({
  PROPOSAL_SUBMISSION: "proposal_submission",
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
  SUSPENDED: "suspended",
  NOTED:     "noted",
});


const REVIEWER_LIMITS = Object.freeze({
  MIN: 2,
  MAX: 5,
});

const REVIEWER_ASSIGNMENT_STATUS = Object.freeze({
  PENDING:   "pending",
  SUBMITTED: "submitted",
});


const REVIEW_WINDOW_DAYS = Object.freeze({
  // Chair's change #10: initial-proposal review window extended from 3
  // to 4 weeks. Only affects newly assigned reviews (assignReviewers).
  [SUBMISSION_TYPES.INITIAL_PROPOSAL]:  28,
  [SUBMISSION_TYPES.AMENDMENT]:         14,
  [SUBMISSION_TYPES.CONTINUING_REVIEW]: 14,
  [SUBMISSION_TYPES.STUDY_CLOSURE]:     21,
});

// Chair's change #9: reviewers get a reminder email if no action is
// taken within this many days of assignment.
const REVIEWER_REMINDER_DAYS = 7;

const REVIEW_DECISION_DISPLAY = Object.freeze({
  approved:  "approved",
  revision:  "revision_needed",
  rejected:  "rejected",
  suspended: "suspended",
});


const CERTIFICATE_TYPES = Object.freeze({
  PROPOSAL_APPROVAL: "proposal_approval",
  ETHICS_CLEARANCE:  "ethics_clearance",
});


const MPESA_RESULT_CODES = Object.freeze({
  SUCCESS:            "0",
  INSUFFICIENT_FUNDS: "1",
  CANCELLED:          "1032",
  TIMEOUT:            "1037",
});

const FEES = Object.freeze({
  PROPOSAL_SUBMISSION: process.env.USE_PRODUCTION_AMOUNTS === "true" ? 150 : 1,
});


const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     50,
});


const TOKEN_TTL = Object.freeze({
  EMAIL_VERIFICATION: 24,
  PASSWORD_RESET:     1,
  REVIEWER_INVITE:    72,
});


const COMMITTEE_QUORUM = Object.freeze({ MIN_VOTES: 3, MAX_VOTES: 5 });


const CRITERIA_KEYS_BY_TYPE = Object.freeze({
  [SUBMISSION_TYPES.INITIAL_PROPOSAL]: [
    "originality", "relevance", "feasibility",
    "ethics", "expectedImpact",
  ],
  [SUBMISSION_TYPES.AMENDMENT]: [
    "justification", "ethicalImplications",
    "methodologicalSoundness", "protocolConsistency",
  ],
  [SUBMISSION_TYPES.CONTINUING_REVIEW]: [
    "methodologyCompliance", "dataQuality",
    "ethicalCompliance", "researchProgress",
  ],
  [SUBMISSION_TYPES.STUDY_CLOSURE]: [
    "completeness", "dataIntegrity",
    "participantSafety", "dissemination",
  ],
});


const KEMRI_PROGRAMMES = Object.freeze([
  "Biotechnology",
  "Traditional Medicine & Drug Development",
  "Infectious and Parasitic Diseases",
  "Public Health and Health Systems",
  "Non-Communicable Diseases",
  "Sexual, Reproductive, Adolescent and Child Health",
]);


const APPROVAL_VALIDITY_MONTHS = 12;

module.exports = {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  SUBMISSION_TYPES,
  RESEARCH_STATUSES,
  REVIEW_TYPES,
  CLOSURE_REASONS,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  REVIEWER_LIMITS,
  REVIEWER_ASSIGNMENT_STATUS,
  REVIEW_WINDOW_DAYS,
  REVIEWER_REMINDER_DAYS,
  REVIEW_DECISION_DISPLAY,
  CERTIFICATE_TYPES,
  MPESA_RESULT_CODES,
  FEES,
  PAGINATION,
  TOKEN_TTL,
  COMMITTEE_QUORUM,
  CRITERIA_KEYS_BY_TYPE,
  KEMRI_PROGRAMMES,
  APPROVAL_VALIDITY_MONTHS,
};
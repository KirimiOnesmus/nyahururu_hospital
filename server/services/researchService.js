"use strict";

const path = require("path");
const { Op, UniqueConstraintError } = require("sequelize");
const crypto = require("crypto");
const {
  Research,
  Researcher,
  Payment,
  Review,
  ResearchReviewer,
  ResearchDecisionReport,
  CoInvestigatorAssignment,
  ContinuingReviewDetail,
  ClosureDetail,
  User,
  sequelize,
} = require("../sequelize/models");
const mpesa = require("../utils/mpesaService");
const email = require("../utils/emailServices");
const { issueDecisionLetter } = require("./decisionLetterService");
const certificateService = require("./certificateService");
const { AppError } = require("../utils/appError");


const parseJsonField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const stageDetailToLegacy = (src = {}) => {

  const plain = typeof src.toJSON === "function" ? src.toJSON() : src;

  const out = {};
  const cr = plain.continuingReviewDetail;
  if (cr) {
    out.continuingReviewData = {
      progressSummary: cr.progressSummary,
      participantsEnrolled: cr.participantsEnrolled,
      participantsContinuing: cr.participantsContinuing,
      adverseEvents: cr.adverseEvents,
      amendments: cr.amendments,
      constraints: cr.constraints,
      plansForNextYear: cr.plansForNextYear,
      isLastYear: cr.isLastYear,
      submittedAt: cr.submittedAt,
    };

    out.progressFiles = parseJsonField(cr.documents);
  }
  const cl = plain.closureDetail;
  if (cl) {
    out.closureReason = cl.closureReason;
    out.closureReport = {
      resultsSummary: cl.resultsSummary,
      publications: cl.publications,
      participantIdentifiersDestroyed: cl.participantIdentifiersDestroyed,
      specimenDisposalPlan: cl.specimenDisposalPlan,
      dataFutureUsePlan: cl.dataFutureUsePlan,
      investigationalProductDisposal: cl.investigationalProductDisposal,
      submittedAt: cl.submittedAt,
    };
    out.closeoutReportFile = cl.closeoutReportFile;
    out.closeoutReportFileKey = cl.closeoutReportFileKey;
    out.publicationLink = cl.publicationLink;
  }
  return out;
};

const attachChildSubmissions = async (papers) => {
  const parentIds = papers.map((p) => p.id);
  if (!parentIds.length) return;
  const children = await Research.findAll({
    where: { parentResearchId: { [Op.in]: parentIds }, isDeleted: false },
    attributes: [
      "id",
      "researchId",
      "title",
      "submissionType",
      "status",
      "continuingReviewNumber",
      "amendmentNumber",
      "reviewComment",
      "committeeComment",
      "parentResearchId",
      "seruNumber",
      "aggregateScore",
      "approvalValidUntil",
      "createdAt",
      "updatedAt",
    ],
    include: [
      ContinuingReviewDetail && {
        model: ContinuingReviewDetail, as: "continuingReviewDetail", required: false,
      },
      ClosureDetail && {
        model: ClosureDetail, as: "closureDetail", required: false,
      },
    ].filter(Boolean),
    order: [["createdAt", "ASC"]],
  });
  const byParent = {};
  children.forEach((c) => {
    const obj = c.toJSON();
    Object.assign(obj, stageDetailToLegacy(obj));
    delete obj.continuingReviewDetail;
    delete obj.closureDetail;
    (byParent[obj.parentResearchId] ||= []).push(obj);
  });
  papers.forEach((p) => p.setDataValue("childSubmissions", byParent[p.id] || []));
};
const notifyResearchOfficer = async (emailMethod, data) => {
  try {
    const { User } = require("../sequelize/models");
    const officers = await User.findAll({
      where: { role: "research" },
      attributes: ["id", "name", "email"],
      raw: true,
    });
    if (!officers.length) {

      const admins = await User.findAll({
        where: { role: "superadmin" },
        attributes: ["id", "name", "email"],
        limit: 1,
        raw: true,
      });
      officers.push(...admins);
    }
    for (const officer of officers) {
      if (email[emailMethod]) {
        await email[emailMethod]({ ...data, email: officer.email, name: officer.name });
      }
    }
  } catch (err) {
    console.error(`[notifyResearchOfficer] ${emailMethod} failed:`, err.message);
  }
};

const {
  SUBMISSION_TYPES,
  RESEARCH_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  REVIEW_TYPES,
  FEES,
  PAGINATION,
  REVIEW_WINDOW_DAYS,
  REVIEW_DECISION_DISPLAY,
  COMMITTEE_QUORUM,
  CRITERIA_KEYS_BY_TYPE,
  REVIEWER_LIMITS,
  REVIEWER_ASSIGNMENT_STATUS,
  APPROVAL_VALIDITY_MONTHS,
} = require("../constants/researchIndex");

const likeEscape = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);


const MAX_CO_INVESTIGATORS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeCoInvestigators = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of list) {
    if (out.length >= MAX_CO_INVESTIGATORS) break;
    if (!entry || typeof entry !== "object") continue;
    const email = String(entry.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || email.length > 254) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      name: String(entry.name || "").trim().slice(0, 150),
      role: String(entry.role || "").trim().slice(0, 150),
    });
  }
  return out;
};

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const fmtRelativeTime = (date) => {
  if (!date) return "";
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const SUBMISSION_LABEL = {
  [SUBMISSION_TYPES.INITIAL_PROPOSAL]: "Initial Proposal",
  [SUBMISSION_TYPES.AMENDMENT]: "Amendment",
  [SUBMISSION_TYPES.CONTINUING_REVIEW]: "Continuing Review",
  [SUBMISSION_TYPES.STUDY_CLOSURE]: "Study Closure",
};
const STAGE_STATUS_MAP = {
  proposal: [
    RESEARCH_STATUSES.DRAFT,
    RESEARCH_STATUSES.AWAITING_PAYMENT,
    RESEARCH_STATUSES.SUBMITTED,
    RESEARCH_STATUSES.RETURNED_FOR_CORRECTION,
  ],
  progress: [
    RESEARCH_STATUSES.UNDER_REVIEW,
    RESEARCH_STATUSES.REVISION_REQUESTED,
    RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
    RESEARCH_STATUSES.SUSPENDED,
  ],
  final_paper: [
    RESEARCH_STATUSES.APPROVED,
    RESEARCH_STATUSES.EXPIRED,
    RESEARCH_STATUSES.CLOSED,
    RESEARCH_STATUSES.REJECTED,
  ],
};
const validateCriteria = (submissionType, criteria = {}) => {
  const allowedKeys = CRITERIA_KEYS_BY_TYPE[submissionType];
  if (!allowedKeys)
    throw new AppError(`No criteria for type '${submissionType}'.`, 400);
  const unknownKeys = Object.keys(criteria).filter(
    (k) => !allowedKeys.includes(k),
  );
  if (unknownKeys.length) {
    throw new AppError(
      `Unrecognized criteria: ${unknownKeys.join(", ")}.`,
      400,
    );
  }
  const cleaned = {};
  for (const key of allowedKeys) {
    const value = Number(criteria[key]);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      throw new AppError(
        `Criteria '${key}' must be 0–10. Got: ${JSON.stringify(criteria[key])}.`,
        400,
      );
    }
    cleaned[key] = value;
  }
  return cleaned;
};

const tallyCommitteeVotes = (votes) => {
  const counts = {};
  votes.forEach((v) => {
    counts[v.decision] = (counts[v.decision] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { counts, sorted };
};

const deriveOutcome = (votes) => {
  if (!votes.length) return "pending_clarification";
  const { counts, sorted } = tallyCommitteeVotes(votes);
  const [leaderDecision] = sorted[0];
  if (leaderDecision !== REVIEW_DECISIONS.APPROVED)
    return "pending_clarification";
  return Object.keys(counts).length === 1
    ? "highly_recommended"
    : "approved_minors";
};

const averageVoteScore = (votes) => {
  const scored = votes.filter((v) => Object.keys(v.criteria || {}).length);
  if (!scored.length) return null;
  const total = scored.reduce((sum, v) => {
    const vals = Object.values(v.criteria);
    return sum + vals.reduce((s, x) => s + x, 0) / vals.length;
  }, 0);
  return Number((total / scored.length).toFixed(1));
};

const RESEARCHER_LIST_INCLUDE = [
  {
    model: Researcher,
    as: "researcher",
    attributes: ["id", "name", "institution"],
  },
];

const NOTE_ROUND = 0;


const computeAccessFlags = async (id, caller = {}, paper = null) => {
  const { researcher, user } = caller;

  const isStaff =
    user && ["admin", "superadmin", "research"].includes(user.role);
  const isCommittee =
    researcher?.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE ||
    researcher?.isCommittee;

  let record = paper;
  if (!record) {
    record = await Research.findByPk(id, { attributes: ["id", "researcherId"] });
    if (!record) throw new AppError("Research not found.", 404);
  }

  const isOwner =
    researcher && String(record.researcherId) === String(researcher.id);

  let isAssignedReviewer = false;
  if (researcher?.role === RESEARCHER_ROLES.REVIEWER) {
    isAssignedReviewer = await ResearchReviewer.isAssigned(id, researcher.id);
  }

  let isCoInvestigator = false;
  if (researcher && CoInvestigatorAssignment) {
    isCoInvestigator = await CoInvestigatorAssignment.isCoInvestigator(
      id,
      researcher.id,
    );
  }

  return { isStaff, isCommittee, isOwner, isAssignedReviewer, isCoInvestigator, record };
};

const assertResearchAccess = async (id, caller = {}, paper = null) => {
  const { isStaff, isCommittee, isOwner, isAssignedReviewer, isCoInvestigator } =
    await computeAccessFlags(id, caller, paper);

  if (
    !isStaff &&
    !isCommittee &&
    !isOwner &&
    !isAssignedReviewer &&
    !isCoInvestigator
  ) {
    throw new AppError("You do not have access to this research.", 403);
  }
};


const ALWAYS_REDACTED_RESEARCH_KEYS = [
  "assignedReviewer",
  "reviewer",
  "committeeReviewer",
  "reviewerAssignments",
  // Not consumed by any researcher-facing view; withheld defensively.
  "aggregateScore",
  "proposalReview",
];
const PRE_RELEASE_ONLY_KEYS = ["reviewDecision", "reviewComment"];
const PRE_RELEASE_HOLDING_STATUSES = [
  RESEARCH_STATUSES.UNDER_REVIEW,
  RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  RESEARCH_STATUSES.PENDING_OFFICER_REVIEW,
];

const redactResearchForCaller = async (paper, flags) => {
  const { isStaff, isCommittee, isOwner, isCoInvestigator } = flags;
  if (isStaff || isCommittee) return paper; // full visibility

  if (isOwner || isCoInvestigator) {
    const json = typeof paper.toJSON === "function" ? paper.toJSON() : { ...paper };
    for (const key of ALWAYS_REDACTED_RESEARCH_KEYS) {
      delete json[key];
    }
    if (PRE_RELEASE_HOLDING_STATUSES.includes(paper.status)) {
      for (const key of PRE_RELEASE_ONLY_KEYS) {
        delete json[key];
      }
    }
    const { submitted, total } = await ResearchReviewer.checkAllSubmitted(paper.id);
    json.reviewProgressSummary = total
      ? `${submitted} of ${total} reviews submitted`
      : "No reviewers assigned yet";
    return json;
  }

  return paper;
};

const getResearchById = async (id, caller = {}) => {
  const includes = [
    {
      model: Researcher,
      as: "researcher",
      attributes: ["id", "name", "institution", "bio", "socialLinks", "email"],
    },
  ];

  try {
    includes.push({
      model: Researcher,
      as: "assignedReviewer",
      attributes: [
        "id",
        "name",
        "firstName",
        "lastName",
        "email",
        "institution",
      ],
      required: false,
    });
  } catch {}
  try {
    includes.push({
      model: Researcher,
      as: "reviewer",
      attributes: ["id", "name"],
      required: false,
    });
  } catch {}
  try {
    includes.push({
      model: Researcher,
      as: "committeeReviewer",
      attributes: ["id", "name"],
      required: false,
    });
  } catch {}
  try {
    includes.push({
      model: Research,
      as: "parentResearch",
      attributes: ["id", "title", "researchId", "seruNumber"],
      required: false,
    });
  } catch {}
  if (ContinuingReviewDetail) {
    try {
      includes.push({
        model: ContinuingReviewDetail,
        as: "continuingReviewDetail",
        required: false,
      });
    } catch {}
  }
  if (ClosureDetail) {
    try {
      includes.push({
        model: ClosureDetail,
        as: "closureDetail",
        required: false,
      });
    } catch {}
  }

  if (ResearchReviewer) {
    try {
      includes.push({
        model: ResearchReviewer,
        as: "reviewerAssignments",
        required: false,
        include: [
          {
            model: Researcher,
            as: "reviewer",
            attributes: [
              "id",
              "name",
              "firstName",
              "lastName",
              "email",
              "institution",
            ],
          },
        ],
      });
    } catch {}
  }

  let paper;
  try {
    paper = await Research.findByPk(id, { include: includes });
  } catch (err) {
    console.error(`[getResearchById] Query failed for id=${id}:`, err.message);
    paper = await Research.findByPk(id);
  }

  if (!paper) throw new AppError("Research not found.", 404);

  const flags = await computeAccessFlags(id, caller, paper);
  if (
    !flags.isStaff &&
    !flags.isCommittee &&
    !flags.isOwner &&
    !flags.isAssignedReviewer &&
    !flags.isCoInvestigator
  ) {
    throw new AppError("You do not have access to this research.", 403);
  }

  const redacted = await redactResearchForCaller(paper, flags);

  let childSubmissions = [];
  let parentSummary = null;
  if (paper.parentResearchId) {

    const parent = await Research.findByPk(paper.parentResearchId, {
      attributes: [
        "id", "researchId", "title", "seruNumber", "status", "submissionType",
        "discipline", "abstract", "background", "objectives", "methodology",
        "expectedOutcome", "justification", "hypotheses", "literatureReviewSummary",
        "researchProgramme", "keyPerformanceArea", "strategy", "sdg",
        "protocolVersionNumber", "protocolVersionDate",
        "studyImplementationCounties", "studySites", "coInvestigators",
        "fundingSource", "totalFundsNeeded", "expectedDurationMonths",
        "inclusionCriteria", "exclusionCriteria", "sampleSizeDescription",
        "samplingProcedure", "dataManagementPlan", "ethicsHumanSubjects",
        "ethicsAnimalSubjects", "budgetSummary", "budgetJustification",
        "expectedApplicationOfResults", "studyDesign",
        "informedConsentDocs", "studyToolsDocs", "investigatorCertificates",
        "supportingDocuments", "proposalFile", "proposalFileKey",
        "approvedAt", "approvalValidUntil", "createdAt",
      ],
    });
    parentSummary = parent ? parent.toJSON() : null;
  } else {
    const children = await Research.findAll({
      where: { parentResearchId: paper.id, isDeleted: false },
      attributes: [
        "id", "researchId", "title", "submissionType", "status",
        "continuingReviewNumber", "amendmentNumber",
        "createdAt", "updatedAt",
      ],
      include: [
        ContinuingReviewDetail && {
          model: ContinuingReviewDetail, as: "continuingReviewDetail", required: false,
        },
        ClosureDetail && {
          model: ClosureDetail, as: "closureDetail", required: false,
        },
      ].filter(Boolean),
      order: [["createdAt", "ASC"]],
    });
    childSubmissions = children.map((c) => {
      const obj = c.toJSON();
      Object.assign(obj, stageDetailToLegacy(obj));
      delete obj.continuingReviewDetail;
      delete obj.closureDetail;
      return obj;
    });
  }


  const legacy = stageDetailToLegacy(
    typeof paper.toJSON === "function" ? paper.toJSON() : paper,
  );

  if (typeof redacted.setDataValue === "function") {
    redacted.setDataValue("childSubmissions", childSubmissions);
    redacted.setDataValue("parentSummary", parentSummary);
    Object.entries(legacy).forEach(([k, v]) => redacted.setDataValue(k, v));
   
    redacted.setDataValue("continuingReviewDetail", undefined);
    redacted.setDataValue("closureDetail", undefined);
    return redacted;
  }
  const out = { ...redacted, ...legacy, childSubmissions, parentSummary };
  delete out.continuingReviewDetail;
  delete out.closureDetail;
  return out;
};

const getRevisionComparison = async (researchId, caller = {}) => {
  await assertResearchAccess(researchId, caller);

  const research = await Research.findByPk(researchId, {
    attributes: [
      "id",
      "title",
      "seruNumber",
      "researchId",
      "resubmissionCount",
      "revisionHistory",
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const revisions = Array.isArray(research.revisionHistory)
    ? research.revisionHistory
    : [];

  return {
    researchId: research.id,
    title: research.title,
    seruNumber: research.seruNumber,
    researchCode: research.researchId,
    resubmissionCount: research.resubmissionCount,
    revisions,
    latest: revisions.length ? revisions[revisions.length - 1] : null,
  };
};

const getMyResearch = async (researcherId, { page, limit, submissionType }) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const where = {
    researcherId,
    isDeleted: false,
    submissionType: submissionType || SUBMISSION_TYPES.INITIAL_PROPOSAL,
  };

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "reviewComment",
      "committeeComment",
      "createdAt",
      "updatedAt",
      "researchId",
      "seruNumber",
      "submissionPaymentId",
      "approvalValidUntil",
      "parentResearchId",
      "resubmissionCount",
    ],
    include: [
      {
        model: Payment,
        as: "submissionPayment",
        attributes: [
          "id",
          "status",
          "amount",
          "mpesaReceiptNumber",
          "checkoutRequestId",
          "createdAt",
        ],
      },
      {
        model: ResearchReviewer,
        as: "reviewerAssignments",
        required: false,
        attributes: ["id", "reviewStatus", "assignedAt"],
        include: [
          {
            model: Researcher,
            as: "reviewer",
            attributes: ["id", "name", "firstName", "lastName", "email"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });


  const parentIds = papers.map((p) => p.id);
  if (parentIds.length) {
    const children = await Research.findAll({
      where: { parentResearchId: { [Op.in]: parentIds }, isDeleted: false },
      attributes: [
        "id",
        "researchId",
        "title",
        "submissionType",
        "status",
        "continuingReviewNumber",
        "amendmentNumber",
        "reviewComment",
        "committeeComment",
        "parentResearchId",
        "seruNumber",
        "approvalValidUntil",
        "createdAt",
        "updatedAt",
      ],

      include: [
        ContinuingReviewDetail && {
          model: ContinuingReviewDetail, as: "continuingReviewDetail", required: false,
        },
        ClosureDetail && {
          model: ClosureDetail, as: "closureDetail", required: false,
        },
      ].filter(Boolean),
      order: [["createdAt", "ASC"]],
    });
    const byParent = {};
    children.forEach((c) => {

      const obj = c.toJSON();
      Object.assign(obj, stageDetailToLegacy(obj));
      delete obj.continuingReviewDetail;
      delete obj.closureDetail;
      (byParent[obj.parentResearchId] ||= []).push(obj);
    });
    papers.forEach((p) =>
      p.setDataValue("childSubmissions", byParent[p.id] || []),
    );
  }

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const initiateProposalPayment = async ({ phone, researcherId }) => {
  const amount = FEES.PROPOSAL_SUBMISSION;
  const stkResult = await mpesa.initiateSTKPush({
    phone,
    amount,
    accountRef: "Proposal",
    description: "Research proposal submission fee",
  });
  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription || "Payment initiation failed.",
      502,
    );
  }
  const payment = await Payment.create({
    researcherId,
    type: PAYMENT_TYPES.PROPOSAL_SUBMISSION,
    amount,
    phone,
    merchantRequestId: stkResult.MerchantRequestID,
    checkoutRequestId: stkResult.CheckoutRequestID,
    status: PAYMENT_STATUSES.PENDING,
  });
  return {
    message:
      stkResult.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    checkoutRequestId: stkResult.CheckoutRequestID,
    paymentId: payment.id,
    amount,
  };
};

const confirmProposalSubmission = async (researcher, body, file, conditionalDocs = {}) => {
  const {
    paymentId,
    title,
    discipline,
    abstract,
    background,
    objectives,
    methodology,
    expectedOutcome,
    timeline,
    teamMembers,
    references,

    protocolVersionNumber,
    protocolVersionDate,
    researchProgramme,
    keyPerformanceArea,
    strategy,
    sdg,
    studyImplementationCounties,
    fundingSource,
    totalFundsNeeded,
    expectedDurationMonths,
    hypotheses,
    justification,
    literatureReviewSummary,
    inclusionCriteria,
    exclusionCriteria,
    sampleSizeDescription,
    samplingProcedure,
    dataManagementPlan,
    ethicsInformation,
    ethicsHumanSubjects,
    ethicsAnimalSubjects,
    budgetSummary,
    budgetJustification,
    expectedApplicationOfResults,
    coInvestigators,
    studySites,
    studyDesign,
    isInvestigationalProduct,
  } = body;

  const similar = await Research.findSimilarTitles(title);
  if (similar.length) {
    throw new AppError(
      `A similar title exists: "${similar[0].title}". Use a more distinct title.`,
      409,
    );
  }

  const txResult = await sequelize.transaction(async (t) => {
    const payment = await Payment.findByPk(paymentId, { transaction: t });
    if (!payment) throw new AppError("Payment record not found.", 404);
    if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
      throw new AppError(
        `Payment is ${payment.status}. Complete the M-Pesa payment first.`,
        400,
      );
    }
    if (!payment.researcherId) {
      payment.researcherId = researcher.id;
      await payment.save({ transaction: t });
    }

    const proposalFile = file ? `/uploads/proposal/${file.filename}` : null;
    const proposalFileKey = file?.key || null;

    let counties = [];
    try {
      counties = Array.isArray(studyImplementationCounties)
        ? studyImplementationCounties
        : typeof studyImplementationCounties === "string"
          ? JSON.parse(studyImplementationCounties || "[]")
          : [];
    } catch {
      counties = [];
    }

    let coInvParsed = [];
    try {
      coInvParsed = Array.isArray(coInvestigators)
        ? coInvestigators
        : typeof coInvestigators === "string"
          ? JSON.parse(coInvestigators || "[]")
          : [];
    } catch {
      coInvParsed = [];
    }
    coInvParsed = sanitizeCoInvestigators(coInvParsed);

    let sitesParsed = [];
    try {
      sitesParsed = Array.isArray(studySites)
        ? studySites
        : typeof studySites === "string"
          ? JSON.parse(studySites || "[]")
          : [];
    } catch {
      sitesParsed = [];
    }


    const { acucApprovalDoc, insuranceCertificateDoc } = conditionalDocs;
    const involvesAnimalSubjects = !!ethicsAnimalSubjects?.trim();
    const involvesInvestigationalProduct =
      isInvestigationalProduct === true || isInvestigationalProduct === "true";

    if (involvesAnimalSubjects && !acucApprovalDoc) {
      throw new AppError(
        "An ACUC approval letter is required for studies involving animal subjects (SOP-1 Annex 3).",
        400,
      );
    }
    if (involvesInvestigationalProduct && !insuranceCertificateDoc) {
      throw new AppError(
        "A clinical-trial insurance certificate is required for studies involving an investigational product (SOP-1 §10.6).",
        400,
      );
    }

    const investigatorCertificates = [];
    if (acucApprovalDoc) {
      investigatorCertificates.push({
        documentType: "acuc_approval",
        label: "ACUC Approval Letter",
        url: `/uploads/proposal/${acucApprovalDoc.filename}`,
        key: acucApprovalDoc.key || null,
      });
    }
    if (insuranceCertificateDoc) {
      investigatorCertificates.push({
        documentType: "insurance_certificate",
        label: "Clinical Trial Insurance Certificate",
        url: `/uploads/proposal/${insuranceCertificateDoc.filename}`,
        key: insuranceCertificateDoc.key || null,
      });
    }

    const newResearch = await Research.create(
      {
        title,
        discipline,
        abstract,
        background,
        objectives: Array.isArray(objectives)
          ? objectives.filter(Boolean).join("\n")
          : objectives || "",
        methodology,
        expectedOutcome,
        timeline,
        teamMembers,
        references,
        proposalFile,
        proposalFileKey,
        investigatorCertificates,
        researcherId: researcher.id,
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: RESEARCH_STATUSES.SUBMITTED,
        submissionPaymentId: payment.id,
        // SERU fields
        protocolVersionNumber,
        protocolVersionDate,
        researchProgramme,
        keyPerformanceArea,
        strategy,
        sdg,
        studyImplementationCounties: counties,
        fundingSource,
        totalFundsNeeded: totalFundsNeeded ? Number(totalFundsNeeded) : null,
        expectedDurationMonths: expectedDurationMonths
          ? Number(expectedDurationMonths)
          : null,
        hypotheses,
        justification,
        literatureReviewSummary,
        inclusionCriteria,
        exclusionCriteria,
        sampleSizeDescription,
        samplingProcedure,
        dataManagementPlan,
        ethicsInformation,
        ethicsHumanSubjects,
        ethicsAnimalSubjects,
        budgetSummary,
        budgetJustification,
        expectedApplicationOfResults,
        coInvestigators: coInvParsed,
        studySites: sitesParsed,
        reviewType: REVIEW_TYPES.FULL_COMMITTEE,

        studyDesign: studyDesign || null,
        isInvestigationalProduct:
          isInvestigationalProduct === true ||
          isInvestigationalProduct === "true",
      },
      { transaction: t },
    );

    await newResearch.generateSeruNumber({ transaction: t });
    await newResearch.save({ transaction: t });

    payment.researchId = newResearch.id;

    payment.seruNumber = newResearch.seruNumber;
    await payment.save({ transaction: t });


    return { newResearch, payment, coInvParsed };
  });
  const { newResearch, payment, coInvParsed } = txResult;

  if (coInvParsed.length) {
    processCoInvestigators(newResearch, coInvParsed, researcher).catch((err) =>
      console.error("[confirmProposal] co-inv processing failed:", err.message),
    );
  }

  email
    .sendProposalSubmitted?.({
      email: researcher.email,
      name: researcher.name || researcher.firstName,
      proposalTitle: newResearch.title,
      mpesaReceipt: payment.mpesaReceiptNumber,
      amount: payment.amount,
      seruNumber: newResearch.seruNumber,
    })
    .catch((err) =>
      console.error("[confirmProposal] email failed:", err.message),
    );


  notifyResearchOfficer("sendProposalSubmittedToOfficer", {
    proposalTitle: newResearch.title,
    researcherName: researcher.name || researcher.firstName,
    seruNumber: newResearch.seruNumber,
    submissionType: newResearch.submissionType,
  }).catch((err) => console.error("[confirmProposal] RO notify failed:", err.message));

  return newResearch;
};

const processCoInvestigators = async (research, coInvList, piResearcher) => {
  const { TOKEN_TTL } = require("../constants/researchIndex");
  const piName =
    piResearcher.name || piResearcher.firstName || "Principal Investigator";

  
  const safeList = sanitizeCoInvestigators(coInvList).slice(0, MAX_CO_INVESTIGATORS);

  for (const coInv of safeList) {
    if (!coInv.email?.trim()) continue;

    const coEmail = coInv.email.trim().toLowerCase();

    if (coEmail === piResearcher.email?.toLowerCase()) continue;

    try {
      let researcher = await Researcher.findByEmail(coEmail);

      if (researcher) {
        await CoInvestigatorAssignment.findOrCreate({
          where: { researchId: research.id, researcherId: researcher.id },
          defaults: {
            invitedById: piResearcher.id,
            roleOnStudy: coInv.role || null,
          },
        });

        email
          .sendCoInvestigatorAdded?.({
            email: researcher.email,
            name: researcher.name || researcher.firstName,
            proposalTitle: research.title,
            piName,
          })
          .catch((err) =>
            console.error(
              `[processCoInvestigators] sendCoInvestigatorAdded failed for ${coEmail}:`,
              err.message,
            ),
          );
      } else {
        const nameParts = (coInv.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "Researcher";
        const lastName = nameParts.slice(1).join(" ") || "";

        researcher = Researcher.build({
          firstName,
          lastName,
          email: coEmail,
          role: RESEARCHER_ROLES.CO_INVESTIGATOR,
          status: RESEARCHER_STATUSES.INVITED,
          password: crypto.randomBytes(16).toString("hex"),
          emailVerified: false,
          invitedByAdminId: piResearcher.id,
          invitedByAdminName: piName,
          invitedAt: new Date(),
        });

        const rawToken = researcher.generateToken(
          "invite",
          TOKEN_TTL.REVIEWER_INVITE,
        );
        await researcher.save();

        await CoInvestigatorAssignment.create({
          researchId: research.id,
          researcherId: researcher.id,
          invitedById: piResearcher.id,
          roleOnStudy: coInv.role || null,
        });

        const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(coEmail)}`;

        email
          .sendCoInvestigatorInvite?.({
            email: coEmail,
            name: firstName,
            inviteLink,
            invitedBy: piName,
            proposalTitle: research.title,
          })
          .catch((err) =>
            console.error(
              `[processCoInvestigators] sendCoInvestigatorInvite failed for ${coEmail}:`,
              err.message,
            ),
          );
      }
    } catch (err) {
      console.error(
        `[processCoInvestigators] Failed for ${coEmail}:`,
        err.message,
      );
    }
  }
};

const submitAmendment = async (researcher, body, file) => {
  const {
    parentResearchId,
    amendmentDetails,
    title,
    protocolVersionNumber,
    protocolVersionDate,
    isSubstantialAmendment,

    abstract,
    methodology,
    objectives,
    inclusionCriteria,
    exclusionCriteria,
    coInvestigators,
    studySites,
    fundingSource,
  } = body;

  const parentResearch = await Research.findOne({
    where: { id: parentResearchId, researcherId: researcher.id },
  });
  if (!parentResearch)
    throw new AppError(
      "Parent research not found or does not belong to you.",
      404,
    );
  if (!parentResearch.canSubmitAmendment) {
    throw new AppError(
      "Amendments can only be submitted for research that needs revision.",
      400,
    );
  }
  if (!amendmentDetails || !amendmentDetails.trim()) {
    throw new AppError("Amendment details are required.", 400);
  }

  const existingAmendments = await Research.count({
    where: { parentResearchId, submissionType: SUBMISSION_TYPES.AMENDMENT },
  });

  const proposalFile = file ? `/uploads/proposal/${file.filename}` : null;
  const proposalFileKey = file?.key || null;

  const isSubstantial =
    isSubstantialAmendment === true || isSubstantialAmendment === "true";
  const reviewType = isSubstantial
    ? REVIEW_TYPES.FULL_COMMITTEE
    : REVIEW_TYPES.SECRETARIAT;

  const amendmentCoInv = coInvestigators
    ? sanitizeCoInvestigators(
        Array.isArray(coInvestigators)
          ? coInvestigators
          : JSON.parse(coInvestigators || "[]"),
      )
    : Array.isArray(parentResearch.coInvestigators)
      ? parentResearch.coInvestigators
      : [];
  const existingEmails = new Set(
    (Array.isArray(parentResearch.coInvestigators) ? parentResearch.coInvestigators : [])
      .map((c) => c.email?.toLowerCase())
      .filter(Boolean),
  );
  const newlyAddedCoInv = amendmentCoInv.filter(
    (c) => c.email && !existingEmails.has(c.email.toLowerCase()),
  );

  const amendment = await Research.create({
    title: title || parentResearch.title,
    discipline: parentResearch.discipline,
    abstract: abstract || parentResearch.abstract,
    methodology: methodology || parentResearch.methodology,
    objectives: objectives || parentResearch.objectives,
    inclusionCriteria: inclusionCriteria || parentResearch.inclusionCriteria,
    exclusionCriteria: exclusionCriteria || parentResearch.exclusionCriteria,
    researcherId: researcher.id,
    submissionType: SUBMISSION_TYPES.AMENDMENT,
    parentResearchId,
    status: RESEARCH_STATUSES.SUBMITTED,
    amendmentNumber: existingAmendments + 1,
    amendmentDetails: amendmentDetails.trim(),
    isSubstantialAmendment: isSubstantial,
    protocolVersionNumber,
    protocolVersionDate,
    proposalFile,
    proposalFileKey,
    seruNumber: parentResearch.seruNumber,
    centre: parentResearch.centre,
    researchProgramme: parentResearch.researchProgramme,
    sdg: parentResearch.sdg,
    fundingSource: fundingSource || parentResearch.fundingSource,
    coInvestigators: amendmentCoInv,
    studySites: studySites
      ? Array.isArray(studySites)
        ? studySites
        : JSON.parse(studySites || "[]")
      : parentResearch.studySites,
    studyImplementationCounties: parentResearch.studyImplementationCounties,
    reviewType,
  });

  if (newlyAddedCoInv.length) {
    processCoInvestigators(amendment, newlyAddedCoInv, researcher).catch((err) =>
      console.error("[submitAmendment] co-inv processing failed:", err.message),
    );
  }

  setImmediate(() => {
    email
      .sendProposalSubmitted?.({
        email: researcher.email,
        name: researcher.name || researcher.firstName,
        proposalTitle: `Amendment #${amendment.amendmentNumber}: ${amendment.title}`,
      })
      .catch(() => {});
  });

  return amendment;
};

const submitContinuingReview = async (researcher, body, files) => {
  const { parentResearchId } = body;

  const parentResearch = await Research.findOne({
    where: { id: parentResearchId, researcherId: researcher.id },
  });
  if (!parentResearch) throw new AppError("Parent research not found.", 404);
  if (!parentResearch.canSubmitContinuingReview) {
    throw new AppError(
      "Continuing review is only for approved or expired research.",
      400,
    );
  }

  if (!body.progressSummary || !String(body.progressSummary).trim()) {
    throw new AppError("A research progress summary is required.", 400);
  }
  if (!files || files.length === 0) {
    throw new AppError(
      "At least one supporting document (e.g. annual progress report) is required for a continuing review.",
      400,
    );
  }

  const existingCRRs = await Research.count({
    where: {
      parentResearchId,
      submissionType: SUBMISSION_TYPES.CONTINUING_REVIEW,
    },
  });

  const {
    progressSummary,
    participantsEnrolled,
    participantsContinuing,
    adverseEvents,
    amendments,
    constraints,
    plansForNextYear,
    isLastYear,
  } = body;

  const progressFilesList = (files || []).map((f) => ({
    label: f.fieldname,
    url: `/uploads/progress/${f.filename}`,
    key: f.key || null,
  }));

  const toUint = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) || n < 0 ? null : n;
  };


  const crr = await sequelize.transaction(async (t) => {
    const submission = await Research.create(
      {
        title: parentResearch.title,
        discipline: parentResearch.discipline,
        researcherId: researcher.id,
        submissionType: SUBMISSION_TYPES.CONTINUING_REVIEW,
        parentResearchId,
        status: RESEARCH_STATUSES.SUBMITTED,
        continuingReviewNumber: existingCRRs + 1,
        seruNumber: parentResearch.seruNumber,
        centre: parentResearch.centre,
        researchProgramme: parentResearch.researchProgramme,

        reviewType:
          parentResearch.studyDesign === "observational"
            ? REVIEW_TYPES.EXPEDITED
            : REVIEW_TYPES.SECRETARIAT,
        isInvestigationalProduct: parentResearch.isInvestigationalProduct || false,
        studyDesign: parentResearch.studyDesign || null,
      },
      { transaction: t },
    );

    const detail = await ContinuingReviewDetail.create(
      {
        submissionId: submission.id,
        progressSummary,
        participantsEnrolled: toUint(participantsEnrolled),
        participantsContinuing: toUint(participantsContinuing),
        adverseEvents,
        amendments,
        constraints,
        plansForNextYear,
        isLastYear: isLastYear === true || isLastYear === "true",
        documents: progressFilesList,
        submittedAt: new Date(),
      },
      { transaction: t },
    );

    submission.setDataValue("continuingReviewDetail", detail);
    return submission;
  });


  try {
    const parentAssignments = await ResearchReviewer.getForResearch(
      parentResearchId,
    );
    const reviewerEmails = [
      ...new Set(
        parentAssignments.map((a) => a.reviewer?.email).filter(Boolean),
      ),
    ];
    if (reviewerEmails.length >= REVIEWER_LIMITS.MIN) {
      await assignReviewers(crr.id, reviewerEmails, null);
      await crr.reload();
    }
  } catch (err) {
    console.error(
      "[submitContinuingReview] reviewer auto-assignment failed:",
      err.message,
    );
  }

  setImmediate(() => {
    email
      .sendProposalSubmitted?.({
        email: researcher.email,
        name: researcher.name || researcher.firstName,
        proposalTitle: `Continuing Review #${crr.continuingReviewNumber}: ${crr.title}`,
      })
      .catch(() => {});
  });

  notifyResearchOfficer("sendProposalSubmittedToOfficer", {
    proposalTitle: `Continuing Review #${crr.continuingReviewNumber}: ${crr.title}`,
    researcherName: researcher.name || researcher.firstName,
    seruNumber: crr.seruNumber,
    submissionType: crr.submissionType,
  }).catch(() => {});

  return crr;
};

const submitStudyClosure = async (researcher, body, file) => {
  const { parentResearchId, closureReason, publicationLink } = body;

  const parentResearch = await Research.findOne({
    where: { id: parentResearchId, researcherId: researcher.id },
  });
  if (!parentResearch) throw new AppError("Parent research not found.", 404);
  if (!parentResearch.canSubmitClosure) {
    throw new AppError(
      "Closure can only be submitted for approved research.",
      400,
    );
  }


  if (closureReason === "completed" && !file) {
    throw new AppError(
      "A closeout report file is required when the closure reason is 'Completed'.",
      400,
    );
  }

  let attestations = body.closureAttestations || {};
  if (typeof attestations === "string") {
    try {
      attestations = JSON.parse(attestations) || {};
    } catch {
      attestations = {};
    }
  }
  const SOP4_EXCLUSIONS = [
    {
      key: "noActiveParticipants",
      label: "No participants are still actively receiving study interventions",
    },
    {
      key: "noOutstandingAdverseEvents",
      label: "No outstanding adverse events require follow-up",
    },
    { key: "noAmendmentsPending", label: "No amendments are pending review" },
    { key: "noCrrPending", label: "No continuing review report is pending" },
    {
      key: "noDeviationsUnresolved",
      label: "No unresolved protocol deviations exist",
    },
    {
      key: "allDataCollected",
      label: "All data collection for objectives is complete",
    },
  ];
  const failing = SOP4_EXCLUSIONS.filter(
    (e) => attestations[e.key] !== true && attestations[e.key] !== "true",
  );
  if (failing.length) {
    throw new AppError(
      `Closure blocked — the following conditions are not met: ${failing.map((f) => f.label).join("; ")}`,
      400,
    );
  }

  const {
    resultsSummary,
    publications,
    participantIdentifiersDestroyed,
    specimenDisposalPlan,
    dataFutureUsePlan,
    investigationalProductDisposal,
  } = body;

  const closeoutReportFile = file ? `/uploads/closure/${file.filename}` : null;
  const closeoutReportFileKey = file?.key || file?.filename || null;

  const closure = await sequelize.transaction(async (t) => {
    const submission = await Research.create(
      {
        title: parentResearch.title,
        discipline: parentResearch.discipline,
        researcherId: researcher.id,
        submissionType: SUBMISSION_TYPES.STUDY_CLOSURE,
        parentResearchId,

        status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
        seruNumber: parentResearch.seruNumber,
        centre: parentResearch.centre,
        reviewType: REVIEW_TYPES.FULL_COMMITTEE,
      },
      { transaction: t },
    );

    const detail = await ClosureDetail.create(
      {
        submissionId: submission.id,
        closureReason,
        resultsSummary,
        publications,
        participantIdentifiersDestroyed:
          participantIdentifiersDestroyed === true ||
          participantIdentifiersDestroyed === "true",
        specimenDisposalPlan,
        dataFutureUsePlan,
        investigationalProductDisposal,
        closeoutReportFile,
        closeoutReportFileKey,
        publicationLink: publicationLink || null,
        submittedAt: new Date(),
      },
      { transaction: t },
    );

    submission.setDataValue("closureDetail", detail);

    submission.setDataValue("closureReason", detail.closureReason);
    submission.setDataValue("publicationLink", detail.publicationLink);
    return submission;
  });

  // Notify every active committee member that a closure awaits their vote.
  try {
    const committee = await Researcher.findCommitteeMembers();
    const seen = new Set();
    for (const member of committee) {
      const key = (member.email || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      email
        .sendNewProposalToReview?.({
          email: member.email,
          name: member.firstName || member.name,
          proposalTitle: parentResearch.title,
          researcherName: researcher.name || researcher.firstName,
          stage: SUBMISSION_TYPES.STUDY_CLOSURE,
          submissionType: SUBMISSION_TYPES.STUDY_CLOSURE,
          discipline: parentResearch.discipline,
          reviewLink: `${process.env.FRONTEND_URL}/hmis`,
        })
        .catch((err) =>
          console.error(
            `[submitStudyClosure] committee email to ${member.email} failed:`,
            err?.message || err,
          ),
        );
    }
  } catch (err) {
    console.error("[submitStudyClosure] committee notification failed:", err?.message || err);
  }

  return closure;
};

const CR_EDITABLE = [
  "progressSummary",
  "participantsEnrolled",
  "participantsContinuing",
  "adverseEvents",
  "amendments",
  "constraints",
  "plansForNextYear",
  "isLastYear",
];

const resubmitContinuingReview = async (research, researcher, body, files) => {
  const detail = await ContinuingReviewDetail.findOne({
    where: { submissionId: research.id },
  });
  if (!detail) throw new AppError("Continuing review detail not found.", 404);

  const toUint = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) || n < 0 ? null : n;
  };
  const toBool = (v) => v === true || v === "true";

  const previous = {};
  const revised = {};
  CR_EDITABLE.forEach((f) => {
    if (body[f] === undefined) return;
    let next = body[f];
    if (f === "participantsEnrolled" || f === "participantsContinuing") next = toUint(next);
    else if (f === "isLastYear") next = toBool(next);
    const current = detail[f] ?? null;
    if (next !== current) {
      previous[f] = current;
      revised[f] = next;
    }
  });


  let newDocuments = null;
  if (Array.isArray(files) && files.length) {
    newDocuments = files.map((f) => ({
      label: f.fieldname || "progressFile",
      url: `/uploads/proposal/${f.filename}`,
      key: f.key || null,
    }));
    previous.documents = detail.documents ?? [];
    revised.documents = newDocuments;
  }

  const nextRound = (research.resubmissionCount || 0) + 1;
  const history = Array.isArray(research.revisionHistory)
    ? [...research.revisionHistory]
    : [];
  history.push({
    round: nextRound,
    snapshotAt: new Date().toISOString(),
    previous,
    revised,
    changedFields: Object.keys(revised),
  });

  const assignments = await ResearchReviewer.getForResearch(research.id);

  await sequelize.transaction(async (t) => {
    CR_EDITABLE.forEach((f) => {
      if (revised[f] !== undefined) detail[f] = revised[f];
    });
    if (newDocuments) detail.documents = newDocuments;
    detail.submittedAt = new Date();
    await detail.save({ transaction: t });

    research.revisionHistory = history;
    research.resubmissionCount = nextRound;
    if (assignments.length) {
      research.status = RESEARCH_STATUSES.UNDER_REVIEW;
      await ResearchReviewer.update(
        { reviewStatus: REVIEWER_ASSIGNMENT_STATUS.PENDING, reviewId: null },
        { where: { researchId: research.id }, transaction: t },
      );
    } else {
      research.status = RESEARCH_STATUSES.SUBMITTED;
    }
    await research.save({ transaction: t });
  });

  setImmediate(() => {
    email
      .sendResubmissionConfirmation?.({
        email: researcher.email,
        name: researcher.name || researcher.firstName,
        proposalTitle: research.title,
      })
      .catch(() => {});
  });

  notifyResearchOfficer("sendResubmissionToOfficer", {
    proposalTitle: research.title,
    researcherName: researcher.name || researcher.firstName,
    seruNumber: research.seruNumber,
    round: nextRound,
  }).catch(() => {});

  for (const a of assignments) {
    if (a.reviewer?.email) {
      email
        .sendResubmissionNotice?.({
          email: a.reviewer.email,
          reviewerName: a.reviewer.name || a.reviewer.firstName,
          proposalTitle: research.title,
          seruNumber: research.seruNumber,
          researcherName: researcher.name || researcher.firstName,
          reviewLink: `${process.env.FRONTEND_URL}/research`,
        })
        .catch(() => {});
    }
  }

  return research;
};

const resubmit = async (researcher, researchId, body, file, files) => {
  const research = await Research.findOne({
    where: { id: researchId, researcherId: researcher.id },
  });
  if (!research) throw new AppError("Research not found.", 404);

  const RESUBMITTABLE = [
    RESEARCH_STATUSES.REVISION_REQUESTED,
    RESEARCH_STATUSES.REJECTED,
    RESEARCH_STATUSES.RETURNED_FOR_CORRECTION,
  ];
  if (!RESUBMITTABLE.includes(research.status)) {
    throw new AppError(
      `Resubmission only when status is revision_requested, rejected, or returned_for_correction. Current: '${research.status}'.`,
      400,
    );
  }


  if (research.submissionType === SUBMISSION_TYPES.CONTINUING_REVIEW) {
    return resubmitContinuingReview(research, researcher, body, files);
  }

  const ALLOWED = [
    "abstract",
    "background",
    "objectives",
    "methodology",
    "expectedOutcome",
    "timeline",
    "justification",
    "inclusionCriteria",
    "exclusionCriteria",
    "amendmentDetails",
    "ethicsHumanSubjects",
    "budgetSummary",
  ];

  const nextRound = (research.resubmissionCount || 0) + 1;
  const previousValues = {};
  const revisedValues = {};
  ALLOWED.forEach((f) => {
    if (body[f] !== undefined && body[f] !== research[f]) {
      previousValues[f] = research[f] ?? null;
      revisedValues[f] = body[f];
    }
  });
  if (file) {
    previousValues.proposalFile = research.proposalFile ?? null;
    revisedValues.proposalFile = `/uploads/proposal/${file.filename}`;
  }
  const history = Array.isArray(research.revisionHistory)
    ? [...research.revisionHistory]
    : [];
  history.push({
    round: nextRound,
    snapshotAt: new Date().toISOString(),
    previous: previousValues,
    revised: revisedValues,
    changedFields: Object.keys(revisedValues),
  });
  research.revisionHistory = history;

  ALLOWED.forEach((f) => {
    if (body[f] !== undefined) research[f] = body[f];
  });

  if (file) {
    research.proposalFile = `/uploads/proposal/${file.filename}`;
    research.proposalFileKey = file.key || null;
  }


  const assignments = await ResearchReviewer.getForResearch(researchId);
  if (assignments.length) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    await ResearchReviewer.update(
      { reviewStatus: REVIEWER_ASSIGNMENT_STATUS.PENDING, reviewId: null },
      { where: { researchId } },
    );
  } else {
    research.status = RESEARCH_STATUSES.SUBMITTED;
  }

  research.resubmissionCount = nextRound;
  await research.save();

  await Research.update(
    { isDeleted: true, deletedAt: new Date() },
    {
      where: {
        parentResearchId: researchId,
        submissionType: SUBMISSION_TYPES.AMENDMENT,
        status: RESEARCH_STATUSES.SUBMITTED,
        isDeleted: false,
      },
    },
  );

  setImmediate(() => {
    email
      .sendResubmissionConfirmation?.({
        email: researcher.email,
        name: researcher.name || researcher.firstName,
        proposalTitle: research.title,
      })
      .catch(() => {});
  });

  notifyResearchOfficer("sendResubmissionToOfficer", {
    proposalTitle: research.title,
    researcherName: researcher.name || researcher.firstName,
    seruNumber: research.seruNumber,
    round: nextRound,
  }).catch(() => {});

  for (const a of assignments) {
    if (a.reviewer?.email) {
      email
        .sendResubmissionNotice?.({
          email: a.reviewer.email,
          reviewerName: a.reviewer.name || a.reviewer.firstName,
          proposalTitle: research.title,
          seruNumber: research.seruNumber,
          researcherName: researcher.name || researcher.firstName,
          reviewLink: `${process.env.FRONTEND_URL}/research`,
        })
        .catch(() => {});
    }
  }

  return research;
};

const checkProposalCompleteness = (research) => {
  const missing = [];
  if (!research.title?.trim()) missing.push("Title");
  if (!research.abstract?.trim()) missing.push("Abstract");
  if (!research.objectives?.trim()) missing.push("Objectives");
  if (!research.methodology?.trim()) missing.push("Methodology");
  if (
    !research.ethicsInformation?.trim() &&
    !research.ethicsHumanSubjects?.trim()
  ) {
    missing.push("Ethics information");
  }
  if (!research.protocolVersionNumber) missing.push("Protocol version number");
  if (!research.protocolVersionDate) missing.push("Protocol version date");
  if (!research.researchProgramme) missing.push("Research programme");
  if (!research.proposalFile) missing.push("Proposal document upload");
  if (!research.fundingSource?.trim()) missing.push("Funding source");


  const certs = Array.isArray(research.investigatorCertificates)
    ? research.investigatorCertificates
    : [];
  if (
    research.ethicsAnimalSubjects?.trim() &&
    !certs.some((c) => c.documentType === "acuc_approval")
  ) {
    missing.push("ACUC approval letter (required for animal-subject studies)");
  }
  if (
    research.isInvestigationalProduct &&
    !certs.some((c) => c.documentType === "insurance_certificate")
  ) {
    missing.push(
      "Clinical trial insurance certificate (required for investigational-product studies)",
    );
  }

  return missing;
};

const recordCscEndorsement = async (
  researchId,
  { cscApprovalDate, cscReviewDate, cscComments, cscContactName, cscContactEmail },
  adminId,
  evidenceFile = null,
) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);
  if (research.submissionType !== SUBMISSION_TYPES.INITIAL_PROPOSAL) {
    throw new AppError(
      "CSC endorsement applies only to initial proposals.",
      400,
    );
  }
  if (!cscApprovalDate)
    throw new AppError("CSC approval date is required.", 400);


  if (!evidenceFile) {
    throw new AppError(
      "Supporting evidence (e.g. a scanned signed CSC letter) is required to record endorsement.",
      400,
    );
  }

  research.cscApprovalDate = cscApprovalDate;
  research.cscReviewDate = cscReviewDate || cscApprovalDate;
  research.cscComments = cscComments || null;
  research.cscContactName = cscContactName;
  research.cscContactEmail = cscContactEmail.toLowerCase();
  research.cscEvidenceFile = `/uploads/csc-evidence/${evidenceFile.filename}`;
  research.cscEvidenceFileKey = evidenceFile.key || null;
  await research.save();

  return research;
};

const returnForCorrection = async (researchId, { issues }, adminId) => {
  const research = await Research.findByPk(researchId, {
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "email", "name", "firstName"],
      },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);
  if (research.status !== RESEARCH_STATUSES.SUBMITTED) {
    throw new AppError(
      `Can only return submitted proposals. Current: '${research.status}'.`,
      400,
    );
  }
  if (!issues?.length)
    throw new AppError("At least one issue must be listed.", 400);

  research.status = RESEARCH_STATUSES.RETURNED_FOR_CORRECTION;
  research.completenessIssues = issues;
  research.completenessCheckedAt = new Date();
  research.completenessCheckedById = adminId;
  await research.save();

  if (research.researcher?.email) {
    email
      .sendRevisionRequested?.({
        email: research.researcher.email,
        name: research.researcher.name || research.researcher.firstName,
        proposalTitle: research.title,
        stage: "completeness_review",
        reviewerComment: `Returned for correction: ${issues.join("; ")}`,
      })
      .catch(() => {});
  }

  return research;
};

const markCompletenessVerified = async (researchId, adminId) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  research.completenessCheckedAt = new Date();
  research.completenessCheckedById = adminId;
  research.completenessIssues = null;

  if (research.status === RESEARCH_STATUSES.RETURNED_FOR_CORRECTION) {
    research.status = RESEARCH_STATUSES.SUBMITTED;
  }
  await research.save();
  return research;
};

const assignReviewers = async (researchId, reviewerEmails, assignedById) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  const ASSIGNABLE = [
    RESEARCH_STATUSES.SUBMITTED,
    RESEARCH_STATUSES.UNDER_REVIEW,
    RESEARCH_STATUSES.REVISION_REQUESTED,
  ];
  if (!ASSIGNABLE.includes(research.status)) {
    throw new AppError(
      `Cannot assign reviewers — status is '${research.status}'.`,
      400,
    );
  }

  if (
    research.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL &&
    !research.cscApprovalDate
  ) {
    throw new AppError(
      "CSC endorsement is required before reviewer assignment. " +
        "Please record the Centre Scientific Committee approval date first.",
      400,
    );
  }

  if (
    research.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL &&
    !research.completenessCheckedAt
  ) {
    const missing = checkProposalCompleteness(research);
    if (missing.length) {
      research.completenessIssues = missing;
      research.status = RESEARCH_STATUSES.RETURNED_FOR_CORRECTION;
      await research.save();
      throw new AppError(
        `Proposal incomplete — missing: ${missing.join(", ")}. ` +
          "Status set to 'returned for correction'. The researcher must address these before reviewer assignment.",
        400,
      );
    }

    research.completenessCheckedAt = new Date();
    research.completenessCheckedById = assignedById || null;
    research.completenessIssues = null;
    await research.save();
  }

  if (
    !Array.isArray(reviewerEmails) ||
    reviewerEmails.length < REVIEWER_LIMITS.MIN
  ) {
    throw new AppError(
      `At least ${REVIEWER_LIMITS.MIN} reviewer email(s) required.`,
      400,
    );
  }
  if (reviewerEmails.length > REVIEWER_LIMITS.MAX) {
    throw new AppError(
      `Maximum ${REVIEWER_LIMITS.MAX} reviewers allowed.`,
      400,
    );
  }

  const reviewers = await Researcher.findAll({
    where: {
      email: { [Op.in]: reviewerEmails.map((e) => e.toLowerCase().trim()) },
      role: RESEARCHER_ROLES.REVIEWER,
      isActive: true,
    },
  });

  if (reviewers.length < REVIEWER_LIMITS.MIN) {
    const found = reviewers.map((r) => r.email);
    const notFound = reviewerEmails.filter(
      (e) => !found.includes(e.toLowerCase().trim()),
    );
    throw new AppError(
      `Could not find active reviewers for: ${notFound.join(", ")}. ` +
        `Need at least ${REVIEWER_LIMITS.MIN} valid reviewers.`,
      404,
    );
  }

  const assignments = [];
  for (const reviewer of reviewers) {
    const [assignment, created] = await ResearchReviewer.findOrCreate({
      where: { researchId, reviewerId: reviewer.id },
      defaults: {
        assignedAt: new Date(),
        assignedById: assignedById || null,
        reviewStatus: REVIEWER_ASSIGNMENT_STATUS.PENDING,
      },
    });
    assignments.push({ assignment, reviewer, isNew: created });
  }

  research.assignedReviewerId = reviewers[0].id;
  research.assignedAt = new Date();
  research.status = RESEARCH_STATUSES.UNDER_REVIEW;

  const windowDays = REVIEW_WINDOW_DAYS[research.submissionType] || 14;
  research.reviewDeadline = new Date(
    Date.now() + windowDays * 24 * 60 * 60 * 1000,
  );
  research.priority =
    research.resubmissionCount >= 2
      ? "high"
      : research.resubmissionCount >= 1
        ? "medium"
        : "normal";
  await research.save();

  const researcherDoc = await Researcher.findByPk(research.researcherId, {
    attributes: ["name", "firstName"],
  });

  for (const { reviewer, isNew } of assignments) {
    if (isNew) {
      email
        .sendNewProposalToReview?.({
          email: reviewer.email,
          name: reviewer.firstName || reviewer.name,
          proposalTitle: research.title,
          researcherName: researcherDoc?.name || "Researcher",
          stage: research.submissionType,
          submissionType: research.submissionType,
          discipline: research.discipline,
          reviewLink: `${process.env.FRONTEND_URL}/hmis`,
        })
        .catch(() => {});
    }
  }

  return {
    research,
    assignments: assignments.map((a) => ({
      reviewer: a.reviewer,
      isNew: a.isNew,
    })),
  };
};

const assignReviewer = async (researchId, reviewerEmail) => {
  const existing = await ResearchReviewer.getForResearch(researchId);
  const existingEmails = existing.map((a) => a.reviewer?.email).filter(Boolean);
  const allEmails = [
    ...new Set([...existingEmails, reviewerEmail.toLowerCase().trim()]),
  ];

  if (allEmails.length < REVIEWER_LIMITS.MIN) {
    throw new AppError(
      `At least ${REVIEWER_LIMITS.MIN} reviewers required. Currently ${existing.length} assigned. ` +
        `Add reviewers via the multi-reviewer assignment endpoint.`,
      400,
    );
  }

  const result = await assignReviewers(researchId, allEmails);
  const newReviewer = result.assignments.find(
    (a) => a.reviewer.email === reviewerEmail.toLowerCase().trim(),
  );
  return {
    research: result.research,
    reviewer: newReviewer?.reviewer || result.assignments[0]?.reviewer,
    isReassignment: !newReviewer?.isNew,
  };
};

const getAssignedResearch = async (
  reviewerId,
  { page, limit, submissionType, includeCompleted, search },
) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const assignedIds = await ResearchReviewer.getAssignedResearchIds(reviewerId);
  if (!assignedIds.length) {
    return {
      total: 0,
      page: safePage,
      limit: safeLimit,
      totalPages: 0,
      papers: [],
    };
  }

  const where = { id: { [Op.in]: assignedIds } };

  if (search) {
    const like = `%${likeEscape(search)}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { researchId: { [Op.like]: like } },
    ];
  }

  if (includeCompleted === "all") {
  } else if (includeCompleted === "true" || includeCompleted === true) {
    where.status = {
      [Op.in]: [
        RESEARCH_STATUSES.APPROVED,
        RESEARCH_STATUSES.REJECTED,
        RESEARCH_STATUSES.SUSPENDED,
        RESEARCH_STATUSES.REVISION_REQUESTED,
        RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
      ],
    };
  } else {
    where.status = {
      [Op.in]: [
        RESEARCH_STATUSES.UNDER_REVIEW,
        RESEARCH_STATUSES.SUBMITTED,
        RESEARCH_STATUSES.REVISION_REQUESTED,
      ],
    };
  }
  if (submissionType) where.submissionType = submissionType;

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "resubmissionCount",
      "assignedAt",
      "createdAt",
      "reviewDeadline",
      "priority",
      "aggregateScore",
      "reviewDecision",
      "reviewedAt",
      "researchId",
      "researcherId",
      "parentResearchId",
    ],
    include: RESEARCHER_LIST_INCLUDE,
    order: [["assignedAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  const plain = papers.map((p) => p.toJSON());
  const childParentIds = [
    ...new Set(plain.filter((p) => p.parentResearchId).map((p) => p.parentResearchId)),
  ];
  if (childParentIds.length) {
    const parents = await Research.findAll({
      where: { id: { [Op.in]: childParentIds } },
      attributes: ["id", "researchId", "title", "seruNumber"],
    });
    const pmap = new Map(parents.map((pr) => [pr.id, pr.toJSON()]));
    plain.forEach((p) => {
      if (p.parentResearchId) p.parentSummary = pmap.get(p.parentResearchId) || null;
    });
  }

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers: plain,
  };
};

const submitReview = async (
  reviewer,
  { researchId, decision, comment, criteria },
  files = [],
) => {
  const research = await Research.findByPk(researchId, {
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "email", "name", "firstName"],
      },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const isAssigned = await ResearchReviewer.isAssigned(researchId, reviewer.id);
  if (!isAssigned) {
    throw new AppError("You are not assigned to review this research.", 403);
  }
  if (research.status !== RESEARCH_STATUSES.UNDER_REVIEW) {
    throw new AppError(`Cannot review — status is '${research.status}'.`, 400);
  }


  const VALID_DECISIONS = [
    REVIEW_DECISIONS.APPROVED,
    REVIEW_DECISIONS.REVISION,
  ];
  if (!VALID_DECISIONS.includes(decision)) {
    throw new AppError(
      `Decision must be one of: ${VALID_DECISIONS.join(", ")}.`,
      400,
    );
  }

  const validatedCriteria = validateCriteria(research.submissionType, criteria);
  const criteriaValues = Object.values(validatedCriteria);
  const aggregateScore = criteriaValues.length
    ? Number(
        (
          criteriaValues.reduce((s, v) => s + v, 0) / criteriaValues.length
        ).toFixed(1),
      )
    : null;

  const latestReview = await Review.findOne({
    where: {
      researchId,
      reviewerId: reviewer.id,
      isLatest: true,
      reviewerRole: "reviewer",
    },
    attributes: ["round"],
  });
  const round = latestReview ? latestReview.round + 1 : 1;


  const attachments = (files || []).map((f) => ({
    label: f.originalname,
    url: `/uploads/review-feedback/${f.filename}`,
    key: f.filename,
    uploadedAt: new Date(),
  }));

  const review = await Review.create({
    researchId,
    reviewerId: reviewer.id,
    reviewerRole: "reviewer",
    stage: research.submissionType,
    round,
    decision,
    comment,
    criteria: validatedCriteria,
    attachments,
    isLatest: true,
    submittedAt: new Date(),
  });

  await ResearchReviewer.update(
    { reviewStatus: REVIEWER_ASSIGNMENT_STATUS.SUBMITTED, reviewId: review.id },
    { where: { researchId, reviewerId: reviewer.id } },
  );

  const {
    allSubmitted,
    submitted,
    total: totalReviewers,
  } = await ResearchReviewer.checkAllSubmitted(researchId);


  if (allSubmitted) {
    research.status = RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW;
  }

  research.reviewedById = reviewer.id;
  research.reviewedAt = new Date();
  research.aggregateScore = aggregateScore;
  await research.save();

  const stats = await Review.getReviewerStats(reviewer.id);
  await Researcher.increment("reviewCount", {
    by: 1,
    where: { id: reviewer.id },
  });
  await Researcher.update(
    { acceptanceRate: stats.acceptanceRate },
    { where: { id: reviewer.id } },
  );

 
  const researchOfficers = await User.findResearchOfficers().catch(() => []);
  for (const officer of researchOfficers) {
    email
      .sendReviewerVerdictSubmitted?.({
        email: officer.email,
        name: officer.firstName || officer.name || "Research Officer",
        proposalTitle: research.title,
        submitted,
        total: totalReviewers,
        forRole: "research_officer",
      })
      .catch(() => {});
  }

  const otherAssignments = await ResearchReviewer.findAll({
    where: { researchId, reviewerId: { [Op.ne]: reviewer.id } },
    include: [{ model: Researcher, as: "reviewer", attributes: ["id", "name", "firstName", "email"] }],
  });
  for (const assignment of otherAssignments) {
    const otherReviewer = assignment.reviewer;
    if (!otherReviewer?.email) continue;
    email
      .sendReviewerVerdictSubmitted?.({
        email: otherReviewer.email,
        name: otherReviewer.firstName || otherReviewer.name,
        proposalTitle: research.title,
        submitted,
        total: totalReviewers,
        forRole: "reviewer",
      })
      .catch(() => {});
  }


  if (allSubmitted) {
    const researcherDoc = research.researcher;

    const committee = await Researcher.findCommitteeMembers();
    const seen = new Set();
    const recipients = committee.filter((m) => {
      const key = (m.email || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!recipients.length) {
      console.warn(
        `[submitReview] ${research.researchId || researchId} reached committee but no active committee members were found to notify.`,
      );
    }

    for (const member of recipients) {
      email
        .sendNewProposalToReview?.({
          email: member.email,
          name: member.firstName || member.name,
          proposalTitle: research.title,
          researcherName: researcherDoc.name || researcherDoc.firstName,
          stage: research.submissionType,
          submissionType: research.submissionType,
          discipline: research.discipline,
          reviewLink: `${process.env.FRONTEND_URL}/hmis`,
        })
        .catch((err) =>

          console.error(
            `[submitReview] committee email to ${member.email} failed:`,
            err?.message || err,
          ),
        );
    }
  }

  return {
    review,
    research,
    reviewProgress: { submitted, total: totalReviewers, allSubmitted },
  };
};

const getResearchComments = async (researchId, caller = {}) => {
  const flags = await computeAccessFlags(researchId, caller);
  const { isStaff, isCommittee, isOwner, isAssignedReviewer, isCoInvestigator } = flags;

  if (!isStaff && !isCommittee && !isOwner && !isAssignedReviewer && !isCoInvestigator) {
    throw new AppError("Access denied.", 403);
  }


  if (isOwner || isCoInvestigator) {
    return [];
  }

  if (isStaff || isCommittee) {
    return Review.getAllForResearch(researchId);
  }


  const { researcher } = caller;
  return Review.findAll({
    where: { researchId, reviewerId: researcher.id, reviewerRole: "reviewer" },
    order: [["round", "DESC"], ["submittedAt", "DESC"]],
  });
};

const getCommitteeQueue = async ({ page, limit }) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where: { status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW },
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "resubmissionCount",
      "reviewComment",
      "reviewedAt",
      "createdAt",
      "committeeRound",
      "researcherId",
      "reviewedById",
      "researchId",
    ],
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "name", "institution"],
      },
      { model: Researcher, as: "reviewer", attributes: ["id", "name"] },
    ],
    order: [["reviewedAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });


  const paperIds = papers.map((p) => p.id);
  if (paperIds.length) {
    const committeeVotes = await Review.findAll({
      where: { researchId: { [Op.in]: paperIds }, reviewerRole: "committee" },
      attributes: ["researchId", "round"],
      raw: true,
    });
    const roundsByResearch = {};
    committeeVotes.forEach((v) => {
      (roundsByResearch[v.researchId] ||= []).push(v.round);
    });
    papers.forEach((p) => {
      const rounds = roundsByResearch[p.id] || [];
      const currentRound = p.committeeRound || 1;
      const cast = rounds.filter((r) => r === currentRound).length;
      p.setDataValue("committeeVotesCast", cast);
      p.setDataValue("committeeVotesRequired", COMMITTEE_QUORUM.MIN_VOTES);
      p.setDataValue("committeeVotesMax", COMMITTEE_QUORUM.MAX_VOTES);
    });
  }

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const getAllResearchCommittee = async ({
 submissionType,
  status,
  stage,
  search,
  page,
  limit,
}) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const where = {};
  if (submissionType) where.submissionType = submissionType;
  if (status) where.status = status;
  if (stage && STAGE_STATUS_MAP[stage])
    where.status = { [Op.in]: STAGE_STATUS_MAP[stage] };
  if (search) {
    const like = `%${likeEscape(search)}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { abstract: { [Op.like]: like } },
      { researchId: { [Op.like]: like } },
      { seruNumber: { [Op.like]: like } },
    ];
  }


  const nesting = !submissionType && !status && !stage && !search;
  if (nesting) where.parentResearchId = null;

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "researcherId",
      "reviewedAt",
      "committeeReviewedAt",
      "aggregateScore",
      "researchId",
      "seruNumber",
      "createdAt",
      "updatedAt",
      "approvalValidUntil",
      "parentResearchId",
    ],
    include: RESEARCHER_LIST_INCLUDE,
    order: [["createdAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  if (nesting && papers.length) {
    await attachChildSubmissions(papers);
  }

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const submitCommitteeReview = async (
  committeeMember,
  { researchId, decision, comment, criteria },
) => {
  const research = await Research.findByPk(researchId, {
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "email", "name", "firstName"],
      },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);
  if (research.status !== RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW) {
    throw new AppError(
      `Not awaiting committee review. Status: '${research.status}'.`,
      400,
    );
  }

  const VALID = [
    REVIEW_DECISIONS.APPROVED,
    REVIEW_DECISIONS.REVISION,
    REVIEW_DECISIONS.REJECTED,
    REVIEW_DECISIONS.NOTED,
  ];
  if (!VALID.includes(decision)) {
    throw new AppError(
      `Committee decision must be one of: ${VALID.join(", ")}.`,
      400,
    );
  }

  const currentRound = research.committeeRound || 1;

  const alreadyVoted = await Review.findOne({
    where: {
      researchId,
      stage: research.submissionType,
      reviewerRole: "committee",
      round: currentRound,
      reviewerId: committeeMember.id,
    },
  });
  if (alreadyVoted) throw new AppError("You already voted this round.", 409);

  const existingVotes = await Review.findAll({
    where: {
      researchId,
      stage: research.submissionType,
      reviewerRole: "committee",
      round: currentRound,
    },
  });
  if (existingVotes.length >= COMMITTEE_QUORUM.MAX_VOTES) {
    throw new AppError(
      `Max ${COMMITTEE_QUORUM.MAX_VOTES} committee votes reached.`,
      409,
    );
  }

  const validatedCriteria = criteria
    ? validateCriteria(research.submissionType, criteria)
    : {};

  let vote;
  try {
    vote = await Review.create({
      researchId,
      reviewerId: committeeMember.id,
      reviewerRole: "committee",
      stage: research.submissionType,
      round: currentRound,
      decision,
      comment,
      criteria: validatedCriteria,
      isLatest: false,
      submittedAt: new Date(),
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError)
      throw new AppError("Already voted this round.", 409);
    throw err;
  }

  const allVotes = [...existingVotes, vote];
  const totalVotes = allVotes.length;
  const remainingSlots = COMMITTEE_QUORUM.MAX_VOTES - totalVotes;
  const { counts, sorted } = tallyCommitteeVotes(allVotes);
  const [leaderDecision, leaderCount] = sorted[0];
  const runnerUpCount = sorted[1]?.[1] || 0;
  const quorumMet = totalVotes >= COMMITTEE_QUORUM.MIN_VOTES;
  const isFinal =
    totalVotes === COMMITTEE_QUORUM.MAX_VOTES ||
    (quorumMet && leaderCount > runnerUpCount + remainingSlots);

  if (!isFinal) {
    return {
      review: vote,
      research,
      finalized: false,
      votesReceived: totalVotes,
      votesRequired: COMMITTEE_QUORUM.MIN_VOTES,
      votesMax: COMMITTEE_QUORUM.MAX_VOTES,
    };
  }


  research.status = RESEARCH_STATUSES.PENDING_OFFICER_REVIEW;
  research.committeeReviewedById = committeeMember.id;
  research.committeeReviewedAt = new Date();
  research.committeeRound = currentRound + 1;
  await research.save();

  const report = await draftDecisionReport(research, allVotes, leaderDecision);

  const researchOfficers = await User.findResearchOfficers().catch(() => []);
  for (const officer of researchOfficers) {
    email
      .sendReviewerVerdictSubmitted?.({
        email: officer.email,
        name: officer.firstName || officer.name || "Research Officer",
        proposalTitle: research.title,
        submitted: totalVotes,
        total: COMMITTEE_QUORUM.MAX_VOTES,
        forRole: "research_officer",
      })
      .catch(() => {});
  }

  return {
    review: vote,
    research,
    finalized: true,
    votesReceived: totalVotes,
    votesRequired: COMMITTEE_QUORUM.MIN_VOTES,
    votesMax: COMMITTEE_QUORUM.MAX_VOTES,
    decisionCounts: counts,
    decisionReport: report,
  };
};


const stripReviewIdentity = (review) => ({
  comment: review.comment,
  criteria: review.criteria,
  decision: review.decision,
  submittedAt: review.submittedAt,
});


const draftDecisionReport = async (research, committeeVotes, leaderDecision) => {
  const reviewerRounds = await Review.findAll({
    where: { researchId: research.id, reviewerRole: "reviewer", isLatest: true },
    order: [["submittedAt", "ASC"]],
  });

  const committeeNarrative = committeeVotes
    .map((v) => v.comment)
    .filter(Boolean)
    .join("\n\n---\n\n");

  const round = research.committeeRound || 1;

  const [report] = await ResearchDecisionReport.upsert({
    researchId: research.id,
    round,
    reviewerComments: reviewerRounds.map(stripReviewIdentity),
    committeeComment: committeeNarrative || null,
    finalDecision: leaderDecision,
    compiledById: null,
    decisionLetterId: null,
    releasedAt: null,
  });

  return report;
};


const addCommitteeReportNote = async (committeeMember, { researchId, note }) => {
  const report = await ResearchDecisionReport.getLatestForResearch(researchId);
  if (!report) {
    throw new AppError(
      "No decision report exists for this research yet — committee quorum must be reached first.",
      404,
    );
  }
  if (report.releasedAt) {
    throw new AppError("This decision report has already been released.", 400);
  }

  const authorLabel = committeeMember.name || committeeMember.firstName || "Committee member";
  const addition = `[Note — ${authorLabel}, ${new Date().toDateString()}]\n${note}`;
  report.committeeComment = report.committeeComment
    ? `${report.committeeComment}\n\n---\n\n${addition}`
    : addition;
  await report.save();
  return report;
};


const updateDecisionReport = async (researchId, reportId, updates) => {
  const report = await ResearchDecisionReport.findOne({
    where: { id: reportId, researchId },
  });
  if (!report) throw new AppError("Decision report not found.", 404);
  if (report.releasedAt) {
    throw new AppError("This decision report has already been released.", 400);
  }

  if (updates.committeeComment !== undefined) {
    report.committeeComment = updates.committeeComment;
  }
  if (updates.finalDecision !== undefined) {
    report.finalDecision = updates.finalDecision;
  }
  if (updates.officerAttachment !== undefined) {
    report.officerAttachment = updates.officerAttachment;
  }
  await report.save();
  return report;
};


const releaseDecisionReport = async (user, researchId, reportId) => {
  const report = await ResearchDecisionReport.findOne({
    where: { id: reportId, researchId },
  });
  if (!report) throw new AppError("Decision report not found.", 404);
  if (report.releasedAt) {
    throw new AppError("This decision report has already been released.", 400);
  }
  if (!report.finalDecision) {
    throw new AppError("Set a final decision before releasing.", 400);
  }

  const research = await Research.findByPk(researchId, {
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "email", "name", "firstName"],
      },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);
  if (research.status !== RESEARCH_STATUSES.PENDING_OFFICER_REVIEW) {
    throw new AppError(
      `Research is not awaiting officer release. Status: '${research.status}'.`,
      400,
    );
  }

  const statusMap = {
    [REVIEW_DECISIONS.APPROVED]:  RESEARCH_STATUSES.APPROVED,
    [REVIEW_DECISIONS.REVISION]:  RESEARCH_STATUSES.REVISION_REQUESTED,
    [REVIEW_DECISIONS.REJECTED]:  RESEARCH_STATUSES.REJECTED,
    [REVIEW_DECISIONS.SUSPENDED]: RESEARCH_STATUSES.SUSPENDED,
  };
  const finalDecision = report.finalDecision;

  research.reviewDecision = REVIEW_DECISION_DISPLAY[finalDecision] || finalDecision;

  research.reviewComment = report.committeeComment || null;

  let approvalCertificate = null;
  if (finalDecision === REVIEW_DECISIONS.APPROVED) {
    await research.approve();

  
    try {
      if (
        research.submissionType === SUBMISSION_TYPES.STUDY_CLOSURE &&
        research.parentResearchId
      ) {
        approvalCertificate = await certificateService.issueCompletionCertificate(
          research.parentResearchId,
          user?.id || null,
        );
      } else {
        approvalCertificate = await certificateService.issueClearanceCertificate(
          research.id,
          user?.id || null,
        );
      }
    } catch (err) {
      console.error(
        "[releaseDecisionReport] certificate generation failed:",
        err.message,
      );
    }

    if (
      research.submissionType === SUBMISSION_TYPES.STUDY_CLOSURE &&
      research.parentResearchId
    ) {
      await Research.update(
        { status: RESEARCH_STATUSES.CLOSED },
        { where: { id: research.parentResearchId } },
      );
    }

    if (
      research.submissionType === SUBMISSION_TYPES.CONTINUING_REVIEW &&
      research.parentResearchId
    ) {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + APPROVAL_VALIDITY_MONTHS);
      await Research.update(
        { approvalValidUntil: validUntil, status: RESEARCH_STATUSES.APPROVED },
        { where: { id: research.parentResearchId } },
      );
    }
  } else {
    research.status = statusMap[finalDecision] || RESEARCH_STATUSES.REVISION_REQUESTED;
    await research.save();
  }

  const decisionLetterKind =
    finalDecision === REVIEW_DECISIONS.APPROVED ? "approved"
    : finalDecision === REVIEW_DECISIONS.REJECTED ? "rejected"
    : finalDecision === REVIEW_DECISIONS.SUSPENDED ? "suspended"
    : "revision_requested";
  await issueDecisionLetter(
    research,
    decisionLetterKind,
    report.committeeComment,
    {
      officerAttachmentPath: report.officerAttachment
        ? (report.officerAttachment.startsWith("/")
            ? path.join(process.cwd(), report.officerAttachment)
            : report.officerAttachment)
        : null,
    },
  ).catch((err) => {
    console.error("[releaseDecisionReport] decision letter failed:", err.message);
  });

  report.releasedAt = new Date();
  report.compiledById = user?.id || null;
  report.decisionLetterId = research.decisionLetterNumber || null;
  await report.save();

  const researcherDoc = research.researcher;
  email
    .sendOfficialVerdict?.({
      email: researcherDoc.email,
      name: researcherDoc.name || researcherDoc.firstName,
      proposalTitle: research.title,
      decision: finalDecision,
      committeeComment: report.committeeComment,
      decisionLetterUrl: research.decisionLetterFile
        ? `${process.env.FRONTEND_URL || ""}${research.decisionLetterFile}`
        : null,
      certificateUrl: approvalCertificate?.pdfFile
        ? `${process.env.FRONTEND_URL || ""}${approvalCertificate.pdfFile}`
        : null,
    })
    .catch(() => {});

  return { research, report };
};


const getDecisionReport = async (researchId, caller = {}) => {
  const flags = await computeAccessFlags(researchId, caller);
  const { isStaff, isCommittee, isOwner, isCoInvestigator } = flags;

  if (!isStaff && !isCommittee && !isOwner && !isCoInvestigator) {
    throw new AppError("Access denied.", 403);
  }

  if (isStaff || isCommittee) {

    return ResearchDecisionReport.getLatestForResearch(researchId);
  }

  return ResearchDecisionReport.getReleasedForResearch(researchId);
};

const getFinalApprovalQueue = async ({ page, limit } = {}) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where: { status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW },
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "resubmissionCount",
      "reviewedAt",
      "createdAt",
      "committeeRound",
      "researchId",
      "assignedReviewerId",
      "aggregateScore",
      "researcherId",
    ],
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "name", "institution"],
      },
      {
        model: Researcher,
        as: "assignedReviewer",
        attributes: ["id", "name", "email", "institution"],
      },
    ],
    order: [["reviewedAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  if (!papers.length) {
    return {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      records: [],
    };
  }

  const researchIds = papers.map((p) => p.id);

  const [allVotes, allAssignments] = await Promise.all([
    Review.findAll({
      where: {
        researchId: { [Op.in]: researchIds },
        reviewerRole: "committee",
        round: { [Op.gte]: 1 },
      },
      raw: true,
    }),
    ResearchReviewer.findAll({
      where: { researchId: { [Op.in]: researchIds } },
      include: [
        {
          model: Researcher,
          as: "reviewer",
          attributes: ["id", "name", "email", "institution"],
        },
      ],
      order: [["assignedAt", "ASC"]],
    }),
  ]);

  const votesByResearch = {};
  allVotes.forEach((v) => {
    const key = String(v.researchId);
    (votesByResearch[key] = votesByResearch[key] || []).push(v);
  });

  const reviewersByResearch = {};
  allAssignments.forEach((a) => {
    const key = String(a.researchId);
    (reviewersByResearch[key] = reviewersByResearch[key] || []).push(
      a.reviewer,
    );
  });

  const records = papers.map((p) => {
    const votes = votesByResearch[String(p.id)] || [];
   
    
    const assignedReviewers = (reviewersByResearch[String(p.id)] || []).filter(
      Boolean,
    );
    const reviewerNames = assignedReviewers.length
      ? assignedReviewers.map((rv) => rv.name).filter(Boolean)
      : [p.assignedReviewer?.name || p.researcher?.name].filter(Boolean);

    return {
      id: p.id,
      _id: p.id,
      projectId: p.researchId || `#${String(p.id).slice(-6).toUpperCase()}`,
      title: p.title,
      submissionType: p.submissionType,

      
      principalReviewer: reviewerNames[0] || "—",
      reviewers: assignedReviewers.length
        ? assignedReviewers.map((rv) => ({
            id: rv.id,
            name: rv.name,
            email: rv.email,
          }))
        : [p.assignedReviewer]
            .filter(Boolean)
            .map((rv) => ({ id: rv.id, name: rv.name, email: rv.email })),
      researcher: p.researcher,
      avgScore: averageVoteScore(votes) ?? p.aggregateScore ?? 0,
      outcome: deriveOutcome(votes),
    };
  });

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    records,
  };
};


const getOfficerReviewQueue = async ({ page, limit } = {}) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where: { status: RESEARCH_STATUSES.PENDING_OFFICER_REVIEW },
    attributes: [
      "id", "title", "discipline", "submissionType", "status",
      "researchId", "seruNumber", "committeeReviewedAt", "committeeRound",
      "researcherId",
    ],
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "name", "institution"] },
    ],
    order: [["committeeReviewedAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  const researchIds = papers.map((p) => p.id);
  const reports = researchIds.length
    ? await ResearchDecisionReport.findAll({
        where: { researchId: { [Op.in]: researchIds }, releasedAt: null },
      })
    : [];
  const reportByResearch = {};
  reports.forEach((r) => { reportByResearch[String(r.researchId)] = r; });

  const records = papers.map((p) => ({
    id: p.id,
    title: p.title,
    discipline: p.discipline,
    submissionType: p.submissionType,
    researchId: p.researchId,
    seruNumber: p.seruNumber,
    researcher: p.researcher,
    committeeReviewedAt: p.committeeReviewedAt,
    report: reportByResearch[String(p.id)] || null,
  }));

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    records,
  };
};

const getFinalApprovalStats = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [awaitingSignOff, totalApprovedMtd, finalizedThisMonth] =
    await Promise.all([
      Research.count({
        where: { status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW },
      }),
      Research.count({
        where: {
          committeeReviewedAt: { [Op.gte]: startOfMonth },
          status: RESEARCH_STATUSES.APPROVED,
        },
      }),
      Research.findAll({
        where: { committeeReviewedAt: { [Op.gte]: startOfMonth } },
        attributes: ["reviewedAt", "committeeReviewedAt"],
        raw: true,
      }),
    ]);

  let avgReviewTimeDays = null;
  if (finalizedThisMonth.length) {
    const totalDays = finalizedThisMonth.reduce((sum, r) => {
      if (!r.reviewedAt || !r.committeeReviewedAt) return sum;
      return (
        sum +
        (new Date(r.committeeReviewedAt) - new Date(r.reviewedAt)) /
          (1000 * 60 * 60 * 24)
      );
    }, 0);
    avgReviewTimeDays = Number(
      (totalDays / finalizedThisMonth.length).toFixed(1),
    );
  }


  
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const expiringSoon = await Research.count({
    where: {
      submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
      status: RESEARCH_STATUSES.APPROVED,
      approvalValidUntil: { [Op.lte]: thirtyDaysOut, [Op.gte]: new Date() },
    },
  });

  return { awaitingSignOff, totalApprovedMtd, avgReviewTimeDays, expiringSoon };
};

const getApprovalFeed = async ({ limit = 50 } = {}) => {
  const votes = await Review.findAll({
    where: {
      reviewerRole: "committee",
      comment: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
    },
    include: [
      { model: Researcher, as: "reviewer", attributes: ["id", "name"] },
      {
        model: Research,
        as: "research",
        attributes: ["id", "title", "researchId"],
      },
    ],
    order: [["submittedAt", "DESC"]],
    limit: Math.min(Number(limit) || 50, 100),
  });

  const toneOf = (d) =>
    d === REVIEW_DECISIONS.APPROVED
      ? "success"
      : d === REVIEW_DECISIONS.REJECTED
        ? "warning"
        : "neutral";
  return votes.map((v) => ({
    id: v.id,
    _id: v.id,
    stage: "committee",
    stageLabel: "Committee",
    author: v.reviewer?.name || "Committee Member",
    initials: initialsOf(v.reviewer?.name),
    message: v.research?.title
      ? `[${v.research.researchId || v.research.title}] ${v.comment}`
      : v.comment,
    tone: toneOf(v.decision),
    time: fmtRelativeTime(v.submittedAt),
  }));
};

const postApprovalComment = async (
  committeeMember,
  { researchId, message },
) => {
  if (!researchId) throw new AppError("Research ID required.", 400);
  if (!message?.trim()) throw new AppError("Comment required.", 400);

  const research = await Research.findByPk(researchId, {
    attributes: ["id", "title", "researchId", "submissionType"],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const note = await Review.create({
    researchId: research.id,
    reviewerId: committeeMember.id,
    reviewerRole: "committee",
    stage: research.submissionType,
    round: NOTE_ROUND,
    decision: REVIEW_DECISIONS.NOTED,
    comment: message.trim(),
    isLatest: false,
    submittedAt: new Date(),
  });

  return {
    id: note.id,
    _id: note.id,
    author: committeeMember.name || "Committee Member",
    initials: initialsOf(committeeMember.name),
    stage: "committee",
    stageLabel: "Committee",
    message: `[${research.researchId || research.title}] ${note.comment}`,
    tone: "neutral",
    time: "Just now",
  };
};

const getRecordTimeline = async (researchId) => {
  const research = await Research.findByPk(researchId, {
    attributes: ["title", "researchId"],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const reviews = await Review.getAllForResearch(researchId);
  return reviews.map((r) => {
    const isCommittee = r.reviewerRole === "committee";
    return {
      id: r.id,
      _id: r.id,
      stage: isCommittee ? "committee" : r.stage,
      stageLabel: isCommittee
        ? r.round === 0
          ? "Committee Note"
          : `Committee Vote (Round ${r.round})`
        : SUBMISSION_LABEL[r.stage] || r.stage,
      round: r.round,
      decision: r.decision,
      author: r.reviewer?.name || "Reviewer",
      initials: initialsOf(r.reviewer?.name),
      message: r.comment,
      time: fmtRelativeTime(r.submittedAt),
      submittedAt: r.submittedAt,
    };
  });
};

const getAllResearchAdmin = async ({
  submissionType,
  status,
  search,
  page,
  limit,
}) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const where = {};
  if (submissionType) where.submissionType = submissionType;
  if (status) where.status = status;
  if (search) {
    const like = `%${likeEscape(search)}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { abstract: { [Op.like]: like } },
      { researchId: { [Op.like]: like } },
      { seruNumber: { [Op.like]: like } },
    ];
  }

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "discipline",
      "submissionType",
      "status",
      "researcherId",
      "assignedReviewerId",
      "reviewComment",
      "committeeComment",
      "committeeReviewedById",
      "researchId",
      "seruNumber",
      "createdAt",
      "updatedAt",
      "approvalValidUntil",
      "parentResearchId",
    ],
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "name", "institution", "email"],
      },
      {
        model: Researcher,
        as: "assignedReviewer",
        attributes: ["id", "name", "email", "institution"],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const reactivateResearch = async (researchId, adminId, reason) => {
  if (!reason?.trim())
    throw new AppError("Reason required to reactivate.", 400);
  const research = await Research.findByPk(researchId, {
    include: [
      {
        model: Researcher,
        as: "researcher",
        attributes: ["id", "email", "name", "firstName"],
      },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);
  if (research.status !== RESEARCH_STATUSES.SUSPENDED) {
    throw new AppError(
      `Only suspended studies can be reactivated. Current: '${research.status}'.`,
      400,
    );
  }

  const assignments = await ResearchReviewer.getForResearch(researchId);
  research.status = assignments.length
    ? RESEARCH_STATUSES.UNDER_REVIEW
    : RESEARCH_STATUSES.SUBMITTED;
  research.reactivatedAt = new Date();
  research.reactivatedById = adminId;
  research.reactivationReason = reason.trim();
  await research.save();

  if (research.researcher?.email) {
    email
      .sendStudyReactivated?.({
        email: research.researcher.email,
        name: research.researcher.name || research.researcher.firstName,
        proposalTitle: research.title,
        reason: research.reactivationReason,
      })
      .catch(() => {});
  }

  return research;
};

const deleteResearch = async (researchId, deletedBy) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);
  await research.softDelete(deletedBy);
};

const getDashboardStats = async () => {
  const [
    totalResearch,
    submittedProposals,
    approvedProposals,
    pendingCommitteeReview,
    unassigned,
    totalAmendments,
    totalCRRs,
    totalClosures,
    expiringSoon,
    totalResearchers,
    totalReviewers,
    totalCommitteeMembers,
  ] = await Promise.all([
    Research.count({ where: { parentResearchId: null } }),
    Research.count({
      where: {
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: RESEARCH_STATUSES.SUBMITTED,
      },
    }),
    Research.count({
      where: {
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: RESEARCH_STATUSES.APPROVED,
      },
    }),
    Research.count({
      where: { status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW },
    }),
    Research.count({
      where: {
        assignedReviewerId: null,
        status: { [Op.in]: [RESEARCH_STATUSES.SUBMITTED] },
      },
    }),
    Research.count({ where: { submissionType: SUBMISSION_TYPES.AMENDMENT } }),
    Research.count({
      where: { submissionType: SUBMISSION_TYPES.CONTINUING_REVIEW },
    }),
    Research.count({
      where: { submissionType: SUBMISSION_TYPES.STUDY_CLOSURE },
    }),
    Research.count({
      where: {
        status: RESEARCH_STATUSES.APPROVED,
        approvalValidUntil: {
          [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          [Op.gte]: new Date(),
        },
      },
    }),
    Researcher.count({ where: { role: RESEARCHER_ROLES.RESEARCHER } }),
    Researcher.count({ where: { role: RESEARCHER_ROLES.REVIEWER } }),
    Researcher.count({
      where: {
        [Op.or]: [
          { role: RESEARCHER_ROLES.RESEARCH_COMMITTEE },
          { isCommittee: true },
        ],
      },
    }),
  ]);

  return {
    research: {
      total: totalResearch,
      submittedProposals,
      approvedProposals,
      pendingCommitteeReview,
      unassigned,
      amendments: totalAmendments,
      continuingReviews: totalCRRs,
      closures: totalClosures,
      expiringSoon,
    },
    users: { totalResearchers, totalReviewers, totalCommitteeMembers },
  };
};


let _publicStatsCache = null;
let _publicStatsCachedAt = 0;
const PUBLIC_STATS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getPublicResearchStats = async () => {
  const now = Date.now();
  if (_publicStatsCache && now - _publicStatsCachedAt < PUBLIC_STATS_TTL_MS) {
    return _publicStatsCache;
  }

  const [protocolsReviewed, researchers, approvalsIssued] = await Promise.all([

    Research.count({
      where: {
        parentResearchId: null,
        status: {
          [Op.notIn]: [RESEARCH_STATUSES.DRAFT, RESEARCH_STATUSES.AWAITING_PAYMENT],
        },
      },
    }),

    Researcher.count({
      where: {
        role: RESEARCHER_ROLES.RESEARCHER,
        isActive: true,
        status: RESEARCHER_STATUSES.ACTIVE,
      },
    }),

    Research.count({
      where: {
        parentResearchId: null,
        status: RESEARCH_STATUSES.APPROVED,
      },
    }),
  ]);

  _publicStatsCache = { protocolsReviewed, researchers, approvalsIssued };
  _publicStatsCachedAt = now;
  return _publicStatsCache;
};

const getResearcherRevenue = async (researcher, researchId, caller = {}) => {

  const isStaff = caller.user && ["admin", "superadmin", "research"].includes(caller.user.role);
  let research;
  if (isStaff) {
    research = await Research.findByPk(researchId);
  } else if (researcher) {
    research = await Research.findOne({
      where: { id: researchId, researcherId: researcher.id },
    });
  }
  if (!research) throw new AppError("Research not found or not yours.", 404);
  const revenueData = await Payment.getRevenueForResearch(researchId);
  return {
    research: {
      id: research.id,
      title: research.title,
      seruNumber: research.seruNumber,
    },
    revenue: revenueData,
  };
};



const getReviewerWorkload = async () => {
 
  const assignments = await ResearchReviewer.findAll({
    attributes: [
      "reviewerId",
      [
        sequelize.fn("COUNT", sequelize.col("ResearchReviewer.id")),
        "totalAssignments",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(
            `CASE WHEN review_status = '${REVIEWER_ASSIGNMENT_STATUS.PENDING}' THEN 1 ELSE 0 END`,
          ),
        ),
        "pendingCount",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(
            `CASE WHEN review_status = '${REVIEWER_ASSIGNMENT_STATUS.SUBMITTED}' THEN 1 ELSE 0 END`,
          ),
        ),
        "completedCount",
      ],
    ],
    include: [
      {
        model: Researcher,
        as: "reviewer",
        attributes: ["id", "name", "email", "institution"],
      },
    ],
    group: ["reviewerId", "reviewer.id"],
  });


  const [turnaroundRows] = await sequelize.query(`
    SELECT
      rr.reviewer_id AS reviewerId,
      ROUND(AVG(TIMESTAMPDIFF(HOUR, rr.assigned_at, rv.submitted_at)), 1) AS avgTurnaroundHours,
      COUNT(rv.id) AS reviewsCompleted
    FROM research_reviewers rr
    JOIN reviews rv ON rv.research_id = rr.research_id AND rv.reviewer_id = rr.reviewer_id
    WHERE rr.review_status = 'submitted'
    GROUP BY rr.reviewer_id
  `);

  const turnaroundMap = {};
  turnaroundRows.forEach((r) => {
    turnaroundMap[r.reviewerId] = {
      avgTurnaroundHours: r.avgTurnaroundHours,
      reviewsCompleted: r.reviewsCompleted,
    };
  });


  const [committeeRows] = await sequelize.query(`
    SELECT
      rv.reviewer_id AS memberId,
      r.name AS memberName,
      r.email,
      COUNT(rv.id) AS totalVotes,
      SUM(CASE WHEN rv.decision = 'approved' THEN 1 ELSE 0 END) AS approvedVotes,
      SUM(CASE WHEN rv.decision = 'rejected' THEN 1 ELSE 0 END) AS rejectedVotes,
      SUM(CASE WHEN rv.decision = 'revision' THEN 1 ELSE 0 END) AS revisionVotes
    FROM reviews rv
    JOIN researchers r ON r.id = rv.reviewer_id
    WHERE rv.reviewer_role = 'committee'
      AND rv.round > 0
    GROUP BY rv.reviewer_id, r.name, r.email
  `);

  return {
    reviewers: assignments.map((a) => {
      const turnaround = turnaroundMap[a.reviewerId] || {};
      return {
        reviewer: a.reviewer,
        totalAssignments: Number(a.dataValues.totalAssignments),
        pendingCount: Number(a.dataValues.pendingCount),
        completedCount: Number(a.dataValues.completedCount),
        avgTurnaroundHours: turnaround.avgTurnaroundHours || null,
        reviewsCompleted: turnaround.reviewsCompleted || 0,
      };
    }),
    committee: committeeRows,
  };
};


const getCoInvestigatorStudies = async (researcherId) => {
  if (!CoInvestigatorAssignment) return [];

  const assignments = await CoInvestigatorAssignment.findAll({
    where: { researcherId },
    include: [
      {
        model: Research,
        as: "research",
        attributes: [
          "id",
          "title",
          "discipline",
          "submissionType",
          "status",
          "researchId",
          "seruNumber",
          "createdAt",
          "updatedAt",
          "approvalValidUntil",
        ],
        include: [
          {
            model: Researcher,
            as: "researcher",
            attributes: ["id", "name", "institution"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return assignments
    .filter((a) => a.research && !a.research.isDeleted)
    .map((a) => ({
      ...a.research.toJSON(),
      coInvestigatorRole: a.roleOnStudy,
      canEdit: a.canEdit,
      assignedAt: a.createdAt,
    }));
};


const getResearchCoInvestigators = async (researchId, caller = {}) => {
  await assertResearchAccess(researchId, caller);
  if (!CoInvestigatorAssignment) return [];
  return CoInvestigatorAssignment.getForResearch(researchId);
};


const setCoInvestigatorEditAccess = async (researchId, coInvestigatorId, canEdit, piResearcherId) => {
  if (!CoInvestigatorAssignment) throw new AppError("Co-investigator feature unavailable.", 500);

  const research = await Research.findByPk(researchId, { attributes: ["id", "researcherId"] });
  if (!research) throw new AppError("Research not found.", 404);
  if (String(research.researcherId) !== String(piResearcherId)) {
    throw new AppError("Only the Principal Investigator can delegate edit access.", 403);
  }

  const assignment = await CoInvestigatorAssignment.findOne({
    where: { researchId, researcherId: coInvestigatorId },
  });
  if (!assignment) throw new AppError("Co-investigator not found on this study.", 404);

  assignment.canEdit = canEdit === true || canEdit === "true";
  await assignment.save();
  return assignment;
};


const COINVESTIGATOR_EDITABLE_FIELDS = [
  "abstract",
  "background",
  "objectives",
  "methodology",
  "expectedOutcome",
  "timeline",
  "inclusionCriteria",
  "exclusionCriteria",
  "literatureReviewSummary",
];

const coInvestigatorEditResearch = async (researcher, researchId, body) => {
  if (!CoInvestigatorAssignment) throw new AppError("Co-investigator feature unavailable.", 500);

  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  const assignment = await CoInvestigatorAssignment.findOne({
    where: { researchId, researcherId: researcher.id, canEdit: true },
  });
  if (!assignment) {
    throw new AppError("You do not have delegated edit access to this study.", 403);
  }

  const EDITABLE_STATUSES = [
    RESEARCH_STATUSES.SUBMITTED,
    RESEARCH_STATUSES.REVISION_REQUESTED,
    RESEARCH_STATUSES.RETURNED_FOR_CORRECTION,
  ];
  if (!EDITABLE_STATUSES.includes(research.status)) {
    throw new AppError(
      `This study is not currently open for co-investigator edits (status: '${research.status}').`,
      400,
    );
  }

  let changed = false;
  COINVESTIGATOR_EDITABLE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) {
      research[f] = body[f];
      changed = true;
    }
  });
  if (!changed) throw new AppError("No editable fields were provided.", 400);

  await research.save();
  return research;
};


const submitProtocolDeviation = async (researcher, body, files) => {
  const { ProtocolDeviation } = require("../sequelize/models");
  const {
    parentResearchId,
    deviationType,
    severity,
    description,
    dateOfDeviation,
    correctiveAction,
    participantsAffected,
    atRiskParticipantList,
    isUrgentSafety,
  } = body;

  const parentResearch = await Research.findOne({
    where: { id: parentResearchId, researcherId: researcher.id },
  });
  if (!parentResearch)
    throw new AppError(
      "Parent research not found or does not belong to you.",
      404,
    );

  const ALLOWED_STATUSES = [
    RESEARCH_STATUSES.APPROVED,
    RESEARCH_STATUSES.EXPIRED,
    RESEARCH_STATUSES.SUSPENDED,
  ];
  if (!ALLOWED_STATUSES.includes(parentResearch.status)) {
    throw new AppError(
      "Protocol deviations can only be filed for approved, expired, or suspended studies.",
      400,
    );
  }

  if (!description?.trim()) throw new AppError("Description is required.", 400);
  if (!dateOfDeviation)
    throw new AppError("Date of deviation is required.", 400);

  const supportingDocs = (files || []).map((f) => ({
    label: f.fieldname,
    url: `/uploads/proposal/${f.filename}`,
    key: f.key || null,
  }));


  let deadline = null;
  if (parentResearch.status === RESEARCH_STATUSES.EXPIRED) {
    const expiredDate = parentResearch.approvalValidUntil
      ? new Date(parentResearch.approvalValidUntil)
      : new Date();
    deadline = new Date(expiredDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  }

  const deviation = await ProtocolDeviation.create({
    researchId: parentResearchId,
    researcherId: researcher.id,
    deviationType: deviationType || "protocol_deviation",
    severity: severity || "minor",
    description: description.trim(),
    dateOfDeviation,
    correctiveAction: correctiveAction || null,
    participantsAffected: participantsAffected
      ? Number(participantsAffected)
      : 0,
    atRiskParticipantList: atRiskParticipantList || null,
    isUrgentSafety: isUrgentSafety === true || isUrgentSafety === "true",
    status: "submitted",
    submittedAt: new Date(),
    deadline,
    supportingDocuments: supportingDocs,
  });

  return deviation;
};

const getProtocolDeviations = async (researchId, caller = {}) => {
  await assertResearchAccess(researchId, caller);
  const { ProtocolDeviation } = require("../sequelize/models");
  if (!ProtocolDeviation) return [];
  return ProtocolDeviation.getForResearch(researchId);
};


const getDecisionLetter = async (researchId, caller = {}) => {
  await assertResearchAccess(researchId, caller);
  const research = await Research.findByPk(researchId, {
    attributes: ["id", "decisionLetterFile", "decisionLetterNumber", "decisionLetterIssuedAt"],
  });
  if (!research) throw new AppError("Research not found.", 404);
  if (!research.decisionLetterFile) {
    throw new AppError("No decision letter has been issued for this study yet.", 404);
  }
  return research;
};

module.exports = {
  getResearchById,
  getRevisionComparison,
  getMyResearch,
  initiateProposalPayment,
  confirmProposalSubmission,
  submitAmendment,
  submitContinuingReview,
  submitStudyClosure,
  resubmit,
  getAssignedResearch,
  submitReview,
  getResearchComments,
  getCommitteeQueue,
  getAllResearchCommittee,
  submitCommitteeReview,
  getFinalApprovalQueue,
  getFinalApprovalStats,
  getApprovalFeed,
  postApprovalComment,
  getRecordTimeline,
  getAllResearchAdmin,
  assignReviewers,
  assignReviewer,
  reactivateResearch,
  deleteResearch,
  getDashboardStats,
  getPublicResearchStats,
  getResearcherRevenue,
  getReviewerWorkload,
  getCoInvestigatorStudies,
  getResearchCoInvestigators,
  setCoInvestigatorEditAccess,
  coInvestigatorEditResearch,
  getDecisionLetter,
  recordCscEndorsement,
  returnForCorrection,
  markCompletenessVerified,
  submitProtocolDeviation,
  getProtocolDeviations,
  addCommitteeReportNote,
  getDecisionReport,
  updateDecisionReport,
  releaseDecisionReport,
  getOfficerReviewQueue,
  getDecisionLetterHistory,
};


async function getDecisionLetterHistory(researchId, caller = {}) {
  await assertResearchAccess(researchId, caller);

  const paper = await Research.findByPk(researchId, {
    attributes: [
      "id", "decisionLetterNumber", "decisionLetterFile",
      "decisionLetterFileKey", "decisionLetterIssuedAt",
    ],
  });
  if (!paper) throw new AppError("Research not found.", 404);

  const letters = [];

  if (ResearchDecisionReport) {
    const reports = await ResearchDecisionReport.findAll({
      where: {
        researchId,
        releasedAt: { [Op.ne]: null },
      },
      order: [["releasedAt", "DESC"]],
      attributes: [
        "id", "round", "finalDecision", "decisionLetterId",
        "releasedAt", "createdAt",
      ],
    });
    for (const rpt of reports) {
      if (rpt.decisionLetterId || paper.decisionLetterFile) {
        letters.push({
          id: rpt.id,
          letterNumber: paper.decisionLetterNumber || `DR-${rpt.round}`,
          file: paper.decisionLetterFile,
          issuedAt: rpt.releasedAt,
          decision: rpt.finalDecision,
          round: rpt.round,
          source: "decision_report",
        });
      }
    }
  }

  if (letters.length === 0 && paper.decisionLetterFile) {
    letters.push({
      id: paper.id,
      letterNumber: paper.decisionLetterNumber,
      file: paper.decisionLetterFile,
      issuedAt: paper.decisionLetterIssuedAt,
      decision: null,
      round: 1,
      source: "legacy",
    });
  }

  return letters;
}
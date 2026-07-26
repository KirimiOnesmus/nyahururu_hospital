"use strict";

const { Op, UniqueConstraintError } = require("sequelize");
const {
  Research, Researcher, Payment, Review, sequelize,
} = require("../sequelize/models");
const mpesa = require("../utils/mpesaService");
const email = require("../utils/emailServices");
const { AppError } = require("../utils/appError");
const {
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  RESEARCHER_ROLES,
  FEES,
  PAGINATION,
  REVIEW_WINDOW_DAYS,
  REVIEW_DECISION_DISPLAY,
  COMMITTEE_QUORUM,
} = require("../constants/researchIndex");

 

const CRITERIA_KEYS_BY_STAGE = {
  [RESEARCH_STAGES.PROPOSAL]: ["originality", "relevance", "feasibility", "ethics", "expectedImpact"],
  [RESEARCH_STAGES.PROGRESS]: ["methodologyCompliance", "dataQuality", "statisticalValidity", "ethicalCompliance", "researchProgress"],
  [RESEARCH_STAGES.FINAL_PAPER]: ["scientificIntegrity", "publicationReadiness", "documentCompleteness", "institutionalCompliance"],
};

const STAGE_SNAPSHOT_FIELD = {
  [RESEARCH_STAGES.PROPOSAL]:   "proposalReview",
  [RESEARCH_STAGES.PROGRESS]:   "progressReview",
  [RESEARCH_STAGES.FINAL_PAPER]:"finalPaperReview",
};

const NOTE_ROUND = 0;

const STAGE_TONE = {
  [RESEARCH_STAGES.PROPOSAL]:    "proposal",
  [RESEARCH_STAGES.PROGRESS]:    "progress",
  [RESEARCH_STAGES.FINAL_PAPER]: "final_paper",
};
const STAGE_LABEL = {
  [RESEARCH_STAGES.PROPOSAL]:    "Proposal Review",
  [RESEARCH_STAGES.PROGRESS]:    "Progress Review",
  [RESEARCH_STAGES.FINAL_PAPER]: "Final Paper Review",
};

const validateCriteria = (stage, criteria = {}) => {
  const allowedKeys = CRITERIA_KEYS_BY_STAGE[stage];
  if (!allowedKeys) throw new AppError(`No criteria definition for stage '${stage}'.`, 400);

  const submittedKeys = Object.keys(criteria || {});
  const unknownKeys = submittedKeys.filter((k) => !allowedKeys.includes(k));
  if (unknownKeys.length) {
    throw new AppError(
      `Unrecognized criteria field(s) for stage '${stage}': ${unknownKeys.join(", ")}.`,
      400,
    );
  }

  const cleaned = {};
  for (const key of allowedKeys) {
    const raw = criteria[key];
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      throw new AppError(
        `Criteria '${key}' must be a number between 0 and 10. Received: ${JSON.stringify(raw)}.`,
        400,
      );
    }
    cleaned[key] = value;
  }
  return cleaned;
};

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

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
  if (leaderDecision !== REVIEW_DECISIONS.APPROVED) return "pending_clarification";
  const isUnanimous = Object.keys(counts).length === 1;
  return isUnanimous ? "highly_recommended" : "approved_minors";
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

const fmtRelativeTime = (date) => {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};


const likeEscape = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);


const SORT_MAPS = {
  publishedResearch: {
    newest:    [["createdAt", "DESC"]],
    oldest:    [["createdAt", "ASC"]],
    downloads: [["downloads", "DESC"]],
    price:     [["downloadPrice", "ASC"]],
  },
};

const RESEARCHER_LIST_INCLUDE = [
  { model: Researcher, as: "researcher", attributes: ["id", "name", "institution"] },
];
const RESEARCHER_LIST_WITH_EMAIL_INCLUDE = [
  { model: Researcher, as: "researcher", attributes: ["id", "name", "institution", "email"] },
];
const RESEARCHER_BIO_INCLUDE = [
  {
    model: Researcher, as: "researcher",
    attributes: ["id", "name", "institution", "bio", "socialLinks"],
  },
];
const RESEARCHER_FULL_INCLUDE = [
  {
    model: Researcher, as: "researcher",
    attributes: ["id", "name", "institution", "bio", "socialLinks", "email"],
  },
];

const getPublishedResearch = async (query) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search, discipline, sort = "newest",
    priceMin, priceMax,
  } = query;

  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);

  const where = { isPublished: true };
  if (discipline) where.discipline = { [Op.like]: `%${likeEscape(discipline)}%` };
  if (priceMin !== undefined || priceMax !== undefined) {
    where.downloadPrice = {};
    if (priceMin !== undefined) where.downloadPrice[Op.gte] = Number(priceMin);
    if (priceMax !== undefined) where.downloadPrice[Op.lte] = Number(priceMax);
  }
  if (search) {

    where[Op.and] = [
      sequelize.literal(
        "MATCH(title, abstract, final_abstract) AGAINST(:searchTerm IN NATURAL LANGUAGE MODE)",
      ),
    ];
  }

  const findOptions = {
    where,
    attributes: [
      "id", "title", "discipline", "finalAbstract", "abstract", "keywords",
      "downloads", "views", "downloadPrice", "publishedAt", "researchId",
      "researcherId",
    ],
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "name", "institution"] },
    ],
    order: SORT_MAPS.publishedResearch[sort] || SORT_MAPS.publishedResearch.newest,
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
  if (search) {
    findOptions.replacements = { searchTerm: search };
  }

  const [papers, total] = await Promise.all([
    Research.findAll(findOptions),
    Research.count({ where, ...(search && { replacements: { searchTerm: search } }) }),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const getPublishedPaperById = async (id) => {
  const paper = await Research.findOne({
    where: { id, isPublished: true },
    attributes: {
      exclude: ["proposalFile", "proposalFileKey", "finalPaperFile", "finalPaperFileKey"],
    },
    include: RESEARCHER_BIO_INCLUDE,
  });

  if (!paper) throw new AppError("Research paper not found.", 404);

  await Research.increment("views", { by: 1, where: { id } });

  return paper;
};

const getResearchById = async (id, caller = {}) => {

  const paper = await Research.findByPk(id, {
    include: [
      ...RESEARCHER_FULL_INCLUDE,
      {
        model: Researcher, as: "assignedReviewer",
        attributes: ["id", "name", "firstName", "lastName", "email", "institution"],
      },
      { model: Researcher, as: "reviewer",           attributes: ["id", "name"] },
      { model: Researcher, as: "committeeReviewer",  attributes: ["id", "name"] },
    ],
  });

  if (!paper) throw new AppError("Research not found.", 404);

  const { researcher, user } = caller;
  const isStaff     = user && ["admin", "superadmin"].includes(user.role);
  const isReviewer  = researcher?.role === RESEARCHER_ROLES.REVIEWER;
  const isCommittee =
    researcher?.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE || researcher?.isCommittee;
  const isOwner =
    researcher && String(paper.researcherId) === String(researcher.id);

  if (!isStaff && !isReviewer && !isCommittee && !isOwner) {
    throw new AppError("You do not have access to this research.", 403);
  }

  return paper;
};

const getMyResearch = async (researcherId, { page, limit }) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where: { researcherId },
    attributes: [
      "id", "title", "discipline", "stage", "status", "isPublished",
      "downloads", "downloadPrice", "reviewComment", "committeeComment",
      "createdAt", "updatedAt", "researchId", "submissionPaymentId",
    ],
    include: [
      {
        model: Payment, as: "submissionPayment",
        attributes: [
          "id", "status", "amount", "mpesaReceiptNumber",
          "checkoutRequestId", "createdAt",
        ],
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

const initiateProposalPayment = async ({ phone, researcherId }) => {
  const amount = FEES.PROPOSAL_SUBMISSION;
  const accountRef = "Proposal";
  const description = "Research proposal submission fee";

  const stkResult = await mpesa.initiateSTKPush({ phone, amount, accountRef, description });

  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription || "Payment initiation failed. Please try again.",
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
    message: stkResult.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    checkoutRequestId: stkResult.CheckoutRequestID,
    paymentId: payment.id,
    amount,
  };
};


const confirmProposalSubmission = async (researcher, body, file) => {
  const {
    paymentId, title, discipline, abstract, background, objectives,
    methodology, expectedOutcome, timeline, teamMembers, references,
  } = body;

  const similar = await Research.findSimilarTitles(title);
  if (similar.length) {
    throw new AppError(
      `A similar research title already exists: "${similar[0].title}". ` +
        `Please use a more distinct title or contact admin if this is unrelated.`,
      409,
    );
  }

  return sequelize.transaction(async (t) => {
    const payment = await Payment.findByPk(paymentId, { transaction: t });
    if (!payment) throw new AppError("Payment record not found.", 404);
    if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
      throw new AppError(
        `Payment is ${payment.status}. Please complete the M-Pesa payment before submitting.`,
        400,
      );
    }

    if (!payment.researcherId) {
      payment.researcherId = researcher.id;
      await payment.save({ transaction: t });
    }

    const proposalFile = file ? `/uploads/proposal/${file.filename}` : null;
    const proposalFileKey = file?.key || null;

    const newResearch = await Research.create(
      {
        title, discipline, abstract, background, objectives,
        methodology, expectedOutcome, timeline, teamMembers, references,
        proposalFile, proposalFileKey,
        researcherId: researcher.id,
        stage: RESEARCH_STAGES.PROPOSAL,
        status: RESEARCH_STATUSES.PENDING,
        submissionPaymentId: payment.id,
        isPublished: false,
        downloadPrice: FEES.DEFAULT_DOWNLOAD,
      },
      { transaction: t },
    );

    payment.researchId = newResearch.id;
    await payment.save({ transaction: t });

    setImmediate(() => {
      email.sendProposalSubmitted({
        email: researcher.email,
        name: researcher.name || researcher.firstName,
        proposalTitle: newResearch.title,
        mpesaReceipt: payment.mpesaReceiptNumber,
        amount: payment.amount,
      }).catch((err) =>
        console.error("[confirmProposalSubmission] email failed:", err.message),
      );
    });

    return newResearch;
  });
};

const submitProgress = async (researcher, researchId, body, files) => {
  const research = await Research.findOne({
    where: { id: researchId, researcherId: researcher.id },
  });
  if (!research) {
    throw new AppError("Research not found or does not belong to you.", 404);
  }

  if (!research.canSubmitProgress) {
    throw new AppError(
      `Cannot submit progress — requires stage 'proposal' with status 'approved'. ` +
        `Current: stage='${research.stage}', status='${research.status}'.`,
      400,
    );
  }

  const isDraft = body.isDraft === true || body.isDraft === "true";

  const {
    methodology, studyDesign, samplingMethod, sampleSizeAchieved, sampleSizeTarget,
    dataCollectionProgress, statisticalMethods, analysisTools, preliminaryFindings,
    deviationsFromProtocol, ethicalIncidents, participantWithdrawals,
  } = body;

  if (!isDraft) {
    const existingFiles = research.progressFiles || [];
    const hasFile = (label) =>
      existingFiles.some((f) => f.label === label) ||
      files?.some((f) => f.fieldname === label);

    const REQUIRED_FILES = ["draftManuscript", "datasets", "statisticalOutputs"];
    const missing = REQUIRED_FILES.filter((f) => !hasFile(f));
    if (missing.length) {
      throw new AppError(`Missing required file(s) for submission: ${missing.join(", ")}.`, 400);
    }
  }

  research.progressData = {
    ...(research.progressData || {}),
    methodology, studyDesign, samplingMethod,
    sampleSizeAchieved: sampleSizeAchieved !== undefined
      ? Number(sampleSizeAchieved) : research.progressData?.sampleSizeAchieved,
    sampleSizeTarget: sampleSizeTarget !== undefined
      ? Number(sampleSizeTarget) : research.progressData?.sampleSizeTarget,
    dataCollectionProgress, statisticalMethods, analysisTools, preliminaryFindings,
    deviationsFromProtocol, ethicalIncidents, participantWithdrawals,
    submittedAt: isDraft ? research.progressData?.submittedAt : new Date(),
    savedAt: new Date(),
  };

  if (files?.length) {
    const incoming = files.map((f) => ({
      label: f.fieldname,
      url: `/uploads/progress/${f.filename}`,
      key: f.key || null,
    }));
    const existing = (research.progressFiles || []).filter(
      (ef) => !incoming.some((nf) => nf.label === ef.label),
    );
    research.progressFiles = [...existing, ...incoming];
  }

  if (isDraft) {
    await research.save();
    return research;
  }

  research.stage = RESEARCH_STAGES.PROGRESS;
  if (research.assignedReviewerId) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() + (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
    );
  } else {
    research.status = RESEARCH_STATUSES.PENDING;
  }
  await research.save();

  await email.sendProgressSubmitted({
    email: researcher.email,
    name: researcher.name || researcher.firstName,
    proposalTitle: research.title,
  });

  if (research.assignedReviewerId) {
    const reviewer = await Researcher.findByPk(research.assignedReviewerId, {
      attributes: ["email", "name", "firstName"],
    });
    if (reviewer) {
      await email.sendNewProposalToReview({
        email: reviewer.email,
        name: reviewer.firstName || reviewer.name,
        proposalTitle: research.title,
        researcherName: researcher.name || researcher.firstName,
        stage: RESEARCH_STAGES.PROGRESS,
        discipline: research.discipline,
        reviewLink: `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};

const submitFinalPaper = async (researcher, researchId, body, file, supportingFiles = {}) => {
  const {
    finalAbstract, keywords, conflictOfInterestDeclared, aiUsageDeclared,
    aiUsageDetails, plagiarismReportLink, fundingSource, noteToCommittee,
  } = body;

  const research = await Research.findOne({
    where: { id: researchId, researcherId: researcher.id },
  });
  if (!research) throw new AppError("Research not found or does not belong to you.", 404);

  if (research.stage !== RESEARCH_STAGES.PROGRESS) {
    throw new AppError(
      `Cannot submit final paper — current stage is '${research.stage}'. ` +
        `Progress stage must be approved first.`,
      400,
    );
  }
  if (research.status !== RESEARCH_STATUSES.APPROVED) {
    throw new AppError(
      "Your progress report must be approved before submitting the final paper.",
      400,
    );
  }
  if (!file) throw new AppError("Final paper PDF file is required.", 400);

  research.finalAbstract = finalAbstract || research.abstract;
  research.keywords = Array.isArray(keywords)
    ? keywords
    : (keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
  research.finalPaperFile = `/uploads/final_paper/${file.filename}`;
  research.finalPaperFileKey = file.key || null;

  const fileMeta = (f) =>
    f ? { url: `/uploads/final_paper/${f.filename}`, key: f.key || null } : undefined;

  research.finalPaperSubmission = {
    ...(research.finalPaperSubmission || {}),
    supportingFiles: {
      ...(research.finalPaperSubmission?.supportingFiles || {}),
      ...(fileMeta(supportingFiles.finalDataset)       && { finalDataset:       fileMeta(supportingFiles.finalDataset) }),
      ...(fileMeta(supportingFiles.dataDictionary)     && { dataDictionary:     fileMeta(supportingFiles.dataDictionary) }),
      ...(fileMeta(supportingFiles.statisticalScripts) && { statisticalScripts: fileMeta(supportingFiles.statisticalScripts) }),
      ...(fileMeta(supportingFiles.ethicsApproval)     && { ethicsApproval:     fileMeta(supportingFiles.ethicsApproval) }),
      ...(fileMeta(supportingFiles.fundingDisclosure)  && { fundingDisclosure:  fileMeta(supportingFiles.fundingDisclosure) }),
    },
    declarations: {
      conflictOfInterestDeclared: conflictOfInterestDeclared === true || conflictOfInterestDeclared === "true",
      aiUsageDeclared:            aiUsageDeclared === true            || aiUsageDeclared === "true",
      aiUsageDetails:             aiUsageDetails || "",
    },
    plagiarismReportLink: plagiarismReportLink || "",
    fundingSource:        fundingSource || "",
    noteToCommittee:      noteToCommittee || "",
  };

  research.stage = RESEARCH_STAGES.FINAL_PAPER;
  if (research.assignedReviewerId) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() + (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
    );
  } else {
    research.status = RESEARCH_STATUSES.PENDING;
  }
  await research.save();

  await email.sendFinalPaperSubmitted({
    email: researcher.email,
    name: researcher.name || researcher.firstName,
    proposalTitle: research.title,
  });

  if (research.assignedReviewerId) {
    const reviewer = await Researcher.findByPk(research.assignedReviewerId, {
      attributes: ["email", "name", "firstName"],
    });
    if (reviewer) {
      await email.sendNewProposalToReview({
        email: reviewer.email,
        name: reviewer.firstName || reviewer.name,
        proposalTitle: research.title,
        researcherName: researcher.name || researcher.firstName,
        stage: RESEARCH_STAGES.FINAL_PAPER,
        discipline: research.discipline,
        reviewLink: `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};


const resubmit = async (researcher, researchId, body, file) => {
  const research = await Research.findOne({
    where: { id: researchId, researcherId: researcher.id },
  });
  if (!research) throw new AppError("Research not found.", 404);

  const RESUBMITTABLE = [
    RESEARCH_STATUSES.REVISION_REQUESTED,
    RESEARCH_STATUSES.REJECTED,
  ];
  if (!RESUBMITTABLE.includes(research.status)) {
    throw new AppError(
      `Resubmission is only allowed when status is 'revision_requested' or 'rejected'. ` +
        `Current: '${research.status}'.`,
      400,
    );
  }

  const ALLOWED = [
    "abstract", "background", "objectives", "methodology",
    "expectedOutcome", "timeline", "finalAbstract", "keywords",
  ];
  ALLOWED.forEach((f) => {
    if (body[f] !== undefined) research[f] = body[f];
  });

  if (file) {
    const fileField = research.stage === RESEARCH_STAGES.FINAL_PAPER
      ? "finalPaperFile" : "proposalFile";
    const fileKeyField = research.stage === RESEARCH_STAGES.FINAL_PAPER
      ? "finalPaperFileKey" : "proposalFileKey";
    research[fileField] = `/uploads/proposal/${file.filename}`;
    research[fileKeyField] = file.key || null;
  }

  let routedToCommittee = false;

  if (research.stage === RESEARCH_STAGES.FINAL_PAPER) {

    if (research.committeeReviewedAt) {
      research.status = RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW;
      routedToCommittee = true;
    } else if (research.assignedReviewerId) {
      research.status = RESEARCH_STATUSES.UNDER_REVIEW;
      research.reviewDeadline = new Date(
        Date.now() + (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
      );
    } else {
      research.status = RESEARCH_STATUSES.PENDING;
    }
  } else if (research.assignedReviewerId) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() + (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
    );
  } else {
    research.status = RESEARCH_STATUSES.PENDING;
  }

  research.resubmissionCount = (research.resubmissionCount || 0) + 1;
  await research.save();

  if (routedToCommittee) {
    const committee = await Researcher.findCommitteeMembers({
      attributes: ["email", "name", "firstName"],
    });
    await Promise.all(
      committee.map((member) =>
        email.sendNewProposalToReview({
          email: member.email,
          name: member.firstName || member.name,
          proposalTitle: research.title,
          researcherName: researcher.name || researcher.firstName,
          stage: RESEARCH_STAGES.FINAL_PAPER,
          discipline: research.discipline,
          reviewLink: `${process.env.FRONTEND_URL}/hmis`,
        }),
      ),
    );
  } else if (research.assignedReviewerId) {
    const reviewer = await Researcher.findByPk(research.assignedReviewerId, {
      attributes: ["email", "name", "firstName"],
    });
    if (reviewer) {
      await email.sendResubmissionNotice({
        email: reviewer.email,
        reviewerName: reviewer.name || reviewer.firstName,
        proposalTitle: research.title,
        researcherName: researcher.name || researcher.firstName,
        reviewLink: `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};


const getAssignedResearch = async (reviewerId, { page, limit, stage, includeCompleted }) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const where = { assignedReviewerId: reviewerId };

  if (includeCompleted === "all") {
    // no status filter — return everything assigned
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
        RESEARCH_STATUSES.PENDING,
        RESEARCH_STATUSES.REVISION_REQUESTED,
      ],
    };
  }

  if (stage) where.stage = stage;

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id", "title", "discipline", "stage", "status", "resubmissionCount",
      "assignedAt", "createdAt", "reviewDeadline", "priority",
      "aggregateScore", "reviewDecision", "reviewedAt", "researchId",
      "researcherId",
    ],
    include: RESEARCHER_LIST_INCLUDE,
    order: [["assignedAt", "DESC"]],
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

const submitReview = async (reviewer, { researchId, stage, decision, comment, criteria }) => {
  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "email", "name", "firstName"] },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  if (String(research.assignedReviewerId) !== String(reviewer.id)) {
    throw new AppError("You are not the assigned reviewer for this research.", 403);
  }
  if (research.status !== RESEARCH_STATUSES.UNDER_REVIEW) {
    throw new AppError(`Cannot review — current status is '${research.status}'.`, 400);
  }

  const VALID_DECISIONS = Object.values(REVIEW_DECISIONS);
  if (!VALID_DECISIONS.includes(decision)) {
    throw new AppError(
      `Invalid decision '${decision}'. Must be one of: ${VALID_DECISIONS.join(", ")}.`,
      400,
    );
  }

  const ALLOWED_DECISIONS_BY_STAGE = {
    [RESEARCH_STAGES.PROPOSAL]: [
      REVIEW_DECISIONS.APPROVED, REVIEW_DECISIONS.REVISION, REVIEW_DECISIONS.REJECTED,
    ],
    [RESEARCH_STAGES.PROGRESS]: [
      REVIEW_DECISIONS.APPROVED, REVIEW_DECISIONS.REVISION, REVIEW_DECISIONS.SUSPENDED,
    ],
    [RESEARCH_STAGES.FINAL_PAPER]: [
      REVIEW_DECISIONS.APPROVED, REVIEW_DECISIONS.REVISION, REVIEW_DECISIONS.REJECTED,
    ],
  };
  if (!ALLOWED_DECISIONS_BY_STAGE[stage]?.includes(decision)) {
    throw new AppError(`Decision '${decision}' is not valid for stage '${stage}'.`, 400);
  }

  const validatedCriteria = validateCriteria(stage, criteria);
  const criteriaValues = Object.values(validatedCriteria);
  const aggregateScore = criteriaValues.length
    ? Number((criteriaValues.reduce((s, v) => s + v, 0) / criteriaValues.length).toFixed(1))
    : null;


  const latestReview = await Review.findOne({
    where: {
      researchId, stage, isLatest: true, reviewerRole: "reviewer",
    },
    attributes: ["round"],
  });
  const round = latestReview ? latestReview.round + 1 : 1;

  const review = await Review.create({
    researchId,
    reviewerId: reviewer.id,
    reviewerRole: "reviewer",
    stage,
    round,
    decision,
    comment,
    criteria: validatedCriteria,
    isLatest: true,
    submittedAt: new Date(),
  });

  const isFinalPaperApproval =
    stage === RESEARCH_STAGES.FINAL_PAPER && decision === REVIEW_DECISIONS.APPROVED;

  const statusMap = {
    [REVIEW_DECISIONS.APPROVED]: RESEARCH_STATUSES.APPROVED,
    [REVIEW_DECISIONS.REVISION]: RESEARCH_STATUSES.REVISION_REQUESTED,
    [REVIEW_DECISIONS.REJECTED]: RESEARCH_STATUSES.REJECTED,
    [REVIEW_DECISIONS.SUSPENDED]: RESEARCH_STATUSES.SUSPENDED,
  };

  research.status = isFinalPaperApproval
    ? RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW
    : statusMap[decision];
  research.reviewComment = comment;
  research.reviewedById = reviewer.id;
  research.reviewedAt = new Date();
  research.aggregateScore = aggregateScore;
  research.reviewDecision = REVIEW_DECISION_DISPLAY[decision] || decision;

  const snapshotField = STAGE_SNAPSHOT_FIELD[stage];
  if (snapshotField) {
    research[snapshotField] = {
      decision,
      comment,
      criteria: validatedCriteria,
      aggregateScore,
      reviewedBy: reviewer.id,
      reviewedByName: reviewer.name || reviewer.firstName || null,
      reviewedAt: new Date(),
    };
  }

  if (
    decision === REVIEW_DECISIONS.APPROVED &&
    stage === RESEARCH_STAGES.PROPOSAL &&
    !research.researchId
  ) {
    research.researchId = await Research.generateResearchId();
  }

  await research.save();

  if (
    decision === REVIEW_DECISIONS.APPROVED &&
    stage === RESEARCH_STAGES.PROPOSAL
  ) {
    
    const certificateService = require("./certificateService");
    await certificateService.issueClearanceCertificate(research.id, reviewer.id);
  }

  const stats = await Review.getReviewerStats(reviewer.id);
  await Researcher.increment("reviewCount", { by: 1, where: { id: reviewer.id } });
  await Researcher.update(
    { acceptanceRate: stats.acceptanceRate },
    { where: { id: reviewer.id } },
  );

  const researcherDoc = research.researcher;
  const emailData = {
    email: researcherDoc.email,
    name: researcherDoc.name || researcherDoc.firstName,
    proposalTitle: research.title,
    stage,
    reviewerComment: comment,
  };

  if (isFinalPaperApproval) {
    await email.sendFinalPaperForwardedToCommittee?.(emailData);

    const committee = await Researcher.findCommitteeMembers({
      attributes: ["email", "name", "firstName"],
    });
    await Promise.all(
      committee.map((member) =>
        email.sendNewProposalToReview({
          email: member.email,
          name: member.firstName || member.name,
          proposalTitle: research.title,
          researcherName: researcherDoc.name || researcherDoc.firstName,
          stage: RESEARCH_STAGES.FINAL_PAPER,
          discipline: research.discipline,
          reviewLink: `${process.env.FRONTEND_URL}/hmis`,
        }),
      ),
    );
  } else if (decision === REVIEW_DECISIONS.APPROVED) {
    await email.sendProposalApproved(emailData);
  } else if (decision === REVIEW_DECISIONS.REVISION) {
    await email.sendRevisionRequested(emailData);
  } else {
    await email.sendProposalRejected(emailData);
  }

  return { review, research };
};


const getCommitteeQueue = async ({ page, limit }) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const where = {
    stage:  RESEARCH_STAGES.FINAL_PAPER,
    status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  };

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id", "title", "discipline", "stage", "status", "resubmissionCount",
      "reviewComment", "reviewedAt", "createdAt", "committeeRound",
      "researcherId", "reviewedById",
    ],
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "name", "institution"] },
      { model: Researcher, as: "reviewer",   attributes: ["id", "name"] },
    ],
    order: [["reviewedAt", "DESC"]],
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

const getAllResearchCommittee = async ({ stage, status, search, page, limit }) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const where = {};
  if (stage) where.stage = stage;
  if (status) where.status = status;
  if (search) {
    const like = `%${likeEscape(search)}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { abstract: { [Op.like]: like } },
    ];
  }

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id", "title", "discipline", "stage", "status", "isPublished",
      "researcherId", "reviewedAt", "committeeReviewedAt", "aggregateScore",
      "researchId", "createdAt", "updatedAt",
    ],
    include: RESEARCHER_LIST_INCLUDE,
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


const submitCommitteeReview = async (
  committeeMember,
  { researchId, decision, comment, criteria },
) => {
  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "email", "name", "firstName"] },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  if (research.stage !== RESEARCH_STAGES.FINAL_PAPER) {
    throw new AppError("Committee review only applies to final-paper submissions.", 400);
  }
  if (research.status !== RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW) {
    throw new AppError(
      `This paper is not awaiting committee review. Current status: '${research.status}'.`,
      400,
    );
  }

  const VALID_DECISIONS = Object.values(REVIEW_DECISIONS).filter(
    (d) => d !== REVIEW_DECISIONS.SUSPENDED,
  );
  if (!VALID_DECISIONS.includes(decision)) {
    throw new AppError(
      `Committee decision must be one of: ${VALID_DECISIONS.join(", ")}.`,
      400,
    );
  }

  const currentRound = research.committeeRound || 1;

  
  const alreadyVoted = await Review.findOne({
    where: {
      researchId,
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      round: currentRound,
      reviewerId: committeeMember.id,
    },
  });
  if (alreadyVoted) {
    throw new AppError(
      "You have already cast your committee vote for this submission's current round.",
      409,
    );
  }

  const existingVotes = await Review.findAll({
    where: {
      researchId,
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      round: currentRound,
    },
  });

  if (existingVotes.length >= COMMITTEE_QUORUM.MAX_VOTES) {
    throw new AppError(
      `This submission has already received the maximum of ${COMMITTEE_QUORUM.MAX_VOTES} committee votes.`,
      409,
    );
  }

  const validatedCriteria = criteria
    ? validateCriteria(RESEARCH_STAGES.FINAL_PAPER, criteria)
    : {};

  let vote;
  try {
    vote = await Review.create({
      researchId,
      reviewerId: committeeMember.id,
      reviewerRole: "committee",
      stage: RESEARCH_STAGES.FINAL_PAPER,
      round: currentRound,
      decision,
      comment,
      criteria: validatedCriteria,
      isLatest: false, 
      submittedAt: new Date(),
    });
  } catch (err) {

    if (err instanceof UniqueConstraintError) {
      throw new AppError(
        "You have already cast your committee vote for this submission's current round.",
        409,
      );
    }
    throw err;
  }

  const allVotes = [...existingVotes, vote];
  const totalVotes = allVotes.length;
  const remainingSlots = COMMITTEE_QUORUM.MAX_VOTES - totalVotes;

  const { counts, sorted } = tallyCommitteeVotes(allVotes);
  const [leaderDecision, leaderCount] = sorted[0];
  const runnerUpCount = sorted[1]?.[1] || 0;

  const isMathematicallyLocked = leaderCount > runnerUpCount + remainingSlots;
  const quorumMet = totalVotes >= COMMITTEE_QUORUM.MIN_VOTES;
  const isFinal =
    totalVotes === COMMITTEE_QUORUM.MAX_VOTES ||
    (quorumMet && isMathematicallyLocked);

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

  const statusMap = {
    [REVIEW_DECISIONS.APPROVED]: RESEARCH_STATUSES.APPROVED,
    [REVIEW_DECISIONS.REVISION]: RESEARCH_STATUSES.REVISION_REQUESTED,
    [REVIEW_DECISIONS.REJECTED]: RESEARCH_STATUSES.REJECTED,
  };

  research.status = statusMap[leaderDecision];
  research.committeeReviewedById = committeeMember.id;
  research.committeeReviewedAt = new Date();
  research.committeeRound = currentRound + 1;
  research.reviewDecision = REVIEW_DECISION_DISPLAY[leaderDecision] || leaderDecision;

  const scoredVotes = allVotes.filter((v) => Object.keys(v.criteria || {}).length);
  if (scoredVotes.length) {
    const total = scoredVotes.reduce((sum, v) => {
      const vals = Object.values(v.criteria);
      return sum + vals.reduce((s, x) => s + x, 0) / vals.length;
    }, 0);
    research.aggregateScore = Number((total / scoredVotes.length).toFixed(1));
  }

  await research.save();

  const researcherDoc = research.researcher;
  const emailData = {
    email: researcherDoc.email,
    name: researcherDoc.name || researcherDoc.firstName,
    proposalTitle: research.title,
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerComment: comment,
  };

  if (leaderDecision === REVIEW_DECISIONS.APPROVED) {
    await email.sendProposalApproved(emailData);
  } else if (leaderDecision === REVIEW_DECISIONS.REVISION) {
    await email.sendRevisionRequested(emailData);
  } else {
    await email.sendProposalRejected(emailData);
  }

  return {
    review: vote,
    research,
    finalized: true,
    votesReceived: totalVotes,
    decisionCounts: counts,
  };
};


const getCommitteeVotes = async (researchId, round) => {
  const research = await Research.findByPk(researchId, {
    attributes: ["committeeRound"],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const targetRound = round ?? Math.max(1, (research.committeeRound || 1) - 1);

  const votes = await Review.findAll({
    where: {
      researchId,
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      round: targetRound,
    },
    include: [
      {
        model: Researcher, as: "reviewer",
        attributes: ["id", "name", "firstName", "lastName", "email"],
      },
    ],
    order: [["submittedAt", "ASC"]],
  });

  return votes.map((v) => ({
    id: v.id,
    member:
      v.reviewer?.name ||
      `${v.reviewer?.firstName || ""} ${v.reviewer?.lastName || ""}`.trim(),
    email: v.reviewer?.email,
    decision: v.decision,
    comment: v.comment,
    criteria: v.criteria,
    votedAt: v.submittedAt,
  }));
};

const getFinalApprovalQueue = async ({ page, limit } = {}) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const where = {
    stage:  RESEARCH_STAGES.FINAL_PAPER,
    status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  };

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id", "title", "discipline", "stage", "status", "resubmissionCount",
      "reviewedAt", "createdAt", "committeeRound", "researchId",
      "assignedReviewerId", "aggregateScore", "researcherId",
    ],
    include: [
      { model: Researcher, as: "researcher",       attributes: ["id", "name", "institution"] },
      { model: Researcher, as: "assignedReviewer", attributes: ["id", "name", "email", "institution"] },
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


  const roundByResearch = {};
  papers.forEach((p) => {
    roundByResearch[String(p.id)] = p.committeeRound || 1;
  });

  const allVotes = await Review.findAll({
    where: {
      researchId: { [Op.in]: papers.map((p) => p.id) },
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      round: { [Op.gte]: 1 },
    },
    raw: true,
  });

  const votesByResearch = {};
  allVotes.forEach((v) => {
    const key = String(v.researchId);
    const round = roundByResearch[key] ?? 1;
    if (v.round !== round) return;
    (votesByResearch[key] = votesByResearch[key] || []).push(v);
  });

  const records = papers.map((p) => {
    const votes = votesByResearch[String(p.id)] || [];
    const principalReviewer = p.assignedReviewer?.name || "Unassigned";

    return {
      _id: p.id,
      projectId: p.researchId || `#${String(p.id).slice(-6).toUpperCase()}`,
      title: p.title,
      principalReviewer,
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

const getFinalApprovalStats = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const queueFilter = {
    stage: RESEARCH_STAGES.FINAL_PAPER,
    status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  };

  const [awaitingSignOff, totalApprovedMtd, finalizedThisMonth, queueRecords] =
    await Promise.all([
      Research.count({ where: queueFilter }),
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
      Research.findAll({
        where: queueFilter,
        attributes: ["id", "committeeRound"],
        raw: true,
      }),
    ]);

  let avgReviewTimeDays = null;
  if (finalizedThisMonth.length) {
    const totalDays = finalizedThisMonth.reduce((sum, r) => {
      if (!r.reviewedAt || !r.committeeReviewedAt) return sum;
      const days =
        (new Date(r.committeeReviewedAt) - new Date(r.reviewedAt)) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgReviewTimeDays = Number((totalDays / finalizedThisMonth.length).toFixed(1));
  }

  let pendingClarifications = 0;
  if (queueRecords.length) {
    const allVotes = await Review.findAll({
      where: {
        researchId: { [Op.in]: queueRecords.map((r) => r.id) },
        stage: RESEARCH_STAGES.FINAL_PAPER,
        reviewerRole: "committee",
        round: { [Op.gte]: 1 },
      },
      raw: true,
    });

    const votesByResearch = {};
    allVotes.forEach((v) => {
      const key = String(v.researchId);
      (votesByResearch[key] = votesByResearch[key] || []).push(v);
    });

    pendingClarifications = queueRecords.filter((r) => {
      const round = r.committeeRound || 1;
      const votes = (votesByResearch[String(r.id)] || []).filter(
        (v) => v.round === round,
      );
      return deriveOutcome(votes) === "pending_clarification";
    }).length;
  }

  return {
    awaitingSignOff,
    totalApprovedMtd,
    pendingClarifications,
    avgReviewTimeDays,
  };
};


const getApprovalFeed = async ({ limit = 50 } = {}) => {
  const votes = await Review.findAll({
    where: {
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      comment: { [Op.ne]: null, [Op.ne]: "" },
    },
    include: [
      { model: Researcher, as: "reviewer", attributes: ["id", "name"] },
      { model: Research,   as: "research", attributes: ["id", "title", "researchId"] },
    ],
    order: [["submittedAt", "DESC"]],
    limit: Math.min(Number(limit) || 50, 100),
  });

  const toneOf = (decision) => {
    if (decision === REVIEW_DECISIONS.APPROVED) return "success";
    if (decision === REVIEW_DECISIONS.REJECTED) return "warning";
    return "neutral"; 
  };

  return votes.map((v) => {
    const name = v.reviewer?.name || "Committee Member";
    return {
      _id: v.id,
      author: name,
      initials: initialsOf(name),
      message: v.research?.title
        ? `[${v.research.researchId || v.research.title}] ${v.comment}`
        : v.comment,
      tone: toneOf(v.decision),
      time: fmtRelativeTime(v.submittedAt),
    };
  });
};

const postApprovalComment = async (committeeMember, { researchId, message }) => {
  if (!researchId) {
    throw new AppError("A research record must be selected for this note.", 400);
  }
  if (!message || !message.trim()) {
    throw new AppError("Comment message is required.", 400);
  }

  const research = await Research.findByPk(researchId, {
    attributes: ["id", "title", "researchId", "stage"],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const note = await Review.create({
    researchId: research.id,
    reviewerId: committeeMember.id,
    reviewerRole: "committee",
    stage: research.stage,
    round: NOTE_ROUND,
    decision: REVIEW_DECISIONS.NOTED,
    comment: message.trim(),
    isLatest: false,
    submittedAt: new Date(),
  });

  return {
    _id: note.id,
    author: committeeMember.name || "Committee Member",
    initials: initialsOf(committeeMember.name),
    message: `[${research.researchId || research.title}] ${note.comment}`,
    tone: "neutral",
    time: "Just now",
  };
};


const getRecordTimeline = async (researchId) => {
  const researchDoc = await Research.findByPk(researchId, {
    attributes: ["title", "researchId"],
  });
  if (!researchDoc) throw new AppError("Research not found.", 404);

  const reviews = await Review.getAllForResearch(researchId);

  return reviews.map((r) => {
    const isCommittee = r.reviewerRole === "committee";
    const stageTone   = isCommittee ? "committee" : STAGE_TONE[r.stage] || "proposal";
    const stageLabel  = isCommittee
      ? (r.round === 0 ? "Committee Note" : `Committee Vote (Round ${r.round})`)
      : STAGE_LABEL[r.stage] || r.stage;

    return {
      _id: r.id,
      stage: stageTone,
      stageLabel,
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


const getAllResearchAdmin = async ({ stage, status, search, page, limit }) => {
  const safePage  = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const where = {};
  if (stage) where.stage = stage;
  if (status) where.status = status;
  if (search) {
    const like = `%${likeEscape(search)}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { abstract: { [Op.like]: like } },
    ];
  }

  const { rows: papers, count: total } = await Research.findAndCountAll({
    where,
    attributes: [
      "id", "title", "discipline", "stage", "status", "isPublished",
      "researcherId", "assignedReviewerId", "reviewComment", "committeeComment",
      "committeeReviewedById", "downloadPrice", "downloads", "researchId",
      "createdAt", "updatedAt",
    ],
    include: [
      { model: Researcher, as: "researcher",       attributes: ["id", "name", "institution", "email"] },
      { model: Researcher, as: "assignedReviewer", attributes: ["id", "name", "email", "institution"] },
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


const assignReviewer = async (researchId, reviewerEmail) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  const ASSIGNABLE_STATUSES = [
    RESEARCH_STATUSES.PENDING,
    RESEARCH_STATUSES.UNDER_REVIEW,
    RESEARCH_STATUSES.REVISION_REQUESTED,
  ];

  if (!ASSIGNABLE_STATUSES.includes(research.status)) {
    throw new AppError(
      `Cannot assign reviewer — research status is '${research.status}'. ` +
        `Expected one of: ${ASSIGNABLE_STATUSES.join(", ")}.`,
      400,
    );
  }

  const isReassignment = Boolean(research.assignedReviewerId);

  const reviewer = await Researcher.findOne({
    where: {
      email: reviewerEmail.toLowerCase().trim(),
      role: RESEARCHER_ROLES.REVIEWER,
      isActive: true,
    },
  });

  if (!reviewer) {
    throw new AppError("No active reviewer found with that email.", 404);
  }

  if (isReassignment && String(research.assignedReviewerId) === String(reviewer.id)) {
    throw new AppError("This reviewer is already assigned to this research.", 400);
  }

  const windowDays = REVIEW_WINDOW_DAYS[research.stage] || 14;

  research.assignedReviewerId = reviewer.id;
  research.assignedAt = new Date();
  research.reviewDeadline = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);
  research.priority =
    research.resubmissionCount >= 2 ? "high"
      : research.resubmissionCount >= 1 ? "medium"
      : "normal";
  research.status = RESEARCH_STATUSES.UNDER_REVIEW;
  await research.save();

  const researcherDoc = await Researcher.findByPk(research.researcherId, {
    attributes: ["name", "firstName"],
  });

  await email.sendNewProposalToReview({
    email: reviewer.email,
    name: reviewer.firstName || reviewer.name,
    proposalTitle: research.title,
    researcherName: researcherDoc?.name || "Researcher",
    stage: research.stage,
    discipline: research.discipline,
    reviewLink: `${process.env.FRONTEND_URL}/hmis`,
  });

  return { research, reviewer, isReassignment };
};

const publishResearch = async (researchId) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  if (research.isPublished) {
    throw new AppError("This research is already published.", 400);
  }
  if (research.stage !== RESEARCH_STAGES.FINAL_PAPER) {
    throw new AppError(
      `Only final papers can be published. Current stage: '${research.stage}'.`,
      400,
    );
  }
  if (research.status !== RESEARCH_STATUSES.APPROVED) {
    throw new AppError(
      "Research must be approved by both the assigned reviewer and the Research Committee before publishing.",
      400,
    );
  }
  if (!research.committeeReviewedById) {
    throw new AppError("Research Committee sign-off is required before publishing.", 400);
  }

  research.isPublished = true;
  research.publishedAt = new Date();
  await research.save();


  const certificateService = require("./certificateService");
  await certificateService.issueCompletionCertificate(
    research.id,
    research.committeeReviewedById,
  );

  const researcherDoc = await Researcher.findByPk(research.researcherId, {
    attributes: ["email", "name", "firstName"],
  });

  if (researcherDoc) {
    await email.sendProposalApproved({
      email: researcherDoc.email,
      name: researcherDoc.firstName || researcherDoc.name,
      proposalTitle: research.title,
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerComment:
        "Congratulations! Your paper has been published on the Nyahururu Research Portal.",
    });
  }

  return research;
};


const updateDownloadPrice = async (researchId, downloadPrice) => {
  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  research.downloadPrice = downloadPrice;
  await research.save();

  return research;
};


const reactivateResearch = async (researchId, adminId, reason) => {
  if (!reason || !reason.trim()) {
    throw new AppError("A reason is required to reactivate a suspended study.", 400);
  }

  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: ["id", "email", "name", "firstName"] },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  if (research.status !== RESEARCH_STATUSES.SUSPENDED) {
    throw new AppError(
      `Only suspended studies can be reactivated. Current status: '${research.status}'.`,
      400,
    );
  }

  research.status = research.assignedReviewerId
    ? RESEARCH_STATUSES.UNDER_REVIEW
    : RESEARCH_STATUSES.PENDING;
  research.reactivatedAt = new Date();
  research.reactivatedById = adminId;
  research.reactivationReason = reason.trim();
  await research.save();

  if (research.researcher?.email) {
    await email.sendStudyReactivated({
      email: research.researcher.email,
      name: research.researcher.name || research.researcher.firstName,
      proposalTitle: research.title,
      reason: research.reactivationReason,
    });
  }

  if (research.assignedReviewerId) {
    const reviewer = await Researcher.findByPk(research.assignedReviewerId, {
      attributes: ["email", "name", "firstName"],
    });
    if (reviewer) {
      await email.sendNewProposalToReview({
        email: reviewer.email,
        name: reviewer.firstName || reviewer.name,
        proposalTitle: research.title,
        researcherName: research.researcher?.name || "Researcher",
        stage: research.stage,
        discipline: research.discipline,
        reviewLink: `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};

const deleteResearch = async (researchId, deletedBy) => {

  const research = await Research.findByPk(researchId);
  if (!research) throw new AppError("Research not found.", 404);
  await research.softDelete(deletedBy);
};

const getResearcherRevenue = async (researcher, researchId) => {
  const research = await Research.findOne({
    where: { id: researchId, researcherId: researcher.id },
  });
  if (!research) {
    throw new AppError("Research not found or does not belong to you.", 404);
  }

  const revenueData = await Payment.getRevenueForResearch(researchId);

  return {
    research: {
      id: research.id,
      title: research.title,
      downloads: research.downloads,
      downloadPrice: research.downloadPrice,
      isPublished: research.isPublished,
    },
    revenue: revenueData,
  };
};

const getDashboardStats = async () => {
  const [
    totalResearch,
    pendingProposals,
    approvedProposals,
    pendingProgress,
    approvedProgress,
    publishedPapers,
    pendingFinalPapers,
    pendingCommitteeReview,
    unassigned,
    totalResearchers,
    totalReviewers,
    totalCommitteeMembers,
  ] = await Promise.all([
    Research.count(),
    Research.count({ where: { stage: RESEARCH_STAGES.PROPOSAL, status: RESEARCH_STATUSES.PENDING } }),
    Research.count({ where: { stage: RESEARCH_STAGES.PROPOSAL, status: RESEARCH_STATUSES.APPROVED } }),
    Research.count({ where: { stage: RESEARCH_STAGES.PROGRESS, status: RESEARCH_STATUSES.PENDING } }),
    Research.count({ where: { stage: RESEARCH_STAGES.PROGRESS, status: RESEARCH_STATUSES.APPROVED } }),
    Research.count({ where: { isPublished: true } }),
    Research.count({ where: { stage: RESEARCH_STAGES.FINAL_PAPER, status: RESEARCH_STATUSES.PENDING } }),
    Research.count({ where: { status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW } }),
    Research.count({
      where: {
        assignedReviewerId: null,
        status: RESEARCH_STATUSES.PENDING,
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
      pendingProposals,
      approvedProposals,
      pendingProgress,
      approvedProgress,
      pendingFinalPapers,
      pendingCommitteeReview,
      published: publishedPapers,
      unassigned,
    },
    users: {
      totalResearchers,
      totalReviewers,
      totalCommitteeMembers,
    },
  };
};

module.exports = {
  getPublishedResearch,
  getPublishedPaperById,
  getResearchById,
  getMyResearch,
  initiateProposalPayment,
  confirmProposalSubmission,
  submitProgress,
  submitFinalPaper,
  resubmit,
  getAssignedResearch,
  submitReview,
  getCommitteeQueue,
  getAllResearchCommittee,
  submitCommitteeReview,
  getCommitteeVotes,
  getFinalApprovalQueue,
  getFinalApprovalStats,
  getApprovalFeed,
  postApprovalComment,
  getAllResearchAdmin,
  assignReviewer,
  publishResearch,
  updateDownloadPrice,
  reactivateResearch,
  deleteResearch,
  getResearcherRevenue,
  getDashboardStats,
  getRecordTimeline,
};

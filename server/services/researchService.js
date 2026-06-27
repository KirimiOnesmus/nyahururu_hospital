const Research = require("../models/researchModel");
const Researcher = require("../models/ResearcherModel");
const Payment = require("../models/PaymentModel");
const Review = require("../models/ReviewModel");
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
  [RESEARCH_STAGES.PROPOSAL]: [
    "originality",
    "relevance",
    "feasibility",
    "ethics",
    "expectedImpact",
  ],
  [RESEARCH_STAGES.PROGRESS]: [
    "methodologyCompliance",
    "dataQuality",
    "statisticalValidity",
    "ethicalCompliance",
    "researchProgress",
  ],
  [RESEARCH_STAGES.FINAL_PAPER]: [
    "scientificIntegrity",
    "publicationReadiness",
    "documentCompleteness",
    "institutionalCompliance",
  ],
};

// Maps a review stage to the per-stage snapshot field on Research where that stage's reviewer verdict is preserved independently of other stages.
const STAGE_SNAPSHOT_FIELD = {
  [RESEARCH_STAGES.PROPOSAL]: "proposalReview",
  [RESEARCH_STAGES.PROGRESS]: "progressReview",
  [RESEARCH_STAGES.FINAL_PAPER]: "finalPaperReview",
};

const validateCriteria = (stage, criteria = {}) => {
  const allowedKeys = CRITERIA_KEYS_BY_STAGE[stage];
  if (!allowedKeys) {
    throw new AppError(`No criteria definition for stage '${stage}'.`, 400);
  }

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


const NOTE_ROUND = 0;
const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const STAGE_TONE = {
  [RESEARCH_STAGES.PROPOSAL]: "proposal",
  [RESEARCH_STAGES.PROGRESS]: "progress",
  [RESEARCH_STAGES.FINAL_PAPER]: "final_paper",
};
 
const STAGE_LABEL = {
  [RESEARCH_STAGES.PROPOSAL]: "Proposal Review",
  [RESEARCH_STAGES.PROGRESS]: "Progress Review",
  [RESEARCH_STAGES.FINAL_PAPER]: "Final Paper Review",
};

// Tally committee votes by decision. Returns counts plus a sorted list so the caller can compare the leader against the runner-up.

const tallyCommitteeVotes = (votes) => {
  const counts = {};
  votes.forEach((v) => {
    counts[v.decision] = (counts[v.decision] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { counts, sorted };
};



const getPublishedResearch = async (query) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    discipline,
    sort = "newest",
    priceMin,
    priceMax,
  } = query;

  const safeLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const safePage = Math.max(1, Number(page));

  const filter = { isPublished: true };
  if (discipline) filter.discipline = { $regex: discipline, $options: "i" };
  if (priceMin !== undefined) filter.downloadPrice = { $gte: Number(priceMin) };
  if (priceMax !== undefined) {
    filter.downloadPrice = {
      ...(filter.downloadPrice || {}),
      $lte: Number(priceMax),
    };
  }
  if (search) filter.$text = { $search: search };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    downloads: { downloads: -1 },
    price: { downloadPrice: 1 },
  };

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline finalAbstract abstract researcher keywords downloads views downloadPrice publishedAt researchId",
      )
      .populate("researcher", "name institution")
      .sort(sortMap[sort] || sortMap.newest)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

// PUBLIC

const getPublishedPaperById = async (id) => {
  const paper = await Research.findOne({ _id: id, isPublished: true })
    .select("-proposalFile -proposalFileKey -finalPaperFile -finalPaperFileKey")
    .populate("researcher", "name institution bio socialLinks")
    .lean();

  if (!paper) throw new AppError("Research paper not found.", 404);

  await Research.findByIdAndUpdate(id, { $inc: { views: 1 } });

  return paper;
};

const getResearchById = async (id, caller = {}) => {
  const paper = await Research.findById(id)
    .populate("researcher", "name institution bio socialLinks")
    .populate("assignedReviewer", "name firstName lastName email institution")
    .populate("reviewedBy", "name") 
    .populate("committeeReviewedBy", "name")
    .populate("proposalReview.reviewedBy", "name firstName lastName")
    .populate("progressReview.reviewedBy", "name firstName lastName")
    .populate("finalPaperReview.reviewedBy", "name firstName lastName")
    .populate("researcher", "name institution bio socialLinks email");

  if (!paper) throw new AppError("Research not found.", 404);

  const { researcher, user } = caller;

  const isStaff = user && ["admin", "superadmin"].includes(user.role);
  const isReviewer = researcher?.role === RESEARCHER_ROLES.REVIEWER;
  const isCommittee =
    researcher?.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE ||
    researcher?.isCommittee;
  const isOwner =
    researcher && paper.researcher._id.toString() === researcher._id.toString();

  if (!isStaff && !isReviewer && !isCommittee && !isOwner) {
    throw new AppError("You do not have access to this research.", 403);
  }

  return paper;
};

// RESEARCHER

const getMyResearch = async (researcherId, { page, limit }) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const [papers, total] = await Promise.all([
    Research.find({ researcher: researcherId })
      .select(
        "title discipline stage status isPublished downloads downloadPrice reviewComment committeeComment createdAt updatedAt researchId submissionPayment",
      )
      .populate({
        path: "submissionPayment",
        select:
          "status amount mpesaReceiptNumber checkoutRequestId paidAt createdAt",
      })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments({ researcher: researcherId }),
  ]);

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

  const stkResult = await mpesa.initiateSTKPush({
    phone,
    amount,
    accountRef,
    description,
  });

  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription ||
        "Payment initiation failed. Please try again.",
      502,
    );
  }

  const payment = await Payment.create({
    researcher: researcherId,
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
    paymentId: payment._id,
    amount,
  };
};

const confirmProposalSubmission = async (researcher, body, file) => {
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
  } = body;

  const similar = await Research.findSimilarTitles(title);
  if (similar.length) {
    throw new AppError(
      `A similar research title already exists: "${similar[0].title}". Please use a more distinct title or contact admin if this is unrelated.`,
      409,
    );
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment record not found.", 404);

  if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
    throw new AppError(
      `Payment is ${payment.status}. Please complete the M-Pesa payment before submitting.`,
      400,
    );
  }

  if (!payment.researcher) {
    payment.researcher = researcher._id;
    await payment.save();
  }

  const proposalFile = file ? `/uploads/proposal/${file.filename}` : null;
  const proposalFileKey = file?.key || null;

  const newResearch = await Research.create({
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
    proposalFile,
    proposalFileKey,
    researcher: researcher._id,
    stage: RESEARCH_STAGES.PROPOSAL,
    status: RESEARCH_STATUSES.PENDING,
    submissionPayment: payment._id,
    isPublished: false,
    downloadPrice: FEES.DEFAULT_DOWNLOAD,
  });

  payment.research = newResearch._id;
  await payment.save();

  await email.sendProposalSubmitted({
    email: researcher.email,
    name: researcher.name || researcher.firstName,
    proposalTitle: newResearch.title,
    mpesaReceipt: payment.mpesaReceiptNumber,
    amount: payment.amount,
  });

  return newResearch;
};

const submitProgress = async (researcher, researchId, body, files) => {
  const research = await Research.findOne({
    _id: researchId,
    researcher: researcher._id,
  });
  if (!research)
    throw new AppError("Research not found or does not belong to you.", 404);

  if (!research.canSubmitProgress) {
    throw new AppError(
      `Cannot submit progress — requires stage 'proposal' with status 'approved'. Current: stage='${research.stage}', status='${research.status}'.`,
      400,
    );
  }

  const isDraft = body.isDraft === true || body.isDraft === "true";

  const {
    methodology,
    studyDesign,
    samplingMethod,
    sampleSizeAchieved,
    sampleSizeTarget,
    dataCollectionProgress,
    statisticalMethods,
    analysisTools,
    preliminaryFindings,
    deviationsFromProtocol,
    ethicalIncidents,
    participantWithdrawals,
  } = body;

  if (!isDraft) {
    const existingFiles = research.progressFiles || [];
    const hasFile = (label) =>
      existingFiles.some((f) => f.label === label) ||
      files?.some((f) => f.fieldname === label);

    const REQUIRED_FILES = [
      "draftManuscript",
      "datasets",
      "statisticalOutputs",
    ];
    const missing = REQUIRED_FILES.filter((f) => !hasFile(f));
    if (missing.length) {
      throw new AppError(
        `Missing required file(s) for submission: ${missing.join(", ")}.`,
        400,
      );
    }
  }

  research.progressData = {
    ...(research.progressData || {}),
    methodology,
    studyDesign,
    samplingMethod,
    sampleSizeAchieved:
      sampleSizeAchieved !== undefined
        ? Number(sampleSizeAchieved)
        : research.progressData?.sampleSizeAchieved,
    sampleSizeTarget:
      sampleSizeTarget !== undefined
        ? Number(sampleSizeTarget)
        : research.progressData?.sampleSizeTarget,
    dataCollectionProgress,
    statisticalMethods,
    analysisTools,
    preliminaryFindings,
    deviationsFromProtocol,
    ethicalIncidents,
    participantWithdrawals,
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
  if (research.assignedReviewer) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() +
        (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
    );
  } else {
    research.status = RESEARCH_STATUSES.PENDING;
  }
  await research.save(); // reviewDeadline now persisted in the same save

  await email.sendProgressSubmitted({
    email: researcher.email,
    name: researcher.name || researcher.firstName,
    proposalTitle: research.title,
  });

  if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(
      research.assignedReviewer,
    ).select("email name firstName");
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

const submitFinalPaper = async (
  researcher,
  researchId,
  body,
  file,
  supportingFiles = {},
) => {
  const {
    finalAbstract,
    keywords,
    conflictOfInterestDeclared,
    aiUsageDeclared,
    aiUsageDetails,
    plagiarismReportLink,
    fundingSource,
    noteToCommittee,
  } = body;

  const research = await Research.findOne({
    _id: researchId,
    researcher: researcher._id,
  });
  if (!research)
    throw new AppError("Research not found or does not belong to you.", 404);

  if (research.stage !== RESEARCH_STAGES.PROGRESS) {
    throw new AppError(
      `Cannot submit final paper — current stage is '${research.stage}'. Progress stage must be approved first.`,
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
    : (keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
  research.finalPaperFile = `/uploads/final_paper/${file.filename}`;
  research.finalPaperFileKey = file.key || null;

  const fileMeta = (f) =>
    f
      ? { url: `/uploads/final_paper/${f.filename}`, key: f.key || null }
      : undefined;

  research.finalPaperSubmission = {
    ...(research.finalPaperSubmission || {}),
    supportingFiles: {
      ...(research.finalPaperSubmission?.supportingFiles || {}),
      ...(fileMeta(supportingFiles.finalDataset) && {
        finalDataset: fileMeta(supportingFiles.finalDataset),
      }),
      ...(fileMeta(supportingFiles.dataDictionary) && {
        dataDictionary: fileMeta(supportingFiles.dataDictionary),
      }),
      ...(fileMeta(supportingFiles.statisticalScripts) && {
        statisticalScripts: fileMeta(supportingFiles.statisticalScripts),
      }),
      ...(fileMeta(supportingFiles.ethicsApproval) && {
        ethicsApproval: fileMeta(supportingFiles.ethicsApproval),
      }),
      ...(fileMeta(supportingFiles.fundingDisclosure) && {
        fundingDisclosure: fileMeta(supportingFiles.fundingDisclosure),
      }),
    },
    declarations: {
      conflictOfInterestDeclared:
        conflictOfInterestDeclared === true ||
        conflictOfInterestDeclared === "true",
      aiUsageDeclared: aiUsageDeclared === true || aiUsageDeclared === "true",
      aiUsageDetails: aiUsageDetails || "",
    },
    plagiarismReportLink: plagiarismReportLink || "",
    fundingSource: fundingSource || "",
    noteToCommittee: noteToCommittee || "",
  };

  research.stage = RESEARCH_STAGES.FINAL_PAPER;
  if (research.assignedReviewer) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() +
        (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
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

  if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(
      research.assignedReviewer,
    ).select("email name firstName");
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

// RESEARCHER — Resubmit after revision (free)

const resubmit = async (researcher, researchId, body, file) => {
  const research = await Research.findOne({
    _id: researchId,
    researcher: researcher._id,
  });
  if (!research) throw new AppError("Research not found.", 404);

  const RESUBMITTABLE = [
    RESEARCH_STATUSES.REVISION_REQUESTED,
    RESEARCH_STATUSES.REJECTED,
  ];
  if (!RESUBMITTABLE.includes(research.status)) {
    throw new AppError(
      `Resubmission is only allowed when status is 'revision_requested' or 'rejected'. Current: '${research.status}'.`,
      400,
    );
  }

  const ALLOWED = [
    "abstract",
    "background",
    "objectives",
    "methodology",
    "expectedOutcome",
    "timeline",
    "finalAbstract",
    "keywords",
  ];
  ALLOWED.forEach((f) => {
    if (body[f] !== undefined) research[f] = body[f];
  });

  if (file) {
    const fileField =
      research.stage === RESEARCH_STAGES.FINAL_PAPER
        ? "finalPaperFile"
        : "proposalFile";
    const fileKeyField =
      research.stage === RESEARCH_STAGES.FINAL_PAPER
        ? "finalPaperFileKey"
        : "proposalFileKey";
    research[fileField] = `/uploads/proposal/${file.filename}`;
    research[fileKeyField] = file.key || null;
  }

  let routedToCommittee = false;

  if (research.stage === RESEARCH_STAGES.FINAL_PAPER) {
    // NOTE: with quorum voting, the "last review was committee" check needs
    // to look at whether a committee round has actually happened for this
    // research, not just the latest Review doc — isLatest is no longer set
    // on committee votes (see submitCommitteeReview). committeeReviewedAt
    // being set is the reliable signal that at least one committee round
    // has concluded for this submission.
    if (research.committeeReviewedAt) {
      research.status = RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW;
      routedToCommittee = true;
    } else if (research.assignedReviewer) {
      research.status = RESEARCH_STATUSES.UNDER_REVIEW;
      research.reviewDeadline = new Date(
        Date.now() +
          (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
      );
    } else {
      research.status = RESEARCH_STATUSES.PENDING;
    }
  } else if (research.assignedReviewer) {
    research.status = RESEARCH_STATUSES.UNDER_REVIEW;
    research.reviewDeadline = new Date(
      Date.now() +
        (REVIEW_WINDOW_DAYS[research.stage] || 14) * 24 * 60 * 60 * 1000,
    );
  } else {
    research.status = RESEARCH_STATUSES.PENDING;
  }

  research.resubmissionCount = (research.resubmissionCount || 0) + 1;
  await research.save();

  if (routedToCommittee) {
    const committee = await Researcher.findCommitteeMembers().select(
      "email name firstName",
    );
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
  } else if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(
      research.assignedReviewer,
    ).select("email name firstName");
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

// REVIEWER — Get assigned submissions

const getAssignedResearch = async (
  reviewerId,
  { page, limit, stage, includeCompleted },
) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const filter = {
    assignedReviewer: reviewerId,
  };

 if (includeCompleted === "all") {
  
  } else if (includeCompleted === "true" || includeCompleted === true) {
    filter.status = {
      $in: [
        RESEARCH_STATUSES.APPROVED,
        RESEARCH_STATUSES.REJECTED,
        RESEARCH_STATUSES.SUSPENDED,
        RESEARCH_STATUSES.REVISION_REQUESTED,
        RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
      ],
    };
  } else {
    filter.status = {
      $in: [
        RESEARCH_STATUSES.UNDER_REVIEW,
        RESEARCH_STATUSES.PENDING,
        RESEARCH_STATUSES.REVISION_REQUESTED,
      ],
    };
  }

  
  if (stage) filter.stage = stage;

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline stage status resubmissionCount assignedAt createdAt " +
          "reviewDeadline priority aggregateScore reviewDecision reviewedAt researchId",
      )
      .populate("researcher", "name institution")
      .sort({ assignedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

// REVIEWER — Submit review (proposal / progress / final_paper — first pass only)

const submitReview = async (
  reviewer,
  { researchId, stage, decision, comment, criteria },
) => {
  const research = await Research.findById(researchId).populate(
    "researcher",
    "email name firstName",
  );
  if (!research) throw new AppError("Research not found.", 404);

  if (research.assignedReviewer?.toString() !== reviewer._id.toString()) {
    throw new AppError(
      "You are not the assigned reviewer for this research.",
      403,
    );
  }
  if (research.status !== RESEARCH_STATUSES.UNDER_REVIEW) {
    throw new AppError(
      `Cannot review — current status is '${research.status}'.`,
      400,
    );
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
      REVIEW_DECISIONS.APPROVED,
      REVIEW_DECISIONS.REVISION,
      REVIEW_DECISIONS.REJECTED,
    ],
    [RESEARCH_STAGES.PROGRESS]: [
      REVIEW_DECISIONS.APPROVED,
      REVIEW_DECISIONS.REVISION,
      REVIEW_DECISIONS.SUSPENDED,
    ],
    [RESEARCH_STAGES.FINAL_PAPER]: [
      REVIEW_DECISIONS.APPROVED,
      REVIEW_DECISIONS.REVISION,
      REVIEW_DECISIONS.REJECTED,
    ],
  };
  if (!ALLOWED_DECISIONS_BY_STAGE[stage]?.includes(decision)) {
    throw new AppError(
      `Decision '${decision}' is not valid for stage '${stage}'.`,
      400,
    );
  }

  const validatedCriteria = validateCriteria(stage, criteria);
  const criteriaValues = Object.values(validatedCriteria);
  const aggregateScore = criteriaValues.length
    ? Number(
        (
          criteriaValues.reduce((s, v) => s + v, 0) / criteriaValues.length
        ).toFixed(1),
      )
    : null;

  const latestReview = await Review.findOne({
    research: researchId,
    stage,
    isLatest: true,
  });
  const round = latestReview ? latestReview.round + 1 : 1;

  if (latestReview)
    await Review.updateMany(
      { research: researchId, stage, isLatest: true },
      { isLatest: false },
    );

  const review = await Review.create({
    research: researchId,
    reviewer: reviewer._id,
    reviewerRole: "reviewer",
    stage,
    round,
    decision,
    comment,
    criteria: validatedCriteria,
    isLatest: true,
    submittedAt: new Date(),
  });

  // ── Final-paper approvals do NOT go straight to APPROVED — they go to the committee quorum queue instead.
  const isFinalPaperApproval =
    stage === RESEARCH_STAGES.FINAL_PAPER &&
    decision === REVIEW_DECISIONS.APPROVED;

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
  research.reviewedBy = reviewer._id;
  research.reviewedAt = new Date();
  research.aggregateScore = aggregateScore;
  research.reviewDecision = REVIEW_DECISION_DISPLAY[decision] || decision;

  // Stage-separated snapshot — preserved independently of whatever happens at later stages, so the committee can later see the ORIGINAL proposal
  // reviewer's verdict and comment even after progress/final-paper reviews have overwritten the generic fields above.

  const snapshotField = STAGE_SNAPSHOT_FIELD[stage];
  if (snapshotField) {
    research[snapshotField] = {
      decision,
      comment,
      criteria: validatedCriteria,
      aggregateScore,
      reviewedBy: reviewer._id,
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
    await certificateService.issueClearanceCertificate(
      research._id,
      reviewer._id,
    );
  }

  const stats = await Review.getReviewerStats(reviewer._id);
  await Researcher.findByIdAndUpdate(reviewer._id, {
    $inc: { reviewCount: 1 },
    $set: { acceptanceRate: stats.acceptanceRate },
  });

  const researcherDoc = research.researcher;
  const emailData = {
    email: researcherDoc.email,
    name: researcherDoc.name || researcherDoc.firstName,
    proposalTitle: research.title,
    stage,
    reviewerComment: comment,
  };

  if (isFinalPaperApproval) {
    // Notify researcher it's moved on, and notify every committee member.
    await email.sendFinalPaperForwardedToCommittee?.(emailData);

    const committee = await Researcher.findCommitteeMembers().select(
      "email name firstName",
    );
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

// RESEARCH COMMITTEE

const getCommitteeQueue = async ({ page, limit }) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const filter = {
    stage: RESEARCH_STAGES.FINAL_PAPER,
    status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  };

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline stage status resubmissionCount reviewComment reviewedAt createdAt committeeRound",
      )
      .populate("researcher", "name institution")
      .populate("reviewedBy", "name")
      .sort({ reviewedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

const getAllResearchCommittee = async ({
  stage,
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

  const filter = {};
  if (stage) filter.stage = stage;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { abstract: { $regex: search, $options: "i" } },
    ];
  }

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline stage status isPublished researcher " +
          "reviewedAt committeeReviewedAt aggregateScore researchId createdAt updatedAt",
      )
      .populate("researcher", "name institution")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

// Committee approval — a quorum vote (min 3, max 5 members) rather than a single member's decision.

const submitCommitteeReview = async (
  committeeMember,
  { researchId, decision, comment, criteria },
) => {
  const research = await Research.findById(researchId).populate(
    "researcher",
    "email name firstName",
  );
  if (!research) throw new AppError("Research not found.", 404);

  if (research.stage !== RESEARCH_STAGES.FINAL_PAPER) {
    throw new AppError(
      "Committee review only applies to final-paper submissions.",
      400,
    );
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

  // Friendly pre-check. The unique partial index on Review({research, stage, round, reviewer}, partial on reviewerRole: "committee") is the actual race-condition guard.

  const alreadyVoted = await Review.findOne({
    research: researchId,
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerRole: "committee",
    round: currentRound,
    reviewer: committeeMember._id,
  });
  if (alreadyVoted) {
    throw new AppError(
      "You have already cast your committee vote for this submission's current round.",
      409,
    );
  }

  const existingVotes = await Review.find({
    research: researchId,
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerRole: "committee",
    round: currentRound,
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
      research: researchId,
      reviewer: committeeMember._id,
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
    if (err.code === 11000) {
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
  research.committeeReviewedBy = committeeMember._id;
  research.committeeReviewedAt = new Date();
  research.committeeRound = currentRound + 1;
  research.reviewDecision =
    REVIEW_DECISION_DISPLAY[leaderDecision] || leaderDecision;

  const scoredVotes = allVotes.filter(
    (v) => Object.keys(v.criteria || {}).length,
  );
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

//Returns every committee member's individual vote (decision + comment) for a given research record's most recently closed voting round (or a specific round, if provided).

const getCommitteeVotes = async (researchId, round) => {
  const research = await Research.findById(researchId).select("committeeRound");
  if (!research) throw new AppError("Research not found.", 404);

  const targetRound = round ?? Math.max(1, (research.committeeRound || 1) - 1);

  const votes = await Review.find({
    research: researchId,
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerRole: "committee",
    round: targetRound,
  })
    .populate("reviewer", "name firstName lastName email")
    .sort({ submittedAt: 1 })
    .lean();

  return votes.map((v) => ({
    id: v._id,
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



const deriveOutcome = (votes) => {
  if (!votes.length) return "pending_clarification";

  const { counts, sorted } = tallyCommitteeVotes(votes);
  const [leaderDecision] = sorted[0];

  if (leaderDecision !== REVIEW_DECISIONS.APPROVED) {
    return "pending_clarification";
  }

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

const getFinalApprovalQueue = async ({ page, limit } = {}) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const filter = {
    stage: RESEARCH_STAGES.FINAL_PAPER,
    status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  };

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline stage status resubmissionCount reviewedAt " +
          "createdAt committeeRound researchId assignedReviewer aggregateScore",
      )
      .populate("researcher", "name institution")
      .populate("assignedReviewer", "name email institution")
      .sort({ reviewedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  if (!papers.length) {
    return {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      records: [],
    };
  }
  // Pull every committee vote cast so far for each record's CURRENT round

  const roundByResearch = {};
  papers.forEach((p) => {
    roundByResearch[p._id.toString()] = p.committeeRound || 1;
  });

  const allVotes = await Review.find({
    research: { $in: papers.map((p) => p._id) },
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerRole: "committee",
    round: { $gte: 1 },
  }).lean();

  const votesByResearch = {};
  allVotes.forEach((v) => {
    const key = v.research.toString();
    const round = roundByResearch[key] ?? 1;
    if (v.round !== round) return; // only this record's current round counts
    (votesByResearch[key] = votesByResearch[key] || []).push(v);
  });

  const records = papers.map((p) => {
    const votes = votesByResearch[p._id.toString()] || [];
    const principalReviewer = p.assignedReviewer?.name || "Unassigned";

    return {
      _id: p._id,
      projectId: p.researchId || `#${p._id.toString().slice(-6).toUpperCase()}`,
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
      Research.countDocuments(queueFilter),
      Research.countDocuments({
        committeeReviewedAt: { $gte: startOfMonth },
        status: RESEARCH_STATUSES.APPROVED,
      }),
      Research.find({
        committeeReviewedAt: { $gte: startOfMonth },
      })
        .select("reviewedAt committeeReviewedAt")
        .lean(),
      Research.find(queueFilter).select("_id committeeRound").lean(),
    ]);

  let avgReviewTimeDays = null;
  if (finalizedThisMonth.length) {
    const totalDays = finalizedThisMonth.reduce((sum, r) => {
      if (!r.reviewedAt || !r.committeeReviewedAt) return sum;
      const days =
        (r.committeeReviewedAt - r.reviewedAt) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgReviewTimeDays = Number(
      (totalDays / finalizedThisMonth.length).toFixed(1),
    );
  }

  let pendingClarifications = 0;
  if (queueRecords.length) {
    const allVotes = await Review.find({
      research: { $in: queueRecords.map((r) => r._id) },
      stage: RESEARCH_STAGES.FINAL_PAPER,
      reviewerRole: "committee",
      round: { $gte: 1 }, // excludes freestanding notes
    }).lean();

    const votesByResearch = {};
    allVotes.forEach((v) => {
      (votesByResearch[v.research.toString()] =
        votesByResearch[v.research.toString()] || []).push(v);
    });

    pendingClarifications = queueRecords.filter((r) => {
      const round = r.committeeRound || 1;
      const votes = (votesByResearch[r._id.toString()] || []).filter(
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
  const votes = await Review.find({
    stage: RESEARCH_STAGES.FINAL_PAPER,
    reviewerRole: "committee",
    comment: { $exists: true, $ne: "" },
  })
    .populate("reviewer", "name")
    .populate("research", "title researchId")
    .sort({ submittedAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .lean();


  const toneOf = (decision) => {
    if (decision === REVIEW_DECISIONS.APPROVED) return "success";
    if (decision === REVIEW_DECISIONS.REJECTED) return "warning";
    return "neutral"; // covers REVISION, SUSPENDED, and NOTED
  };

  return votes.map((v) => {
    const name = v.reviewer?.name || "Committee Member";

    return {
      _id: v._id,
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

const postApprovalComment = async (
  committeeMember,
  { researchId, message },
) => {
  if (!researchId) {
    throw new AppError(
      "A research record must be selected for this note.",
      400,
    );
  }
  if (!message || !message.trim()) {
    throw new AppError("Comment message is required.", 400);
  }

  const research = await Research.findById(researchId).select(
    "title researchId stage",
  );
  if (!research) throw new AppError("Research not found.", 404);

  const note = await Review.create({
    research: research._id,
    reviewer: committeeMember._id,
    reviewerRole: "committee",
    stage: research.stage,
    round: NOTE_ROUND,
    decision: REVIEW_DECISIONS.NOTED,
    comment: message.trim(),
    isLatest: false, // meaningless for committee entries, same as real votes
    submittedAt: new Date(),
  });

  return {
    _id: note._id,
    author: committeeMember.name || "Committee Member",
    initials: (committeeMember.name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(""),
    message: `[${research.researchId || research.title}] ${note.comment}`,
    tone: "neutral",
    time: "Just now",
  };
};


const getRecordTimeline = async (researchId) => {
  const researchDoc = await Research.findById(researchId).select("title researchId");
  if (!researchDoc) throw new AppError("Research not found.", 404);
 
  const reviews = await Review.getAllForResearch(researchId);
 
  return reviews.map((r) => {
    const isCommittee = r.reviewerRole === "committee";
    const stageTone = isCommittee ? "committee" : STAGE_TONE[r.stage] || "proposal";
    const stageLabel = isCommittee
      ? (r.round === 0 ? "Committee Note" : `Committee Vote (Round ${r.round})`)
      : STAGE_LABEL[r.stage] || r.stage;
 
    return {
      _id: r._id,
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

// ADMIN — Get all research

const getAllResearchAdmin = async ({ stage, status, search, page, limit }) => {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Number(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const filter = {};
  if (stage) filter.stage = stage;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { abstract: { $regex: search, $options: "i" } },
    ];
  }

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select(
        "title discipline stage status isPublished researcher assignedReviewer " +
          "reviewComment committeeComment committeeReviewedBy downloadPrice " +
          "downloads researchId createdAt updatedAt",
      )
      .populate("researcher", "name institution email")
      .populate("assignedReviewer", "name email institution")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

// ADMIN — Assign reviewer

const assignReviewer = async (researchId, reviewerEmail) => {
  const research = await Research.findById(researchId);
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

  const isReassignment = Boolean(research.assignedReviewer);

  const reviewer = await Researcher.findOne({
    email: reviewerEmail.toLowerCase().trim(),
    role: RESEARCHER_ROLES.REVIEWER,
    isActive: true,
  });

  if (!reviewer) {
    throw new AppError("No active reviewer found with that email.", 404);
  }

  if (
    isReassignment &&
    research.assignedReviewer.toString() === reviewer._id.toString()
  ) {
    throw new AppError(
      "This reviewer is already assigned to this research.",
      400,
    );
  }

  const windowDays = REVIEW_WINDOW_DAYS[research.stage] || 14;

  research.assignedReviewer = reviewer._id;
  research.assignedAt = new Date();
  research.reviewDeadline = new Date(
    Date.now() + windowDays * 24 * 60 * 60 * 1000,
  );
  research.priority =
    research.resubmissionCount >= 2
      ? "high"
      : research.resubmissionCount >= 1
        ? "medium"
        : "normal";
  research.status = RESEARCH_STATUSES.UNDER_REVIEW;
  await research.save();

  const researcherDoc = await Researcher.findById(research.researcher).select(
    "name firstName",
  );

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

// ADMIN — Publish research

const publishResearch = async (researchId) => {
  const research = await Research.findById(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  if (research.isPublished)
    throw new AppError("This research is already published.", 400);
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
  if (!research.committeeReviewedBy) {
    throw new AppError(
      "Research Committee sign-off is required before publishing.",
      400,
    );
  }

  research.isPublished = true;
  research.publishedAt = new Date();
  await research.save();

  const certificateService = require("./certificateService");
  await certificateService.issueCompletionCertificate(
    research._id,
    research.committeeReviewedBy,
  );

  const researcherDoc = await Researcher.findById(research.researcher).select(
    "email name firstName",
  );

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
  const research = await Research.findByIdAndUpdate(
    researchId,
    { downloadPrice },
    { new: true, runValidators: true },
  );
  if (!research) throw new AppError("Research not found.", 404);
  return research;
};

const reactivateResearch = async (researchId, adminId, reason) => {
  if (!reason || !reason.trim()) {
    throw new AppError(
      "A reason is required to reactivate a suspended study.",
      400,
    );
  }

  const research = await Research.findById(researchId).populate(
    "researcher",
    "email name firstName",
  );
  if (!research) throw new AppError("Research not found.", 404);

  if (research.status !== RESEARCH_STATUSES.SUSPENDED) {
    throw new AppError(
      `Only suspended studies can be reactivated. Current status: '${research.status}'.`,
      400,
    );
  }

  research.status = research.assignedReviewer
    ? RESEARCH_STATUSES.UNDER_REVIEW
    : RESEARCH_STATUSES.PENDING;
  research.reactivatedAt = new Date();
  research.reactivatedBy = adminId;
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

  if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(
      research.assignedReviewer,
    ).select("email name firstName");
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
  const research = await Research.findById(researchId).setOptions({
    includeDeleted: false,
  });
  if (!research) throw new AppError("Research not found.", 404);
  await research.softDelete(deletedBy);
};

const getResearcherRevenue = async (researcher, researchId) => {
  const research = await Research.findOne({
    _id: researchId,
    researcher: researcher._id,
  });
  if (!research)
    throw new AppError("Research not found or does not belong to you.", 404);

  const revenueData = await Payment.getRevenueForResearch(researchId);

  return {
    research: {
      id: research._id,
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
    Research.countDocuments({}),
    Research.countDocuments({
      stage: RESEARCH_STAGES.PROPOSAL,
      status: RESEARCH_STATUSES.PENDING,
    }),
    Research.countDocuments({
      stage: RESEARCH_STAGES.PROPOSAL,
      status: RESEARCH_STATUSES.APPROVED,
    }),
    Research.countDocuments({
      stage: RESEARCH_STAGES.PROGRESS,
      status: RESEARCH_STATUSES.PENDING,
    }),
    Research.countDocuments({
      stage: RESEARCH_STAGES.PROGRESS,
      status: RESEARCH_STATUSES.APPROVED,
    }),
    Research.countDocuments({ isPublished: true }),
    Research.countDocuments({
      stage: RESEARCH_STAGES.FINAL_PAPER,
      status: RESEARCH_STATUSES.PENDING,
    }),
    Research.countDocuments({
      status: RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
    }),
    Research.countDocuments({
      assignedReviewer: null,
      status: RESEARCH_STATUSES.PENDING,
    }),
    Researcher.countDocuments({ role: RESEARCHER_ROLES.RESEARCHER }),
    Researcher.countDocuments({ role: RESEARCHER_ROLES.REVIEWER }),
    Researcher.countDocuments({
      $or: [
        { role: RESEARCHER_ROLES.RESEARCH_COMMITTEE },
        { isCommittee: true },
      ],
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
    users: { totalResearchers, totalReviewers, totalCommitteeMembers },
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
  getRecordTimeline
};

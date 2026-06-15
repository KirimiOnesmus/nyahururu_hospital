const crypto = require("crypto");
const Researcher = require("../models/ResearcherModel");
const emailService = require("../utils/emailServices");
const { AppError } = require("../utils/appError");
const {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  PAGINATION,
} = require("../constants/researchIndex");
const { signToken } = require("./researcherService");

//  INVITE REVIEWER

const inviteReviewer = async (data, caller) => {
  const {
    firstName,
    lastName,
    email,
    institution,
    discipline,
    specialisations,
  } = data;
  const callerName = caller?.name || "Administration";

  // Check if email already exists
  const existing = await Researcher.findByEmail(email);

  if (existing) {
    if (
      [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.ADMIN].includes(
        existing.role,
      )
    ) {
      throw new AppError(
        `${existing.name} already has the role: ${existing.role}.`,
        409,
      );
    }

    existing.role = RESEARCHER_ROLES.REVIEWER;
    existing.specialisations = specialisations || existing.specialisations;
    if (caller?.id) existing.invitedBy = caller.id;
    existing.invitedAt = new Date();
    await existing.save();

    await emailService.sendReviewerPromoted({
      email: existing.email,
      name: existing.name || existing.firstName,
      promotedBy: callerName,
    });

    return { action: "promoted", reviewer: existing };
  }

  const reviewer = new Researcher({
    firstName,
    lastName,
    email: email.toLowerCase(),
    institution: institution || "",
    discipline: discipline || "",
    specialisations: specialisations || [],
    role: RESEARCHER_ROLES.REVIEWER,
    status: RESEARCHER_STATUSES.INVITED,
    password: crypto.randomBytes(16).toString("hex"),
    emailVerified: false,
    invitedBy: caller?.id || null,
    invitedAt: new Date(),
  });

  const rawToken = reviewer.generateToken("invite");
  await reviewer.save();

  const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await emailService.sendReviewerInvite({
    email: reviewer.email,
    name: reviewer.firstName,
    inviteLink,
    invitedBy: callerName,
  });

  return {
    action: "invited",
    reviewer,
    ...(process.env.NODE_ENV !== "production" && {
      _devInviteLink: inviteLink,
    }),
  };
};

const setPassword = async ({ token, email, password }) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const reviewer = await Researcher.findOne({
    email: email.toLowerCase(),
    emailVerificationToken: hashed,
    emailVerificationExpire: { $gt: new Date() },
    role: RESEARCHER_ROLES.REVIEWER,
  }).select("+emailVerificationToken +emailVerificationExpire +password");

  if (!reviewer) {
    throw new AppError(
      "Invite link is invalid or has expired. Please ask an admin to resend.",
      400,
    );
  }

  reviewer.password = password;
  reviewer.emailVerified = true;
  reviewer.status = RESEARCHER_STATUSES.ACTIVE;
  reviewer.emailVerificationToken = null;
  reviewer.emailVerificationExpire = null;
  reviewer.invitationAcceptedAt = new Date();
  await reviewer.save();

  const jwtToken = signToken(reviewer._id, reviewer.role);
  return { token: jwtToken, reviewer };
};

//  RESEND INVITE

const resendInvite = async (reviewerId, caller) => {
  const reviewer = await Researcher.findById(reviewerId);
  if (!reviewer) throw new AppError("Reviewer not found.", 404);

  if (reviewer.emailVerified) {
    throw new AppError(
      "This reviewer has already accepted the invitation.",
      400,
    );
  }
  if (reviewer.role !== RESEARCHER_ROLES.REVIEWER) {
    throw new AppError(`${reviewer.name} is not a reviewer.`, 400);
  }

  const rawToken = reviewer.generateToken("invite");
  await reviewer.save();

  const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(reviewer.email)}`;

  await emailService.sendReviewerInvite({
    email: reviewer.email,
    name: reviewer.firstName,
    inviteLink,
    invitedBy: caller?.name || "Administration",
  });

  return {
    ...(process.env.NODE_ENV !== "production" && {
      _devInviteLink: inviteLink,
    }),
  };
};

//  REVOKE REVIEWER

const revokeReviewer = async (reviewerId) => {
  const reviewer = await Researcher.findById(reviewerId);
  if (!reviewer) throw new AppError("Reviewer not found.", 404);

  if (reviewer.role === RESEARCHER_ROLES.ADMIN) {
    throw new AppError("Cannot revoke admin accounts via this endpoint.", 403);
  }
  if (reviewer.role !== RESEARCHER_ROLES.REVIEWER) {
    throw new AppError(`${reviewer.name} is not a reviewer.`, 400);
  }

  reviewer.role = RESEARCHER_ROLES.RESEARCHER;
  reviewer.specialisations = [];
  await reviewer.save();

  return reviewer;
};

//  PROMOTE TO ADMIN

const promoteToAdmin = async (researcherId) => {
  const researcher = await Researcher.findById(researcherId);
  if (!researcher) throw new AppError("Researcher not found.", 404);

  if (researcher.role === RESEARCHER_ROLES.ADMIN) {
    throw new AppError(`${researcher.name} is already an admin.`, 400);
  }

  researcher.role = RESEARCHER_ROLES.ADMIN;
  await researcher.save();
  return researcher;
};

//  LIST REVIEWERS

const listReviewers = async () => {
  const reviewers = await Researcher.find({
    role: { $in: [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.ADMIN] },
  })
    .select(
      "name email role institution discipline specialisations emailVerified status createdAt invitedAt",
    )
    .sort({ createdAt: -1 });

  return { count: reviewers.length, reviewers };
};

//  LIST ALL RESEARCHERS (paginated)

const listAllResearchers = async ({ role, page, limit }) => {
  const safePage = Math.max(1, page || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Math.max(1, limit || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT,
  );

  const filter = {};
  if (role) filter.role = role;

  const [researchers, total] = await Promise.all([
    Researcher.find(filter)
      .select(
        "name email role institution discipline emailVerified status createdAt invitedAt",
      )
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Researcher.countDocuments(filter),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    researchers,
  };
};

//  UPDATE REVIEWER

const updateReviewer = async (reviewerId, updates) => {
  const ALLOWED = ["specialisations", "institution", "discipline", "bio"];
  const safeUpdates = {};
  ALLOWED.forEach((f) => {
    if (updates[f] !== undefined) safeUpdates[f] = updates[f];
  });

  const reviewer = await Researcher.findByIdAndUpdate(
    reviewerId,
    { $set: safeUpdates },
    { new: true, runValidators: true },
  );
  if (!reviewer) throw new AppError("Reviewer not found.", 404);
  return reviewer;
};

module.exports = {
  inviteReviewer,
  setPassword,
  resendInvite,
  revokeReviewer,
  promoteToAdmin,
  listReviewers,
  listAllResearchers,
  updateReviewer,
};

const crypto = require("crypto");
const Researcher = require("../models/ResearcherModel");
const emailService = require("../utils/emailServices");
const { AppError } = require("../utils/appError");
const {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  PAGINATION,
  TOKEN_TTL,
} = require("../constants/researchIndex");
const { signToken } = require("./researcherService");

//  INVITE REVIEWER 

const inviteReviewer = async (data, caller) => {
  const { firstName, lastName, email, institution, discipline, specialisations } = data;
  const callerName = caller?.name || "Administration";

  const existing = await Researcher.findByEmail(email);

  if (existing) {
    if (
      [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.RESEARCH_COMMITTEE].includes(
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
    if (caller?.id) existing.invitedByAdminId = caller.id;
    existing.invitedByAdminName = callerName;
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
    invitedByAdminId: caller?.id || null,
    invitedByAdminName: callerName,
    invitedAt: new Date(),
  });

  const rawToken = reviewer.generateToken("invite", TOKEN_TTL.REVIEWER_INVITE);
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
    ...(process.env.NODE_ENV !== "production" && { _devInviteLink: inviteLink }),
  };
};

const setPassword = async ({ token, email, password }) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const account = await Researcher.findOne({
    email: email.toLowerCase(),
    emailVerificationToken: hashed,
    emailVerificationExpire: { $gt: new Date() },
    role: { $in: [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.RESEARCH_COMMITTEE] },
  }).select("+emailVerificationToken +emailVerificationExpire +password");

  if (!account) {
    throw new AppError(
      "Invite link is invalid or has expired. Please ask an admin to resend.",
      400,
    );
  }

  account.password = password;
  account.emailVerified = true;
  account.status = RESEARCHER_STATUSES.ACTIVE;
  account.emailVerificationToken = null;
  account.emailVerificationExpire = null;
  account.invitationAcceptedAt = new Date(); 
  await account.save();

  const jwtToken = signToken(account._id, account.role);
  return { token: jwtToken, reviewer: account };
};

//  RESEND INVITE (reviewer or committee) 
const resendInvite = async (reviewerId, caller) => {
  const account = await Researcher.findById(reviewerId);
  if (!account) throw new AppError("Account not found.", 404);

  if (account.emailVerified) {
    throw new AppError("This person has already accepted the invitation.", 400);
  }
  if (
    ![RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.RESEARCH_COMMITTEE].includes(
      account.role,
    )
  ) {
    throw new AppError(`${account.name} does not have a pending invite.`, 400);
  }

  const ttl =
    account.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE
      ? TOKEN_TTL.COMMITTEE_INVITE
      : TOKEN_TTL.REVIEWER_INVITE;

  const rawToken = account.generateToken("invite", ttl);
  await account.save();

  const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(account.email)}`;

  const sendFn =
    account.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE
      ? emailService.sendCommitteeInvite
      : emailService.sendReviewerInvite;

  await sendFn({
    email: account.email,
    name: account.firstName,
    inviteLink,
    invitedBy: caller?.name || "Administration",
  });

  return {
    ...(process.env.NODE_ENV !== "production" && { _devInviteLink: inviteLink }),
  };
};

//  REVOKE REVIEWER

const revokeReviewer = async (reviewerId, caller) => {
  const reviewer = await Researcher.findById(reviewerId);
  if (!reviewer) throw new AppError("Reviewer not found.", 404);

  if (reviewer.role !== RESEARCHER_ROLES.REVIEWER) {
    throw new AppError(`${reviewer.name} is not a reviewer.`, 400);
  }
  if (reviewer.isCommittee) {
    throw new AppError(
      `${reviewer.name} has Research Committee access promoted from this reviewer role. Revoke committee access first.`,
      409,
    );
  }

  reviewer.role = RESEARCHER_ROLES.RESEARCHER;
  reviewer.specialisations = [];
  await reviewer.save();

  await emailService.sendReviewerRevoked({
    email: reviewer.email,
    name: reviewer.name || reviewer.firstName,
    revokedBy: caller?.name || "Administration",
  });

  return reviewer;
};

// ── RESEARCH COMMITTEE: INVITE / PROMOTE ──────────────────────────────────────
//    existing REVIEWER  -> promoted in place (role stays REVIEWER, isCommittee=true)
//   existing RESEARCHER -> granted direct committee-only access (role -> RESEARCH_COMMITTEE)
//   no existing account -> brand-new committee-only invite

const inviteCommitteeMember = async (data, caller) => {
  const { firstName, lastName, email, institution, discipline, specialisations } = data;
  const callerName = caller?.name || "Administration";

  const existing = await Researcher.findByEmail(email);

  if (existing) {
    if (
      existing.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE ||
      existing.isCommittee
    ) {
      throw new AppError(
        `${existing.name} already has Research Committee access.`,
        409,
      );
    }

    if (existing.role === RESEARCHER_ROLES.REVIEWER) {
      existing.isCommittee = true;
      existing.committeeSince = new Date();
      existing.promotedFromReviewer = true;
      await existing.save();

      await emailService.sendCommitteePromoted({
        email: existing.email,
        name: existing.name || existing.firstName,
        promotedBy: callerName,
      });

      return { action: "promoted", member: existing };
    }

    if (existing.role === RESEARCHER_ROLES.RESEARCHER) {
      existing.role = RESEARCHER_ROLES.RESEARCH_COMMITTEE;
      existing.isCommittee = true;
      existing.committeeSince = new Date();
      existing.promotedFromReviewer = false;
      await existing.save();

      await emailService.sendCommitteePromoted({
        email: existing.email,
        name: existing.name || existing.firstName,
        promotedBy: callerName,
      });

      return { action: "granted", member: existing };
    }
  }

    if (!firstName || !lastName) {
    throw new AppError(
      "First name and last name are required to invite a new committee member.",
      422,
    );
  }

  // Brand-new committee-only account
  const member = new Researcher({
    firstName,
    lastName,
    email: email.toLowerCase(),
    institution: institution || "",
    discipline: discipline || "",
    specialisations: specialisations || [],
    role: RESEARCHER_ROLES.RESEARCH_COMMITTEE,
    isCommittee: true,
    committeeSince: new Date(),
    status: RESEARCHER_STATUSES.INVITED,
    password: crypto.randomBytes(16).toString("hex"),
    emailVerified: false,
    invitedByAdminId: caller?.id || null,
    invitedByAdminName: callerName,
    invitedAt: new Date(),
  });

  const rawToken = member.generateToken("invite", TOKEN_TTL.COMMITTEE_INVITE);
  await member.save();

  const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await emailService.sendCommitteeInvite({
    email: member.email,
    name: member.firstName,
    inviteLink,
    invitedBy: callerName,
  });

  return {
    action: "invited",
    member,
    ...(process.env.NODE_ENV !== "production" && { _devInviteLink: inviteLink }),
  };
};

//  RESEARCH COMMITTEE: REVOKE ACCESS (downgrade to regular researcher, or remove committee access if promoted from reviewer)

const revokeCommitteeAccess = async (researcherId, caller) => {
  const researcher = await Researcher.findById(researcherId);
  if (!researcher) throw new AppError("Researcher not found.", 404);

  const isCommitteeMember =
    researcher.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE || researcher.isCommittee;

  if (!isCommitteeMember) {
    throw new AppError(`${researcher.name} does not have Research Committee access.`, 400);
  }

  if (researcher.promotedFromReviewer) {
    
    researcher.isCommittee = false;
    researcher.committeeSince = null;
    researcher.promotedFromReviewer = false;
  } else {
   
    researcher.role = RESEARCHER_ROLES.RESEARCHER;
    researcher.isCommittee = false;
    researcher.committeeSince = null;
  }

  await researcher.save();

  await emailService.sendCommitteeRevoked({
    email: researcher.email,
    name: researcher.name || researcher.firstName,
    revokedBy: caller?.name || "Administration",
  });

  return researcher;
};

// LIST REVIEWERS + COMMITTEE 
const listReviewers = async () => {
  const reviewers = await Researcher.find({
    role: { $in: [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.RESEARCH_COMMITTEE] },
  })
    .select(
      "name email role institution discipline specialisations emailVerified status isCommittee committeeSince promotedFromReviewer createdAt invitedAt",
    )
    .sort({ createdAt: -1 });

  return { count: reviewers.length, reviewers };
};

//LIST ALL RESEARCHERS (paginated)

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
        "name email role institution discipline emailVerified status isCommittee createdAt invitedAt",
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
  inviteCommitteeMember,
  revokeCommitteeAccess,
  listReviewers,
  listAllResearchers,
  updateReviewer,
};
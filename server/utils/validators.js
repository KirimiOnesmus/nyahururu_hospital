const { z } = require("zod");
const { wordCountString } = require("./wordCount");
const criteriaSchema = z.record(z.string(), z.coerce.number()).optional();

const phoneSchema = z
  .string()
  .min(1, "Phone is required")
  .transform((v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 10)
      return "254" + digits.slice(1);
    if (digits.startsWith("254") && digits.length === 12) return digits;
    return digits;
  })
  .refine(
    (v) => /^254[0-9]{9}$/.test(v),
    "Enter a valid Safaricom number (e.g. 0712345678 or 254712345678)",
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const objectIdSchema = z.union([
  z.coerce.number().int().positive(),
  z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
  z.string().regex(/^\d+$/).transform(Number),
]);

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: passwordSchema,
  institution: z.string().trim().max(100).optional(),
  discipline: z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  phone: z.string().trim().optional(),
  bio: z.string().trim().max(1000).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().trim().email().toLowerCase(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    email: z.string().trim().email().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z.string().trim().optional(),
  institution: z.string().trim().max(100).optional(),
  discipline: z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  title: z.string().trim().max(20).optional(),
  location: z.string().trim().max(100).optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

// Research validators
const proposalInitiateSchema = z.object({
  phone: phoneSchema,
  title: z.string().trim().min(1, "Title is required").optional(),
  discipline: z.string().trim().optional(),
  amount: z.coerce.number().optional(),
  type: z.string().optional(),
});

const proposalConfirmSchema = z
  .object({
    paymentId: objectIdSchema,
    title: z.string().trim().min(1, "Title is required"),
    discipline: z.string().trim().min(1, "Discipline is required").max(150),
    abstract: z.string().trim().optional(),
    background: z.string().trim().optional(),
    objectives: z
      .union([z.array(z.string().trim()), z.string().trim()])
      .optional(),
    hypotheses: z.string().trim().optional(),
    literatureReviewSummary: z.string().trim().optional(),
    methodology: z.string().trim().optional(),
    expectedOutcome: z.string().trim().optional(),
    timeline: z.string().trim().optional(),
    studySites: z.union([z.array(z.any()), z.string().trim()]).optional(),
    teamMembers: z.string().trim().optional(),
    coInvestigators: z
      .union([z.array(z.any()).max(10, "Maximum 10 co-investigators per proposal."), z.string().trim().max(5000)])
      .optional(),
    fundingSource: z.string().trim().optional(),
    ethicsInformation: z.string().trim().optional(),
    references: z.string().trim().optional(),
    // SERU-specific fields
    protocolVersionNumber: z.string().trim().optional(),
    protocolVersionDate: z.string().trim().optional(),
    researchProgramme: z.string().trim().optional(),
    keyPerformanceArea: z.string().trim().optional(),
    strategy: z.string().trim().optional(),
    sdg: z.string().trim().optional(),
    studyImplementationCounties: z
      .union([z.array(z.string()), z.string().trim()])
      .optional(),
    totalFundsNeeded: z.union([z.coerce.number(), z.string()]).optional(),
    expectedDurationMonths: z.union([z.coerce.number(), z.string()]).optional(),
    justification: z.string().trim().optional(),
    inclusionCriteria: z.string().trim().optional(),
    exclusionCriteria: z.string().trim().optional(),
    sampleSizeDescription: z.string().trim().optional(),
    samplingProcedure: z.string().trim().optional(),
    dataManagementPlan: z.string().trim().optional(),
    ethicsHumanSubjects: z.string().trim().optional(),
    ethicsAnimalSubjects: z.string().trim().optional(),
    budgetSummary: z.string().trim().optional(),
    budgetJustification: z.string().trim().optional(),
    expectedApplicationOfResults: z.string().trim().optional(),
  })
  .passthrough();

const finalPaperSchema = z.object({
  finalAbstract: z.string().trim().max(5000).optional(),

  keywords: z.union([z.array(z.string().trim()), z.string().trim()]).optional(),

  conflictOfInterestDeclared: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === true || v === "true"),

  aiUsageDeclared: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === true || v === "true"),

  aiUsageDetails: z.string().trim().max(2000).optional().or(z.literal("")),

  plagiarismReportLink: z.string().trim().url().optional().or(z.literal("")),
  fundingSource: z.string().trim().max(300).optional().or(z.literal("")),
  noteToCommittee: z.string().trim().max(2000).optional().or(z.literal("")),
});

const reactivateResearchSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters.")
    .max(1000),
});

const researchAdminQuerySchema = paginationSchema.extend({
  stage: z.enum(["proposal", "progress", "final_paper"]).optional(),
  status: z
    .enum([
      "draft",
      "awaiting_payment",
      "submitted",
      "returned_for_correction",
      "under_review",
      "revision_requested",
      "pending_committee_review",
      "approved",
      "rejected",
      "expired",
      "closed",
      "suspended",
    ])
    .optional(),
  search: z.string().trim().optional(),
});

const assignReviewerSchema = z.object({
  email: z.string().trim().email("Invalid reviewer email"),
});


const cscEndorsementSchema = z.object({
  cscApprovalDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid CSC approval date"),
  cscReviewDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid CSC review date")
    .optional()
    .or(z.literal("")),
  cscComments: z.string().trim().max(2000).optional().or(z.literal("")),
  cscContactName: z.string().trim().min(1, "CSC contact name is required.").max(200),
  cscContactEmail: z.string().trim().email("Invalid CSC contact email."),
});

const returnForCorrectionSchema = z.object({
  issues: z
    .array(z.string().trim().min(1).max(300))
    .min(1, "At least one issue must be listed.")
    .max(25),
});

const protocolDeviationSchema = z.object({
  parentResearchId: objectIdSchema,
  deviationType: z
    .enum(["protocol_deviation", "protocol_violation", "safety_event"])
    .default("protocol_deviation"),
  severity: z.enum(["minor", "major", "critical"]).default("minor"),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  dateOfDeviation: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date of deviation"),
  correctiveAction: z.string().trim().max(3000).optional().or(z.literal("")),
  participantsAffected: z.coerce.number().int().min(0).max(1000000).optional(),
  atRiskParticipantList: z.string().trim().max(10000).optional().or(z.literal("")),
  isUrgentSafety: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

// G-2
const coInvestigatorEditAccessSchema = z.object({
  canEdit: z.union([z.boolean(), z.literal("true"), z.literal("false")]),
});

const coInvestigatorEditSchema = z
  .object({
    abstract: z.string().trim().max(20000).optional(),
    background: z.string().trim().max(20000).optional(),
    objectives: z.string().trim().max(20000).optional(),
    methodology: z.string().trim().max(20000).optional(),
    expectedOutcome: z.string().trim().max(20000).optional(),
    timeline: z.string().trim().max(5000).optional(),
    inclusionCriteria: z.string().trim().max(10000).optional(),
    exclusionCriteria: z.string().trim().max(10000).optional(),
    literatureReviewSummary: z.string().trim().max(20000).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one editable field must be provided.",
  });

const progressSubmitSchema = z
  .object({
    isDraft: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .optional()
      .transform((v) => v === true || v === "true"),

    methodology: z.string().trim().optional(),
    studyDesign: z.string().trim().optional(),
    samplingMethod: z.string().trim().optional(),
    sampleSizeAchieved: z.coerce.number().min(0).optional(),
    sampleSizeTarget: z.coerce.number().min(1).optional(),
    dataCollectionProgress: z.string().trim().optional(),
    statisticalMethods: z.string().trim().optional(),
    analysisTools: z.string().trim().optional(),
    preliminaryFindings: z.string().trim().optional(),
    deviationsFromProtocol: z.string().trim().optional(),
    ethicalIncidents: z.string().trim().optional(),
    participantWithdrawals: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isDraft) return;

    const required = [
      "methodology",
      "studyDesign",
      "sampleSizeAchieved",
      "sampleSizeTarget",
      "preliminaryFindings",
    ];
    required.forEach((field) => {
      if (data[field] === undefined || data[field] === "") {
        ctx.addIssue({
          path: [field],
          code: z.ZodIssueCode.custom,
          message: `${field} is required for final submission.`,
        });
      }
    });
  });

const multipartCriteriaSchema = z.preprocess((v) => {
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return {}; }
  }
  return v;
}, criteriaSchema);

// Chair's change #5: reviewers can never produce a "rejected" outcome —
// enforced here at the schema level (and again in the service, defense
// in depth) so it can't be bypassed via a direct API call.
const submitReviewSchema = z.object({
  researchId: objectIdSchema,
  decision: z.enum(["approved", "revision"]),
  // Chair's change #6: backend ceiling raised 500 → 10,000. The old
  // 500 figure was a frontend-only display cap with no basis here.
  comment: z
    .string()
    .trim()
    .min(10, "Review comment must be at least 10 characters")
    .max(10000),
  // Submitted via multipart alongside file uploads, so this may arrive
  // as a JSON string rather than a parsed object.
  criteria: multipartCriteriaSchema,
});

// Committee retains the power to reject (§6.5 — "decoupled" from the
// reviewer schema above).
const submitCommitteeReviewSchema = z.object({
  researchId: objectIdSchema,
  decision: z.enum(["approved", "revision", "rejected", "suspended"]),
  comment: z
    .string()
    .trim()
    .min(10, "Review comment must be at least 10 characters")
    .max(10000),
  criteria: criteriaSchema,
});

// Chair's change #3: closeout report file + publication link. The
// /study-closures route previously had no request-validation schema
// at all — this whitelists every field the service accepts.
const studyClosureSchema = z.object({
  parentResearchId: objectIdSchema,
  closureReason: z.enum([
    "completed",
    "premature_discontinuation",
    "not_started",
    "transferred",
  ]),
  closureAttestations: z
    .preprocess((v) => {
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }
      return v;
    }, z.record(z.string(), z.union([z.boolean(), z.string()])))
    .optional(),
  resultsSummary: z.string().trim().max(20000).optional(),
  publications: z.string().trim().max(5000).optional(),
  participantIdentifiersDestroyed: z.union([z.boolean(), z.string()]).optional(),
  specimenDisposalPlan: z.string().trim().max(5000).optional(),
  dataFutureUsePlan: z.string().trim().max(5000).optional(),
  investigationalProductDisposal: z.string().trim().max(5000).optional(),
  publicationLink: z
    .string()
    .trim()
    .max(500)
    .url("Publication link must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const decisionReportEditSchema = z.object({
  committeeComment: z.string().trim().max(50000).optional(),
  finalDecision: z.enum(["approved", "revision", "rejected", "suspended"]).optional(),
}).passthrough();


const committeeReportNoteSchema = z.object({
  researchId: objectIdSchema,
  note: z.string().trim().min(1).max(20000),
});


const initiatePaymentSchema = z.object({
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase()
    .optional(),
  researchId: objectIdSchema.optional(),
  type: z.enum(["proposal_submission", "paper_download"]).optional(),
});

const refundPaymentSchema = z.object({
  paymentId: objectIdSchema,
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500),
});

const inviteReviewerSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().toLowerCase(),
  institution: z.string().trim().max(100).optional(),
  discipline: z.string().trim().max(100).optional(),
  specialisations: z.array(z.string().trim()).max(10).optional(),
});

const setPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    email: z.string().trim().email().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateReviewerSchema = z.object({
  specialisations: z.array(z.string().trim()).max(10).optional(),
  institution: z.string().trim().max(100).optional(),
  discipline: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
});

const inviteCommitteeSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  email: z.string().trim().toLowerCase().email(),
  institution: z.string().trim().optional(),
  discipline: z.string().trim().optional(),
  specialisations: z.array(z.string()).max(10).optional(),
});

const adminCreateResearcherSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{7,15}$/, "Phone number format is invalid.")
    .optional()
    .or(z.literal("")),
});

const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req[source] = result.data;
    next();
  };

module.exports = {
  validate,

  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  progressSubmitSchema,
  proposalInitiateSchema,
  proposalConfirmSchema,
  finalPaperSchema,
  researchAdminQuerySchema,
  assignReviewerSchema,
  reactivateResearchSchema,
  submitReviewSchema,
  submitCommitteeReviewSchema,
  studyClosureSchema,
  decisionReportEditSchema,
  committeeReportNoteSchema,
  cscEndorsementSchema,
  returnForCorrectionSchema,
  protocolDeviationSchema,
  coInvestigatorEditAccessSchema,
  coInvestigatorEditSchema,
  initiatePaymentSchema,
  refundPaymentSchema,
  inviteReviewerSchema,
  inviteCommitteeSchema,
  setPasswordSchema,
  updateReviewerSchema,
  adminCreateResearcherSchema,
};

const { z } = require("zod");

// Reusable field primitives
const phoneSchema = z
  .string()
  .min(1, "Phone is required")
  .transform((v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
    if (digits.startsWith("254") && digits.length === 12) return digits;
    return digits;
  })
  .refine(
    (v) => /^254[0-9]{9}$/.test(v),
    "Enter a valid Safaricom number (e.g. 0712345678 or 254712345678)"
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Auth validators 
const registerSchema = z.object({
  firstName:     z.string().trim().min(1).max(50),
  lastName:      z.string().trim().min(1).max(50),
  email:         z.string().trim().email("Invalid email address").toLowerCase(),
  password:      passwordSchema,
  institution:   z.string().trim().max(100).optional(),
  discipline:    z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  phone:         z.string().trim().optional(),
  bio:           z.string().trim().max(1000).optional(),
});

const loginSchema = z.object({
  email:    z.string().trim().email().toLowerCase(),
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
    token:           z.string().min(1, "Token is required"),
    email:           z.string().trim().email().toLowerCase(),
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword:     passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path:    ["confirmPassword"],
  });

const updateProfileSchema = z.object({
  firstName:     z.string().trim().min(1).max(50).optional(),
  lastName:      z.string().trim().min(1).max(50).optional(),
  phone:         z.string().trim().optional(),
  institution:   z.string().trim().max(100).optional(),
  discipline:    z.string().trim().max(100).optional(),
  qualification: z.string().trim().max(100).optional(),
  bio:           z.string().trim().max(1000).optional(),
  title:         z.string().trim().max(20).optional(),
  location:      z.string().trim().max(100).optional(),
  socialLinks: z
    .object({
      twitter:  z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      website:  z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

// Research validators 
const proposalInitiateSchema = z.object({
  phone:  phoneSchema,
  title:  z.string().trim().min(5, "Title must be at least 5 characters").max(50),
  discipline: z.string().trim().min(1, "Discipline is required").max(100),
  abstract:   z.string().trim().min(50, "Abstract must be at least 50 characters").max(300)
});

const proposalConfirmSchema = z.object({
  paymentId:       objectIdSchema,
  title:           z.string().trim().min(5).max(300),
  discipline:      z.string().trim().min(1).max(100),
  abstract:        z.string().trim().optional(),
  background:      z.string().trim().optional(),
  objectives:      z.string().trim().optional(),
  methodology:     z.string().trim().optional(),
  expectedOutcome: z.string().trim().optional(),
  timeline:        z.string().trim().optional(),
  teamMembers:     z.string().trim().optional(),
  references:      z.string().trim().optional(),
});

const finalPaperSchema = z.object({
  finalAbstract: z.string().trim().min(50, "Abstract must be at least 50 characters").optional(),
  keywords: z
    .union([
      z.array(z.string().trim()).max(10),
      z.string().transform((s) =>
        s.split(",").map((k) => k.trim()).filter(Boolean)
      ),
    ])
    .optional(),
});

const researchAdminQuerySchema = paginationSchema.extend({
  stage:  z.enum(["proposal", "final_paper"]).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  search: z.string().trim().optional(),
});

const updateDownloadPriceSchema = z.object({
  downloadPrice: z.number().min(0, "Price cannot be negative"),
});

const assignReviewerSchema = z.object({
  email: z.string().trim().email("Invalid reviewer email"),
});

const publicResearchQuerySchema = paginationSchema.extend({
  search:     z.string().trim().optional(),
  discipline: z.string().trim().optional(),
  sort:       z.enum(["newest", "oldest", "downloads", "price"]).default("newest"),
  priceMin:   z.coerce.number().min(0).optional(),
  priceMax:   z.coerce.number().min(0).optional(),
});

//  Review validators 
const submitReviewSchema = z.object({
  researchId: objectIdSchema,
  stage:      z.enum(["proposal", "final_paper"]),
  decision:   z.enum(["approved", "revision", "rejected"]),
  comment:    z
    .string()
    .trim()
    .min(10, "Review comment must be at least 10 characters")
    .max(5000),
  criteria: z
    .object({
      clarity:     z.number().int().min(1).max(5).optional(),
      methodology: z.number().int().min(1).max(5).optional(),
      originality: z.number().int().min(1).max(5).optional(),
      relevance:   z.number().int().min(1).max(5).optional(),
    })
    .optional(),
});

//  Payment validators 
const initiatePaymentSchema = z.object({
  phone:      phoneSchema,
  researchId: objectIdSchema.optional(),
  type:       z.enum(["proposal_submission", "paper_download"]).optional(),
});

const refundPaymentSchema = z.object({
  paymentId: objectIdSchema,
  reason:    z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
});

//  Reviewer management validators
const inviteReviewerSchema = z.object({
  firstName:       z.string().trim().min(1).max(50),
  lastName:        z.string().trim().min(1).max(50),
  email:           z.string().trim().email().toLowerCase(),
  institution:     z.string().trim().max(100).optional(),
  discipline:      z.string().trim().max(100).optional(),
  specialisations: z.array(z.string().trim()).max(10).optional(),
});

const setPasswordSchema = z
  .object({
    token:           z.string().min(1, "Token is required"),
    email:           z.string().trim().email().toLowerCase(),
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

const updateReviewerSchema = z.object({
  specialisations: z.array(z.string().trim()).max(10).optional(),
  institution:     z.string().trim().max(100).optional(),
  discipline:      z.string().trim().max(100).optional(),
  bio:             z.string().trim().max(1000).optional(),
});

const adminCreateResearcherSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName:  z.string().trim().min(1).max(50),
  email:     z.string().trim().email().toLowerCase(),
  phone:     z.string().trim().optional(),
});

//  Validator middleware factory

const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join("."),
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

  proposalInitiateSchema,
  proposalConfirmSchema,
  finalPaperSchema,
  researchAdminQuerySchema,
  updateDownloadPriceSchema,
  assignReviewerSchema,
  publicResearchQuerySchema,

  submitReviewSchema,

  initiatePaymentSchema,
  refundPaymentSchema,
  inviteReviewerSchema,
  setPasswordSchema,
  updateReviewerSchema,
  adminCreateResearcherSchema,
};
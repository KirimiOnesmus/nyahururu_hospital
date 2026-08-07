"use strict";

const {
  SUBMISSION_TYPES,
  RESEARCH_STATUSES,
  REVIEW_TYPES,
  FEES,
  APPROVAL_VALIDITY_MONTHS,
} = require("../../constants/researchIndex");

const SUBMISSION_TYPE_VALUES = Object.values(SUBMISSION_TYPES);
const STATUS_VALUES = Object.values(RESEARCH_STATUSES);
const REVIEW_TYPE_VALUES = Object.values(REVIEW_TYPES);


function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [
    i, ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

module.exports = (sequelize, DataTypes) => {
  const Research = sequelize.define(
    "Research",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      researcherId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },

  
      researchId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },

  
      submissionType: {
        type: DataTypes.ENUM(...SUBMISSION_TYPE_VALUES),
        allowNull: false,
        defaultValue: SUBMISSION_TYPES.INITIAL_PROPOSAL,
      },

      parentResearchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "submissions", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: { notEmpty: { msg: "Title is required" } },
        set(value) {
          this.setDataValue("title", value ? value.trim() : value);
        },
      },
      discipline: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: { msg: "Discipline is required" } },
      },
      abstract: DataTypes.TEXT,
      background: DataTypes.TEXT,
      objectives: DataTypes.TEXT,
      methodology: DataTypes.TEXT,
      expectedOutcome: DataTypes.TEXT,
      timeline: DataTypes.TEXT,
      teamMembers: DataTypes.TEXT,
      references: DataTypes.TEXT,

      protocolVersionNumber: { type: DataTypes.STRING(50), allowNull: true },
      protocolVersionDate: { type: DataTypes.DATEONLY, allowNull: true },


      seruNumber: { type: DataTypes.STRING(50), allowNull: true },


      centre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "NCRH",
      },
      researchProgramme: { type: DataTypes.STRING(200), allowNull: true },
      keyPerformanceArea: { type: DataTypes.STRING(200), allowNull: true },
      strategy: { type: DataTypes.STRING(200), allowNull: true },
      sdg: { type: DataTypes.STRING(200), allowNull: true },


      studyImplementationCounties: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      studySites: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      coInvestigators: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      fundingSource: { type: DataTypes.STRING(300), allowNull: true },
      totalFundsNeeded: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      expectedDurationMonths: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },


      hypotheses: DataTypes.TEXT,
      justification: DataTypes.TEXT,
      literatureReviewSummary: DataTypes.TEXT,
      inclusionCriteria: DataTypes.TEXT,
      exclusionCriteria: DataTypes.TEXT,
      sampleSizeDescription: DataTypes.TEXT,
      samplingProcedure: DataTypes.TEXT,
      dataManagementPlan: DataTypes.TEXT,
      ethicsInformation: DataTypes.TEXT,
      ethicsHumanSubjects: DataTypes.TEXT,
      ethicsAnimalSubjects: DataTypes.TEXT,
      budgetSummary: DataTypes.TEXT,
      budgetJustification: DataTypes.TEXT,
      expectedApplicationOfResults: DataTypes.TEXT,

      informedConsentDocs: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      studyToolsDocs: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      investigatorCertificates: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },
      supportingDocuments: {
        type: DataTypes.JSON, allowNull: false, defaultValue: [],
      },


      proposalFile: DataTypes.STRING(500),
      proposalFileKey: DataTypes.STRING(255),

      // CSC (Centre Scientific Committee) review
      cscReviewDate: { type: DataTypes.DATEONLY, allowNull: true },
      cscApprovalDate: { type: DataTypes.DATEONLY, allowNull: true },
      cscComments: DataTypes.TEXT,
      // G-5: evidence of centre-level review (e.g. signed Secretary letter,
      // per SOP-1 §10) plus who is attesting to it, so the endorsement
      // isn't just a self-reported date from any Research Officer.
      cscEvidenceFile: { type: DataTypes.STRING(500), allowNull: true },
      cscEvidenceFileKey: { type: DataTypes.STRING(500), allowNull: true },
      cscContactName: { type: DataTypes.STRING(200), allowNull: true },
      cscContactEmail: { type: DataTypes.STRING(200), allowNull: true },
      // F-15
      decisionLetterNumber: { type: DataTypes.STRING(50), allowNull: true },
      decisionLetterFile: { type: DataTypes.STRING(500), allowNull: true },
      decisionLetterFileKey: { type: DataTypes.STRING(500), allowNull: true },
      decisionLetterIssuedAt: { type: DataTypes.DATE, allowNull: true },

      // F-5: Administrative completeness review
      completenessCheckedAt: { type: DataTypes.DATE, allowNull: true },
      completenessCheckedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      completenessIssues: { type: DataTypes.JSON, allowNull: true },

      reviewType: {
        type: DataTypes.ENUM(...REVIEW_TYPE_VALUES),
        allowNull: false,
        defaultValue: REVIEW_TYPES.FULL_COMMITTEE,
      },

      status: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: RESEARCH_STATUSES.DRAFT,
      },


      assignedReviewerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assignedAt: DataTypes.DATE,


      approvedAt: DataTypes.DATE,
      approvalValidUntil: { type: DataTypes.DATEONLY, allowNull: true },


      proposalReview: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      // progressReview removed — column dropped in SERU migration
      reviewComment: DataTypes.TEXT,
      reviewedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      reviewedAt: DataTypes.DATE,

      resubmissionCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      revisionHistory: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      priority: {
        type: DataTypes.ENUM("high", "medium", "normal"),
        allowNull: false,
        defaultValue: "normal",
      },
      reviewDeadline: DataTypes.DATE,


      committeeRound: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      committeeReviewedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      committeeReviewedAt: DataTypes.DATE,
      committeeComment: { type: DataTypes.TEXT, defaultValue: "" },

      aggregateScore: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        validate: { min: 0, max: 10 },
      },
      reviewDecision: DataTypes.STRING(50),


      amendmentNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      amendmentDetails: DataTypes.TEXT,
      // F-8: Amendment classification
      isSubstantialAmendment: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null },

      // F-10: Investigational New Drug/Product flag
      isInvestigationalProduct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // F-9: Study design classification for expedited review track
      studyDesign: {
        type: DataTypes.ENUM("observational", "interventional", "mixed_methods", "other"),
        allowNull: true,
        defaultValue: null,
      },

      // Stage-specific payloads moved to their own 1:1 detail tables to
      // keep this base table clean:
      //   continuing_review_details  (progress report + documents)
      //   closure_details            (closeout report + disposal data)
      // Only `continuingReviewNumber` stays here, because it is part of the
      // submission's identity — the code-suffix hook below builds
      // `<parent>-CR<n>` from it before the detail row exists.
      continuingReviewNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      nacostiPermit: DataTypes.STRING(100),
      nacostiSubmittedAt: DataTypes.DATE,

      submissionPaymentId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      clearanceCertificateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      completionCertificateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },


      reactivatedAt: DataTypes.DATE,
      reactivatedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      reactivationReason: DataTypes.STRING(500),


      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: DataTypes.DATE,
      deletedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "submissions",
      defaultScope: {
        where: { isDeleted: false },
      },
      scopes: {
        withDeleted: {},
        onlyDeleted: { where: { isDeleted: true } },
      },
      indexes: [
        { unique: true, fields: ["research_id"] },
        { unique: true, fields: ["seru_number"] },
        { fields: ["researcher_id", "created_at"] },
        { fields: ["submission_type", "status"] },
        { fields: ["parent_research_id"] },
        { fields: ["assigned_reviewer_id", "status"] },
        { fields: ["approval_valid_until"] },
        { fields: ["is_deleted"] },
        { fields: ["title"] },
        { fields: ["discipline"] },
      ],
      hooks: {
        beforeValidate: async (research, options) => {
          if (research.researchId) return;

          // Child submissions (continuing reviews, amendments, close-outs)
          // are lodged against an EXISTING approved study. Per the KEMRI
          // SERU process they are not new proposals, so they inherit the
          // parent study's code with a submission suffix rather than
          // consuming a new NCRH proposal number.
          if (research.parentResearchId) {
            const parent = await sequelize.models.Research.findByPk(
              research.parentResearchId,
              { attributes: ["researchId"], transaction: options.transaction },
            );
            if (parent && parent.researchId) {
              const TAG = {
                continuing_review: "CR",
                amendment: "AM",
                study_closure: "CLO",
              };
              const tag = TAG[research.submissionType] || "SUB";
              const n =
                research.continuingReviewNumber ||
                research.amendmentNumber ||
                1;
              research.researchId =
                tag === "CLO"
                  ? `${parent.researchId}-CLO`
                  : `${parent.researchId}-${tag}${n}`;
              return;
            }
          }

          // Top-level proposal: allocate the next NCRH proposal number.
          const year = new Date().getFullYear();
          const seq = await sequelize.models.Counter.incrementAndGet(
            `research-${year}`,
            { transaction: options.transaction },
          );
          research.researchId = `NCRH-${year}-${String(seq).padStart(5, "0")}`;
        },
      },
    },
  );


  Object.defineProperty(Research.prototype, "isApprovalExpired", {
    get() {
      if (!this.approvalValidUntil) return false;
      return new Date(this.approvalValidUntil) < new Date();
    },
  });

  Object.defineProperty(Research.prototype, "canSubmitAmendment", {
    get() {
      return (
        this.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL &&
        this.status === RESEARCH_STATUSES.APPROVED &&
        !this.isApprovalExpired
      );
    },
  });

  Object.defineProperty(Research.prototype, "canSubmitContinuingReview", {
    get() {
      return (
        this.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL &&
        [RESEARCH_STATUSES.APPROVED, RESEARCH_STATUSES.EXPIRED].includes(this.status)
      );
    },
  });

  Object.defineProperty(Research.prototype, "canSubmitClosure", {
    get() {
      return (
        this.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL &&
        this.status === RESEARCH_STATUSES.APPROVED
      );
    },
  });

  Research.prototype.softDelete = function softDelete(deletedByResearcherId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedById = deletedByResearcherId ?? null;
    return this.save();
  };


  Research.prototype.generateSeruNumber = async function generateSeruNumber(options = {}) {
    if (this.seruNumber) return this.seruNumber;
    const year = new Date().getFullYear();
    const seq = await sequelize.models.Counter.incrementAndGet(
      `seru-${year}`,
      { transaction: options.transaction },
    );
    this.seruNumber = `NCRH/SERU/${year}/${String(seq).padStart(4, "0")}`;
    return this.seruNumber;
  };


  Research.prototype.approve = async function approve(options = {}) {
    this.status = RESEARCH_STATUSES.APPROVED;
    this.approvedAt = new Date();
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + APPROVAL_VALIDITY_MONTHS);
    this.approvalValidUntil = validUntil;

    if (this.submissionType === SUBMISSION_TYPES.INITIAL_PROPOSAL && !this.seruNumber) {
      await this.generateSeruNumber(options);
    }
    return this.save({ transaction: options.transaction });
  };


  Research.findSimilarTitles = async function findSimilarTitles(
    title, { excludeId, threshold = 0.85 } = {},
  ) {
    const [candidates] = await sequelize.query(
      `SELECT id, title,
              MATCH(title, abstract, discipline) AGAINST(:q IN NATURAL LANGUAGE MODE) AS score
       FROM submissions
       WHERE is_deleted = false
         ${excludeId ? "AND id <> :excludeId" : ""}
         AND MATCH(title, abstract, discipline) AGAINST(:q IN NATURAL LANGUAGE MODE)
       ORDER BY score DESC
       LIMIT 5`,
      { replacements: { q: title, excludeId } },
    );

    const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const a = normalize(title);

    return candidates.filter((c) => {
      const b = normalize(c.title);
      const longer = Math.max(a.length, b.length) || 1;
      const distance = levenshtein(a, b);
      return 1 - distance / longer >= threshold;
    });
  };


  Research.associate = (models) => {
    Research.belongsTo(models.Researcher, { foreignKey: "researcherId", as: "researcher" });
    Research.belongsTo(models.Researcher, { foreignKey: "assignedReviewerId", as: "assignedReviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "reviewedById", as: "reviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "committeeReviewedById", as: "committeeReviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "reactivatedById", as: "reactivator" });
    Research.belongsTo(models.Researcher, { foreignKey: "deletedById", as: "deleter" });

    Research.belongsTo(Research, { foreignKey: "parentResearchId", as: "parentResearch" });
    Research.hasMany(Research, { foreignKey: "parentResearchId", as: "childSubmissions" });

    // 1:1 stage-specific payloads (see continuing_review_detail.js /
    // closure_detail.js). Loaded via include when a submission's details
    // are needed; the base row stays lean.
    if (models.ContinuingReviewDetail) {
      Research.hasOne(models.ContinuingReviewDetail, {
        foreignKey: "submissionId",
        as: "continuingReviewDetail",
        onDelete: "CASCADE",
      });
    }
    if (models.ClosureDetail) {
      Research.hasOne(models.ClosureDetail, {
        foreignKey: "submissionId",
        as: "closureDetail",
        onDelete: "CASCADE",
      });
    }

    if (models.ResearchReviewer) {
      Research.hasMany(models.ResearchReviewer, { foreignKey: "researchId", as: "reviewerAssignments" });
    }

    if (models.CoInvestigatorAssignment) {
      Research.hasMany(models.CoInvestigatorAssignment, { foreignKey: "researchId", as: "coInvestigatorAssignments" });
    }

    if (models.ProtocolDeviation) {
      Research.hasMany(models.ProtocolDeviation, { foreignKey: "researchId", as: "protocolDeviations" });
    }

    if (models.Review) {
      Research.hasMany(models.Review, { foreignKey: "researchId", as: "reviews" });
    }
    if (models.Payment) {
      Research.hasMany(models.Payment, { foreignKey: "researchId", as: "payments" });
      Research.belongsTo(models.Payment, {
        foreignKey: "submissionPaymentId",
        as: "submissionPayment",
        constraints: false,
      });
    }
    if (models.Certificate) {
      Research.belongsTo(models.Certificate, {
        foreignKey: "clearanceCertificateId",
        as: "clearanceCertificate",
        constraints: false,
      });
      Research.belongsTo(models.Certificate, {
        foreignKey: "completionCertificateId",
        as: "completionCertificate",
        constraints: false,
      });
    }
  };

  Research.SUBMISSION_TYPES = SUBMISSION_TYPE_VALUES;
  Research.STATUSES = STATUS_VALUES;
  Research.REVIEW_TYPES = REVIEW_TYPE_VALUES;

  return Research;
};
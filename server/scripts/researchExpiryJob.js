"use strict";


require("dotenv").config();

const { Op } = require("sequelize");
const {
  Research, Researcher, ProtocolDeviation, sequelize,
} = require("../sequelize/models");
const emailService = require("../utils/emailServices");

const RESEARCH_STATUSES = require("../constants/researchIndex").RESEARCH_STATUSES;
const SUBMISSION_TYPES = require("../constants/researchIndex").SUBMISSION_TYPES;

const IND_WINDOW_DAYS = 42;     // 6 weeks
const STANDARD_WINDOW_DAYS = 28; // 4 weeks
const DEVIATION_DEADLINE_DAYS = 5;


const run = async ({ closeConnection = true } = {}) => {
  const startedAt = Date.now();
  try {
    await sequelize.authenticate();
    const now = new Date();
    let reminders = 0;
    let expired = 0;


    const indWindow = new Date(now.getTime() + IND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const stdWindow = new Date(now.getTime() + STANDARD_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const approachingExpiry = await Research.findAll({
      where: {
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: RESEARCH_STATUSES.APPROVED,
        approvalValidUntil: { [Op.gt]: now, [Op.lte]: indWindow },
      },
      include: [{ model: Researcher, as: "researcher", attributes: ["id", "email", "name", "firstName"] }],
    });

    for (const study of approachingExpiry) {
      const windowDays = study.isInvestigationalProduct ? IND_WINDOW_DAYS : STANDARD_WINDOW_DAYS;
      const windowDate = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);


      if (new Date(study.approvalValidUntil) > windowDate) continue;

      const daysLeft = Math.ceil(
        (new Date(study.approvalValidUntil).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (study.researcher?.email) {
        await emailService.sendRevisionRequested?.({
          email: study.researcher.email,
          name: study.researcher.name || study.researcher.firstName,
          proposalTitle: study.title,
          stage: "renewal_reminder",
          reviewerComment: `Your study approval expires in ${daysLeft} day(s). Please submit a Continuing Review Report.`,
        }).catch(() => {});
        reminders++;
      }
    }


    const lapsed = await Research.findAll({
      where: {
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: RESEARCH_STATUSES.APPROVED,
        approvalValidUntil: { [Op.lt]: now },
      },
      include: [{ model: Researcher, as: "researcher", attributes: ["id", "email", "name", "firstName"] }],
    });

    for (const study of lapsed) {
      study.status = RESEARCH_STATUSES.EXPIRED;
      await study.save();
      expired++;

      if (ProtocolDeviation) {
        const existing = await ProtocolDeviation.count({
          where: { researchId: study.id, deviationType: "protocol_deviation" },
        });
        if (!existing) {
          await ProtocolDeviation.create({
            researchId: study.id,
            researcherId: study.researcherId,
            deviationType: "protocol_deviation",
            severity: "major",
            description: "Study approval expired — at-risk participant list and deviation report required per SOP-3 §10.8.",
            dateOfDeviation: study.approvalValidUntil || now,
            status: "draft",
            deadline: new Date(now.getTime() + DEVIATION_DEADLINE_DAYS * 24 * 60 * 60 * 1000),
          });
        }
      }

      if (study.researcher?.email) {
        await emailService.sendRevisionRequested?.({
          email: study.researcher.email,
          name: study.researcher.name || study.researcher.firstName,
          proposalTitle: study.title,
          stage: "expiry_notice",
          reviewerComment: "Your study approval has expired. You have 5 days to submit a protocol deviation report with the at-risk participant list.",
        }).catch(() => {});
      }
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[${now.toISOString()}] Expiry job: ${reminders} reminder(s) sent, ${expired} study(ies) expired in ${elapsed}ms`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Expiry job failed:`, err.message);
    if (require.main === module) process.exitCode = 1;
    else throw err;
  } finally {
    if (closeConnection) await sequelize.close();
  }
};

module.exports = { run };

if (require.main === module) {
  run();
}

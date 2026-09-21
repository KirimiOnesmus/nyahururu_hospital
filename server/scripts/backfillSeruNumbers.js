"use strict";



require("dotenv").config();

const { Op } = require("sequelize");
const { Research, sequelize } = require("../sequelize/models");
const { RESEARCH_STATUSES, SUBMISSION_TYPES } = require("../constants/researchIndex");

const BACKFILL_STATUSES = [
  RESEARCH_STATUSES.SUBMITTED,
  RESEARCH_STATUSES.UNDER_REVIEW,
  RESEARCH_STATUSES.REVISION_REQUESTED,
  RESEARCH_STATUSES.PENDING_COMMITTEE_REVIEW,
  RESEARCH_STATUSES.PENDING_OFFICER_REVIEW,
  RESEARCH_STATUSES.APPROVED,
];

const run = async ({ closeConnection = true } = {}) => {
  const startedAt = Date.now();
  let assigned = 0;
  try {
    await sequelize.authenticate();

    const candidates = await Research.findAll({
      where: {
        submissionType: SUBMISSION_TYPES.INITIAL_PROPOSAL,
        status: { [Op.in]: BACKFILL_STATUSES },
        seruNumber: null,
      },
    });

    for (const study of candidates) {

      await sequelize.transaction(async (t) => {
        await study.reload({ transaction: t, lock: t.LOCK.UPDATE });
        if (study.seruNumber) return;
        await study.generateSeruNumber({ transaction: t });
        await study.save({ transaction: t });
      });
      assigned++;
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] SERU backfill: ${assigned} proposal(s) assigned a SERU number in ${elapsed}ms`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] SERU backfill failed:`, err.message);
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

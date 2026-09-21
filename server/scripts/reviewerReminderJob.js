"use strict";

require("dotenv").config();

const { ResearchReviewer, sequelize } = require("../sequelize/models");
const email = require("../utils/emailServices");
const { REVIEWER_REMINDER_DAYS } = require("../constants/researchIndex");

const run = async ({ closeConnection = true } = {}) => {
  const startedAt = Date.now();
  let sent = 0;
  let failed = 0;
  try {
    await sequelize.authenticate();

    const dueAssignments = await ResearchReviewer.findDueForReminder(
      REVIEWER_REMINDER_DAYS,
    );

    for (const assignment of dueAssignments) {
      const reviewer = assignment.reviewer;
      const research = assignment.research;
      if (!reviewer?.email || !research) continue;

      try {
        await email.sendReviewerReminder({
          email: reviewer.email,
          name: reviewer.firstName || reviewer.name,
          proposalTitle: research.title,
          deadline: research.reviewDeadline,
        });

        assignment.firstReminderSentAt = new Date();
        await assignment.save();
        sent++;
      } catch (err) {
        failed++;
        console.error(
          `[reviewerReminderJob] Failed to remind reviewer ${reviewer.id} on research ${research.id}:`,
          err.message,
        );
      }
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] Reviewer reminder job: ${sent} sent, ${failed} failed, ${dueAssignments.length} candidate(s) in ${elapsed}ms`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Reviewer reminder job failed:`, err.message);
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

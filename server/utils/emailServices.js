"use strict";
const nodemailer = require("nodemailer");

let transporter = null;
let transporterReady = false;

const initializeTransporter = async () => {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();
    transporterReady = true;
    console.log("[Email] Transporter verified and ready.");
  } catch (error) {
    transporterReady = false;
    transporter = null;
    console.error("[Email] Transporter initialization failed:", error.message);
  }
};

initializeTransporter();

//  INTERNAL SEND HELPER 

const sendMail = async (to, subject, html, fromLabel = null) => {
  if (!transporter || !transporterReady) {
    console.error(
      `[Email] Transporter not ready. Skipping: "${subject}" → ${to}`,
    );
    return null;
  }

  try {
    const from = fromLabel
      ? `"${fromLabel}" <${process.env.EMAIL_USER}>`
      : process.env.EMAIL_USER;

    const result = await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] Sent: "${subject}" → ${to} (${result.messageId})`);
    return result;
  } catch (err) {
    console.error(`[Email] Failed: "${subject}" → ${to} | ${err.message}`);
    return null;
  }
};

//  CONSTANTS 

const HMIS_NAME    = "Nyahururu County Referral Hospital";
const PORTAL_NAME  = "Nyahururu Hospital Research Portal";
const PORTAL_YEAR  = new Date().getFullYear();
const SUPPORT_EMAIL = process.env.EMAIL_USER || "support@ncrh.ac.ke";
const FRONTEND_URL  = process.env.FRONTEND_URL || "";
const HOSPITAL_LOGO = `${process.env.BACKEND_URL}/public/logo.png`;
const COUNTY_LOGO   = `${process.env.BACKEND_URL}/public/county-government.png`;

//  SHELL BUILDER 

const makeShell = (portalName, subTitle, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portalName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:8px;overflow:hidden;
             box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:#1A3C6E;padding:16px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="52" style="vertical-align:middle;">
                <img src="${HOSPITAL_LOGO}" alt="Hospital Logo" width="48" height="48"
                     style="display:block;object-fit:contain;border-radius:4px;" />
              </td>
              <td style="vertical-align:middle;text-align:center;padding:0 12px;">
                <p style="margin:0;color:#ffffff;font-size:14px;font-weight:bold;
                           letter-spacing:0.5px;line-height:1.4;">${portalName}</p>
                <p style="margin:3px 0 0;color:#BFD7F0;font-size:10px;
                           letter-spacing:1px;text-transform:uppercase;">${subTitle}</p>
              </td>
              <td width="52" style="vertical-align:middle;">
                <img src="${COUNTY_LOGO}" alt="County Government Logo" width="48" height="48"
                     style="display:block;object-fit:contain;border-radius:4px;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr><td style="padding:32px;">${content}</td></tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;text-align:center;">
            This is an automated message from ${portalName}.<br/>
            © ${PORTAL_YEAR} N.C.R.H — Healthcare Management System. All rights reserved.<br/>
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#6b7280;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`;

/** Research Portal emails */
const shell = (content) =>
  makeShell(PORTAL_NAME, "Research Management System", content);

/** HMIS / general emails */
const hmisShell = (content) =>
  makeShell(HMIS_NAME, "Healthcare Management System", content);

//  SHARED COMPONENT HELPERS 

const btn = (url, label, color = "#3B82F6") => `
<div style="margin:28px 0;text-align:center;">
  <a href="${url}"
     style="display:inline-block;padding:13px 32px;background:${color};
            color:#ffffff;text-decoration:none;border-radius:6px;
            font-weight:bold;font-size:15px;">
    ${label}
  </a>
</div>`;

const detailTable = (rows) => `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  ${rows
    .map(
      ([label, value]) => `
  <tr style="border-bottom:1px solid #f3f4f6;">
    <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:bold;width:40%;">${label}</td>
    <td style="padding:10px 0;color:#111827;font-size:14px;">${value}</td>
  </tr>`,
    )
    .join("")}
</table>`;

//  HMIS EMAILS 

exports.testEmail = async (email) =>
  sendMail(
    email,
    "Test Email - Healthcare Management System",
    hmisShell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Test Email</h2>
      <p style="color:#374151;line-height:1.7;">
        If you received this email, your email service is working correctly!
      </p>
    `),
    HMIS_NAME,
  );

exports.sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${FRONTEND_URL}verify-email?token=${token}&userId=${userId}`;
  return sendMail(
    email,
    "Email Verification - Nyahururu Healthcare Management System",
    hmisShell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Email Verification</h2>
      <p style="color:#374151;line-height:1.7;">Dear User,</p>
      <p style="color:#374151;line-height:1.7;">
        An account has been created for you on the Nyahururu Healthcare Management System.
        Please verify your email address by clicking the button below.
      </p>
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;
                  padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#856404;font-size:13px;line-height:1.6;">
          <strong>What happens next:</strong><br/>
          Once you verify your email, your temporary login password will be sent to this address.
          You will be required to change it immediately after your first login.
        </p>
      </div>
      ${btn(verificationUrl, "Verify My Email", "#4CAF50")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${verificationUrl}" style="color:#3B82F6;word-break:break-all;">${verificationUrl}</a>
      </p>
      <p style="color:#9ca3af;font-size:11px;margin-top:12px;">
        This link will expire in 24 hours. If you did not expect this email, please ignore it.
      </p>
    `),
    HMIS_NAME,
  );
};

exports.sendNewPasswordEmail = async (email, password) => {
  const loginUrl = `${FRONTEND_URL}login`;
  return sendMail(
    email,
    "Your Temporary Password - Nyahururu Healthcare Management System",
    hmisShell(`
      <h2 style="color:#4CAF50;margin-top:0;">Email Verified Successfully!</h2>
      <p style="color:#374151;line-height:1.7;">
        Your email has been verified. Use the temporary password below to log in.
      </p>
      <div style="margin:24px 0;padding:20px;background:#ffffff;
                  border:2px solid #4CAF50;border-radius:8px;text-align:center;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:bold;
                  text-transform:uppercase;letter-spacing:1px;">Your Temporary Password</p>
        <p style="font-size:26px;font-weight:bold;color:#4CAF50;letter-spacing:4px;
                  margin:0;font-family:monospace;">${password}</p>
      </div>
      <div style="background:#fff3cd;border-left:4px solid #ffc107;
                  border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#856404;font-size:13px;line-height:1.7;">
          <strong>Important — action required after login:</strong><br/>
          This is a temporary password. Once you log in, go to
          <strong>My Profile → Change Password</strong> and set a strong personal password.
          This protects your account and patient data.
        </p>
      </div>
      ${btn(loginUrl, "Log In Now", "#4CAF50")}
      <p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
        If you did not verify this email, please contact support immediately at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3B82F6;">${SUPPORT_EMAIL}</a>
      </p>
    `),
    HMIS_NAME,
  );
};

exports.sendPasswordChangedEmail = async (email, name) => {
  const loginUrl = `${FRONTEND_URL}login`;
  const timestamp = new Date().toLocaleString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });

  return sendMail(
    email,
    "Password Changed Successfully - Nyahururu Healthcare Management System",
    hmisShell(`
      <h2 style="color:#4CAF50;margin-top:0;">Password Updated Successfully</h2>
      <p style="color:#374151;line-height:1.7;">Dear ${name || "User"},</p>
      <p style="color:#374151;line-height:1.7;">
        Your account password was changed successfully. Here are the details of this change:
      </p>
      ${detailTable([
        ["Account", email],
        ["Changed at", timestamp],
        ["Status", '<span style="color:#4CAF50;font-weight:bold;">Successful</span>'],
      ])}
      <div style="background:#ffebee;border-left:4px solid #f44336;
                  border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#c62828;font-size:13px;line-height:1.7;">
          <strong>Did not make this change?</strong><br/>
          If you did not change your password, your account may be compromised.
          Please contact support immediately at
          <a href="mailto:${SUPPORT_EMAIL}" style="color:#c62828;font-weight:bold;">${SUPPORT_EMAIL}</a>
          or reset your password right away.
        </p>
      </div>
      ${btn(loginUrl, "Go to Login", "#3B82F6")}
      <p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
        This is an automated security notification from the Nyahururu Healthcare Management System.
        Please do not reply to this email.
      </p>
    `),
    HMIS_NAME,
  );
};

exports.sendAccountNotificationEmail = async (email, subject, message) =>
  sendMail(
    email,
    subject,
    hmisShell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Account Notification</h2>
      <p style="color:#374151;line-height:1.7;">${message}</p>
      <p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
        If you did not perform this action, please contact support immediately.
      </p>
    `),
    HMIS_NAME,
  );

exports.sendAppointmentConfirmationEmail = async (appointmentData) => {
  const { patientName, patientEmail, service, appointmentDate, time, phone } =
    appointmentData;
  const formattedDate = new Date(appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return sendMail(
    patientEmail,
    "Appointment Booking Confirmation",
    hmisShell(`
      <h2 style="color:#4CAF50;margin-top:0;">Appointment Booked Successfully!</h2>
      <p style="color:#374151;line-height:1.7;">Dear ${patientName},</p>
      <p style="color:#374151;line-height:1.7;">
        Your appointment has been received and is pending confirmation from our medical team.
      </p>
      ${detailTable([
        ["Service", service],
        ["Date", formattedDate],
        ["Time", time],
        ["Contact", phone || "N/A"],
      ])}
      <p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
        If you need to reschedule or cancel, please contact us as soon as possible.
      </p>
    `),
    HMIS_NAME,
  );
};

exports.sendAppointmentStatusUpdateEmail = async (
  email,
  appointmentData,
  status,
) => {
  const { patientName, service, appointmentDate, time } = appointmentData;
  const formattedDate = new Date(appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusMap = {
    confirmed: {
      color: "#4CAF50",
      text: "Confirmed",
      msg: "Your appointment has been confirmed by our medical team.",
    },
    cancelled: {
      color: "#f44336",
      text: "Cancelled",
      msg: "Your appointment has been cancelled. Please contact us if you need to reschedule.",
    },
    rescheduled: {
      color: "#ff9800",
      text: "Rescheduled",
      msg: "Your appointment has been rescheduled. Please check the new details below.",
    },
  };
  const { color, text, msg } = statusMap[status] || {
    color: "#3B82F6",
    text: status,
    msg: `Your appointment status has been updated to: ${status}`,
  };

  return sendMail(
    email,
    `Appointment ${text}`,
    hmisShell(`
      <h2 style="color:${color};margin-top:0;">Appointment ${text}</h2>
      <p style="color:#374151;line-height:1.7;">Dear ${patientName},</p>
      <p style="color:#374151;line-height:1.7;">${msg}</p>
      ${detailTable([
        ["Service", service],
        ["Date", formattedDate],
        ["Time", time],
        ["Status", `<span style="color:${color};font-weight:bold;">${text}</span>`],
      ])}
    `),
    HMIS_NAME,
  );
};

exports.sendFeedbackReplyEmail = async (
  email,
  userName,
  originalMessage,
  replyMessage,
) =>
  sendMail(
    email,
    "Response to Your Feedback - Healthcare Management System",
    hmisShell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Thank You for Your Feedback!</h2>
      <p style="color:#374151;line-height:1.7;">Dear ${userName || "User"},</p>
      <div style="background:#f9fafb;padding:15px;border-radius:0 6px 6px 0;
                  margin:20px 0;border-left:4px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 6px;font-weight:bold;">Your Message:</p>
        <p style="color:#374151;margin:0;line-height:1.7;">${originalMessage}</p>
      </div>
      <div style="background:#EFF6FF;padding:15px;border-radius:0 6px 6px 0;
                  margin:20px 0;border-left:4px solid #3B82F6;">
        <p style="color:#1e40af;font-size:13px;margin:0 0 6px;font-weight:bold;">Our Response:</p>
        <p style="color:#374151;margin:0;line-height:1.7;">${replyMessage}</p>
      </div>
    `),
    HMIS_NAME,
  );

exports.sendDonorRegistrationEmail = async (donorData) => {
  const { fullName, email, donationDate, donationTime, phone } = donorData;
  const formattedDate = new Date(donationDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return sendMail(
    email,
    "Blood Donation Registration Confirmation - Thank You for Saving Lives!",
    hmisShell(`
      <h2 style="color:#B91C1C;margin-top:0;">Blood Donation Registration Confirmed</h2>
      <p style="color:#374151;line-height:1.7;">
        Dear <strong style="color:#e53935;">${fullName}</strong>,
      </p>
      <p style="color:#374151;line-height:1.7;">
        Your blood donation registration has been received successfully.
      </p>
      ${detailTable([
        ["Date", formattedDate],
        ["Time", donationTime],
        ["Phone", phone || "Not provided"],
      ])}
    `),
    HMIS_NAME,
  );
};

// ─── RESEARCH PORTAL EMAILS ───────────────────────────────────────────────────

exports.sendResearcherVerificationEmail = ({ email, name, verifyLink }) =>
  sendMail(
    email,
    `Verify Your Email — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Verify Your Email Address</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Thank you for registering with ${PORTAL_NAME}. Please verify your email address to activate your account.
      </p>
      ${btn(verifyLink, "Verify Email Address", "#3B82F6")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${verifyLink}" style="color:#3B82F6;word-break:break-all;font-size:11px;">${verifyLink}</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendPasswordResetEmail = ({ email, name, resetLink }) =>
  sendMail(
    email,
    `Password Reset Request — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#B91C1C;margin-top:0;">Password Reset Request</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        You requested a password reset. Click the button below to set a new password.
      </p>
      ${btn(resetLink, "Reset My Password", "#B91C1C")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${resetLink}" style="color:#3B82F6;word-break:break-all;font-size:11px;">${resetLink}</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        This link expires in 24 hours. If you did not request a reset, please ignore this email.
      </p>
    `),
    PORTAL_NAME,
  );



  //RESEARCH PORTAL.

exports.sendAdminAddedResearcher = ({ email, name, password }) => {
  const loginUrl = `${FRONTEND_URL}/research/login`;
  return sendMail(
    email,
    `Your Research Portal Account — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1A3C6E;margin-top:0;">Welcome to ${PORTAL_NAME}</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        An administrator has created a researcher account for you. Your login credentials are below.
      </p>
      ${detailTable([
        ["Email", email],
        [
          "Password",
          `<code style="background:#f3f4f6;padding:3px 8px;border-radius:4px;
                        font-size:14px;letter-spacing:2px;">${password}</code>`,
        ],
      ])}
      <p style="color:#B91C1C;font-weight:bold;background:#FEF2F2;padding:12px 16px;border-radius:6px;">
        Please change your password immediately after your first login.
      </p>
      ${btn(loginUrl, "Log In Now", "#1E7B45")}
    `),
    PORTAL_NAME,
  );
};

exports.sendProposalSubmitted = ({ email, name, proposalTitle, mpesaReceipt, amount }) =>
  sendMail(
    email,
    `Proposal Submitted — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Proposal Submitted Successfully</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Your research proposal has been submitted and is awaiting reviewer assignment.
      </p>
      ${detailTable([
        ["Proposal Title", proposalTitle],
        ["Status", "Under Review"],
        ["M-Pesa Receipt", mpesaReceipt || "N/A"],
        ["Amount Paid", `KES ${amount}`],
      ])}
    `),
    PORTAL_NAME,
  );

exports.sendFinalPaperSubmitted = ({ email, name, proposalTitle }) =>
  sendMail(
    email,
    `Final Paper Submitted — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Final Paper Submitted</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["Paper Title", proposalTitle],
        ["Status", "Awaiting Review"],
        ["Stage", "Final Paper"],
      ])}
    `),
    PORTAL_NAME,
  );

exports.sendProposalApproved = ({ email, name, proposalTitle, stage, reviewerComment }) => {
  const stageLabels = {
    proposal:    "Stage 1 — Proposal",
    final_paper: "Stage 3 — Final Paper",
  };
  const nextSteps = {
    proposal:
      "You may now proceed to submit your <strong>Final Paper (Stage 3)</strong>.",
    final_paper:
      "Your research is now published on the public research portal. Congratulations!",
  };
  const stageLabel = stageLabels[stage] || stage;
  return sendMail(
    email,
    `${stageLabel} Approved — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">${stageLabel} Approved</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">Congratulations! Your submission has been approved.</p>
      ${detailTable([
        ["Title", proposalTitle],
        ["Stage", stageLabel],
        ["Status", "Approved"],
      ])}
      ${reviewerComment ? `
      <div style="background:#f3f4f6;padding:16px;border-left:4px solid #6b7280;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#374151;font-weight:bold;margin:0 0 6px;">Reviewer Comment:</p>
        <p style="color:#374151;margin:0;line-height:1.7;">${reviewerComment}</p>
      </div>` : ""}
      <p style="color:#374151;line-height:1.7;">${nextSteps[stage] || ""}</p>
    `),
    PORTAL_NAME,
  );
};

exports.sendRevisionRequested = ({ email, name, proposalTitle, stage, reviewerComment }) => {
  const stageLabels = {
    proposal:    "Stage 1 — Proposal",
    final_paper: "Stage 3 — Final Paper",
  };
  return sendMail(
    email,
    `Revision Requested — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#C75B00;margin-top:0;">Revision Requested</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["Title", proposalTitle],
        ["Stage", stageLabels[stage] || stage],
        ["Status", "Needs Revision"],
      ])}
      <div style="background:#FFF7ED;padding:16px;border-left:4px solid #C75B00;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#92400e;font-weight:bold;margin:0 0 6px;">Reviewer Feedback:</p>
        <p style="color:#78350f;margin:0;line-height:1.7;">${reviewerComment}</p>
      </div>
      <p style="color:#374151;line-height:1.7;">
        Please address the feedback and resubmit. Resubmissions are <strong>free of charge</strong>.
      </p>
    `),
    PORTAL_NAME,
  );
};

exports.sendProposalRejected = ({ email, name, proposalTitle, stage, reviewerComment }) =>
  sendMail(
    email,
    `Submission Not Accepted — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#B91C1C;margin-top:0;">Submission Not Accepted</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["Title", proposalTitle],
        ["Stage", stage],
        ["Status", "Not Accepted"],
      ])}
      ${reviewerComment ? `
      <div style="background:#FEF2F2;padding:16px;border-left:4px solid #B91C1C;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#991b1b;font-weight:bold;margin:0 0 6px;">Reviewer Feedback:</p>
        <p style="color:#7f1d1d;margin:0;line-height:1.7;">${reviewerComment}</p>
      </div>` : ""}
    `),
    PORTAL_NAME,
  );

exports.sendNewProposalToReview = ({
  email, name, proposalTitle, researcherName, stage, discipline, reviewLink,
}) =>
  sendMail(
    email,
    `New Submission for Review — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1A3C6E;margin-top:0;">New Submission Assigned to You</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["Title", proposalTitle],
        ["Researcher", researcherName],
        ["Discipline", discipline || "Not specified"],
        ["Stage", stage === "proposal" ? "Stage 1 — Proposal" : "Stage 3 — Final Paper"],
      ])}
      ${btn(reviewLink, "Review Submission", "#1A3C6E")}
    `),
    PORTAL_NAME,
  );

exports.sendResubmissionNotice = ({
  email, reviewerName, proposalTitle, researcherName, reviewLink,
}) =>
  sendMail(
    email,
    `Resubmission Received — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#C75B00;margin-top:0;">Resubmission Received</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${reviewerName}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        <strong>${researcherName}</strong> has resubmitted after addressing your feedback.
      </p>
      ${detailTable([
        ["Title", proposalTitle],
        ["Researcher", researcherName],
      ])}
      ${btn(reviewLink, "Review Resubmission", "#C75B00")}
    `),
    PORTAL_NAME,
  );

exports.sendProgressSubmitted = ({ email, name, proposalTitle }) =>
  sendMail(
    email,
    `Progress Report Submitted — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Progress Report Submitted</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Your progress report has been received and is now awaiting reviewer evaluation.
      </p>
      ${detailTable([
        ["Study Title", proposalTitle],
        ["Stage", "Stage 2 — Progress Report"],
        ["Status", "Under Review"],
      ])}
    `),
    PORTAL_NAME,
  );

exports.sendStudyReactivated = ({ email, name, proposalTitle, reason }) =>
  sendMail(
    email,
    `Study Reactivated — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Your Study Has Been Reactivated</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Your study, previously suspended, has been reactivated by the Research Committee.
      </p>
      ${detailTable([
        ["Study Title", proposalTitle],
        ["Status", "Reactivated"],
      ])}
      <div style="background:#f3f4f6;padding:16px;border-left:4px solid #6b7280;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#374151;font-weight:bold;margin:0 0 6px;">Reason for Reactivation:</p>
        <p style="color:#374151;margin:0;line-height:1.7;">${reason}</p>
      </div>
      <p style="color:#374151;line-height:1.7;">Please proceed with your next required submission.</p>
    `),
    PORTAL_NAME,
  );

exports.sendPaymentConfirmation = ({ email, name, mpesaReceipt, amount, purpose }) =>
  sendMail(
    email,
    `Payment Confirmed — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Payment Confirmed ✓</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["M-Pesa Receipt", mpesaReceipt],
        ["Amount", `KES ${amount}`],
        ["Purpose", purpose],
        ["Date", new Date().toLocaleDateString("en-KE", { dateStyle: "full" })],
      ])}
    `),
    PORTAL_NAME,
  );

exports.sendDownloadReceipt = ({
  email, name, proposalTitle, mpesaReceipt, amount, downloadLink,
}) =>
  sendMail(
    email,
    `Download Receipt — ${proposalTitle}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Your Download Receipt</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name || "Valued Customer"}</strong>,</p>
      ${detailTable([
        ["Paper Title", proposalTitle],
        ["M-Pesa Receipt", mpesaReceipt],
        ["Amount Paid", `KES ${amount}`],
        ["Date", new Date().toLocaleDateString("en-KE")],
      ])}
      ${btn(downloadLink, "Download Paper Now", "#1E7B45")}
      <p style="color:#9ca3af;font-size:12px;margin-top:16px;">
        This download link is valid for 15 minutes.
      </p>
    `),
    PORTAL_NAME,
  );

// ─── REVIEWER EMAILS ─────────────────────────────────────────────────────────

exports.sendReviewerInvite = ({ email, name, inviteLink, invitedBy }) =>
  sendMail(
    email,
    `You're Invited as a Reviewer — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1A3C6E;margin-top:0;">You've Been Invited as a Reviewer</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        <strong>${invitedBy}</strong> has invited you to join ${PORTAL_NAME} as a <strong>Reviewer</strong>.
      </p>
      <div style="background:#EFF6FF;padding:16px 20px;border-left:4px solid #3B82F6;
                  border-radius:0 6px 6px 0;margin:20px 0;">
        <p style="color:#1e40af;font-weight:bold;margin:0 0 6px;">Important</p>
        <p style="color:#1e40af;margin:0;">
          This invitation expires in <strong>72 hours</strong>. Please set your password promptly.
        </p>
      </div>
      ${btn(inviteLink, "Set Password & Activate Account", "#3B82F6")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${inviteLink}" style="color:#3B82F6;word-break:break-all;font-size:11px;">${inviteLink}</a>
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendReviewerPromoted = ({ email, name, promotedBy }) =>
  sendMail(
    email,
    `You're Now a Reviewer — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">You've Been Promoted to Reviewer</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Congratulations! Your account has been upgraded to <strong>Reviewer</strong> status
        by <strong>${promotedBy}</strong>.
      </p>
      ${btn(`${FRONTEND_URL}/hmis`, "Go to Reviewer Dashboard", "#1E7B45")}
    `),
    PORTAL_NAME,
  );

exports.sendReviewerRevoked = ({ email, name, revokedBy }) =>
  sendMail(
    email,
    `Reviewer Access Revoked — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#B91C1C;margin-top:0;">Reviewer Access Revoked</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Your reviewer access on ${PORTAL_NAME} has been revoked by <strong>${revokedBy}</strong>.
        You retain your researcher account and may continue submitting your own research.
      </p>
      <p style="color:#374151;line-height:1.7;">
        If you believe this was a mistake, please contact the research administration office.
      </p>
    `),
    PORTAL_NAME,
  );

// ─── COMMITTEE EMAILS ────────────────────────────────────────────────────────

exports.sendCommitteeInvite = ({ email, name, inviteLink, invitedBy }) =>
  sendMail(
    email,
    `You're Invited as a Research Committee Member — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1A3C6E;margin-top:0;">You've Been Invited as a Committee Member</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        <strong>${invitedBy}</strong> has invited you to join ${PORTAL_NAME} as a <strong>Committee Member</strong>.
      </p>
      <div style="background:#EFF6FF;padding:16px 20px;border-left:4px solid #3B82F6;
                  border-radius:0 6px 6px 0;margin:20px 0;">
        <p style="color:#1e40af;font-weight:bold;margin:0 0 6px;">Important</p>
        <p style="color:#1e40af;margin:0;">
          This invitation expires in <strong>72 hours</strong>. Please set your password promptly.
        </p>
      </div>
      ${btn(inviteLink, "Set Password & Activate Account", "#3B82F6")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${inviteLink}" style="color:#3B82F6;word-break:break-all;font-size:11px;">${inviteLink}</a>
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendCommitteePromoted = ({ email, name, promotedBy }) =>
  sendMail(
    email,
    `You're Now a Research Committee Member — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">You've Been Promoted to the Research Committee</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Congratulations! Your account has been upgraded to <strong>Research Committee</strong> status
        by <strong>${promotedBy}</strong>.
      </p>
      ${btn(`${FRONTEND_URL}/hmis`, "Go to Committee Dashboard", "#1E7B45")}
    `),
    PORTAL_NAME,
  );

exports.sendCommitteeRevoked = ({ email, name, revokedBy }) =>
  sendMail(
    email,
    `Research Committee Access Revoked — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#B91C1C;margin-top:0;">Research Committee Access Revoked</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Your research committee access on ${PORTAL_NAME} has been revoked by <strong>${revokedBy}</strong>.
        You retain your reviewer account and may continue reviewing research papers.
      </p>
      <p style="color:#374151;line-height:1.7;">
        If you believe this was a mistake, please contact the research administration office.
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendFinalPaperForwardedToCommittee = ({ email, name, proposalTitle }) =>
  sendMail(
    email,
    `Final Paper Forwarded to the Research Committee — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">Final Paper Forwarded to Committee</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      ${detailTable([
        ["Paper Title", proposalTitle],
        ["Status", "Awaiting research committee review"],
        ["Stage", "Final Paper"],
      ])}
    `),
    PORTAL_NAME,
  );
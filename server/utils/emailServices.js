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

// INTERNAL SEND HELPER — used by ALL email functions below

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

// RESEARCH PORTAL — email shell & component helpers

const PORTAL_NAME = "Nyahururu Research Portal";
const PORTAL_YEAR = new Date().getFullYear();
const SUPPORT_EMAIL = process.env.EMAIL_USER || "support@ncrh.ac.ke";

const shell = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PORTAL_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#1A3C6E;padding:24px 32px;">
          <p style="margin:0;color:#BFD7F0;font-size:13px;font-weight:bold;
                    letter-spacing:1px;text-transform:uppercase;">${PORTAL_NAME}</p>
        </td>
      </tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;text-align:center;">
            This is an automated message from ${PORTAL_NAME}.<br/>
            © ${PORTAL_YEAR} N.C.R.H — Healthcare Management System. All rights reserved.<br/>
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#6b7280;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const btn = (url, label, color = "#2E75B6") => `
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

// LEGACY HMIS EMAILS

exports.testEmail = async (email) => {
  return sendMail(
    email,
    "Test Email - Healthcare Management System",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
       <h2 style="color:#333;">Test Email</h2>
       <p>If you received this email, your email service is working correctly!</p>
     </div>`,
  );
};

exports.sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${process.env.FRONTEND_URL}verify-email?token=${token}&userId=${userId}`;
  return sendMail(
    email,
    "Email Verification - Nyahururu Healthcare Management System",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#2196F3;margin-top:0;">Email Verification</h2>
          <p style="color:#555;line-height:1.6;">Dear User,</p>
         <p style="color:#555;line-height:1.6;">
           An account has been created for you. Please verify your email address by clicking the button below:
         </p>
         <div style="margin:30px 0;text-align:center;">
           <a href="${verificationUrl}"
              style="display:inline-block;padding:12px 30px;background-color:#4CAF50;
                     color:white;text-decoration:none;border-radius:5px;font-weight:bold;">
             Verify Email
           </a>
         </div>
         <p style="color:#666;font-size:12px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;">
           <strong>Or copy this link:</strong><br/>
           <a href="${verificationUrl}" style="color:#2196F3;word-break:break-all;">${verificationUrl}</a>
         </p>
         <p style="color:#999;font-size:11px;margin-top:20px;">
           This link will expire in 24 hours. If you didn't create this account, please ignore this email.
         </p>
       </div>
     </div>`,
  );
};

// HMIS password reset — signature: (email, token, userId)
exports.sendHmisPasswordResetEmail = async (email, token, userId) => {
  const resetUrl = `${process.env.FRONTEND_URL}reset-password?token=${token}&userId=${userId}`;
  return sendMail(
    email,
    "Password Reset Request - Nyahururu Healthcare Management System",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#2196F3;margin-top:0;">Password Reset Request</h2>
         <p style="color:#555;line-height:1.6;">
           You requested to reset your password. Click the button below to proceed:
         </p>
         <div style="margin:30px 0;text-align:center;">
           <a href="${resetUrl}"
              style="display:inline-block;padding:12px 30px;background-color:#2196F3;
                     color:white;text-decoration:none;border-radius:5px;font-weight:bold;">
             Reset Password
           </a>
         </div>
         <p style="color:#666;font-size:12px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;">
           <strong>Or copy this link:</strong><br/>
           <a href="${resetUrl}" style="color:#2196F3;word-break:break-all;">${resetUrl}</a>
         </p>
         <p style="color:#999;font-size:11px;margin-top:20px;">
           This link will expire in 1 hour. If you didn't request this, please ignore this email.
         </p>
       </div>
     </div>`,
  );
};

exports.sendNewPasswordEmail = async (email, password) => {
  const loginUrl = `${process.env.FRONTEND_URL}login`;
  return sendMail(
    email,
    "Your New Password - NyahururuHealthcare Management System",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#4CAF50;margin-top:0;">Email Verified Successfully!</h2>
         <p style="color:#555;line-height:1.6;">Your email has been verified. Your temporary password is:</p>
         <div style="margin:30px 0;padding:15px;background-color:#fff;
                     border:2px solid #4CAF50;border-radius:5px;text-align:center;">
           <p style="font-size:24px;font-weight:bold;color:#4CAF50;
                     letter-spacing:3px;margin:0;font-family:monospace;">${password}</p>
         </div>
         <p style="color:#d32f2f;font-weight:bold;background-color:#ffebee;
                   padding:10px;border-radius:4px;">
           Please change this password immediately after logging in for your security.
         </p>
         <div style="margin:30px 0;text-align:center;">
           <a href="${loginUrl}"
              style="display:inline-block;padding:12px 30px;background-color:#4CAF50;
                     color:white;text-decoration:none;border-radius:5px;font-weight:bold;">
             Login Now
           </a>
         </div>
         <p style="color:#999;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;">
           If you didn't verify this email, please contact support immediately.
         </p>
       </div>
     </div>`,
  );
};

exports.sendAccountNotificationEmail = async (email, subject, message) => {
  return sendMail(
    email,
    subject,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#2196F3;margin-top:0;">Account Notification</h2>
         <p style="color:#555;line-height:1.6;">${message}</p>
         <p style="color:#999;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;">
           If you did not perform this action, please contact support immediately.
         </p>
       </div>
     </div>`,
  );
};

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
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#4CAF50;margin-top:0;">Appointment Booked Successfully!</h2>
         <p style="color:#555;line-height:1.6;">Dear ${patientName},</p>
         <p style="color:#555;line-height:1.6;">
           Your appointment has been received and is pending confirmation from our medical team.
         </p>
         <div style="background-color:#fff;padding:20px;border-radius:8px;
                     margin:20px 0;border-left:4px solid #4CAF50;">
           <h3 style="color:#333;margin-top:0;">Appointment Details:</h3>
           <table style="width:100%;border-collapse:collapse;">
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Service:</td>
               <td style="padding:8px 0;color:#333;">${service}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Date:</td>
               <td style="padding:8px 0;color:#333;">${formattedDate}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Time:</td>
               <td style="padding:8px 0;color:#333;">${time}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Contact:</td>
               <td style="padding:8px 0;color:#333;">${phone || "N/A"}</td>
             </tr>
           </table>
         </div>
         <p style="color:#999;font-size:11px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;">
           If you need to reschedule or cancel, please contact us as soon as possible.
         </p>
       </div>
     </div>`,
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
    color: "#2196F3",
    text: status,
    msg: `Your appointment status has been updated to: ${status}`,
  };

  return sendMail(
    email,
    `Appointment ${text}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:${color};margin-top:0;">Appointment ${text}</h2>
         <p style="color:#555;line-height:1.6;">Dear ${patientName},</p>
         <p style="color:#555;line-height:1.6;">${msg}</p>
         <div style="background-color:#fff;padding:20px;border-radius:8px;
                     margin:20px 0;border-left:4px solid ${color};">
           <h3 style="color:#333;margin-top:0;">Appointment Details:</h3>
           <table style="width:100%;border-collapse:collapse;">
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Service:</td>
               <td style="padding:8px 0;color:#333;">${service}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Date:</td>
               <td style="padding:8px 0;color:#333;">${formattedDate}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Time:</td>
               <td style="padding:8px 0;color:#333;">${time}</td>
             </tr>
             <tr>
               <td style="padding:8px 0;color:#666;font-weight:bold;">Status:</td>
               <td style="padding:8px 0;color:${color};font-weight:bold;">${text}</td>
             </tr>
           </table>
         </div>
       </div>
     </div>`,
  );
};

exports.sendFeedbackReplyEmail = async (
  email,
  userName,
  originalMessage,
  replyMessage,
) => {
  return sendMail(
    email,
    "Response to Your Feedback - Healthcare Management System",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <h2 style="color:#2196F3;margin-top:0;">Thank You for Your Feedback!</h2>
         <p style="color:#555;line-height:1.6;">Dear ${userName || "User"},</p>
         <div style="background-color:#fff;padding:15px;border-radius:8px;
                     margin:20px 0;border-left:4px solid #e0e0e0;">
           <p style="color:#666;font-size:13px;margin:0 0 5px 0;"><strong>Your Message:</strong></p>
           <p style="color:#333;margin:0;">${originalMessage}</p>
         </div>
         <div style="background-color:#e3f2fd;padding:15px;border-radius:8px;
                     margin:20px 0;border-left:4px solid #2196F3;">
           <p style="color:#1976d2;font-size:13px;margin:0 0 5px 0;"><strong>Our Response:</strong></p>
           <p style="color:#333;margin:0;">${replyMessage}</p>
         </div>
       </div>
     </div>`,
  );
};

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
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
       <div style="background-color:#f9f9f9;padding:20px;border-radius:8px;">
         <p style="color:#333;font-size:16px;">Dear <strong style="color:#e53935;">${fullName}</strong>,</p>
         <p style="color:#555;line-height:1.6;">
           Your blood donation registration has been received successfully.
         </p>
         <div style="background:linear-gradient(135deg,#fff5f5 0%,#ffebee 100%);
                     padding:20px;border-radius:8px;margin:25px 0;border-left:5px solid #e53935;">
           <h3 style="color:#c62828;margin:0 0 15px;">Appointment Details</h3>
           <p style="color:#666;font-size:13px;margin:0 0 4px;"><strong>Date:</strong></p>
           <p style="color:#333;margin:0 0 12px;">${formattedDate}</p>
           <p style="color:#666;font-size:13px;margin:0 0 4px;"><strong>Time:</strong></p>
           <p style="color:#333;margin:0 0 12px;">${donationTime}</p>
           <p style="color:#666;font-size:13px;margin:0 0 4px;"><strong>Phone:</strong></p>
           <p style="color:#333;margin:0;">${phone || "Not provided"}</p>
         </div>
         <p style="color:#999;font-size:11px;margin-top:30px;padding-top:20px;
                   border-top:1px solid #ddd;text-align:center;">
           © ${new Date().getFullYear()} N.C.R.H - Healthcare Management System.
         </p>
       </div>
     </div>`,
  );
};

// RESEARCH PORTAL EMAILS

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
      ${btn(verifyLink, "Verify Email Address", "#2E75B6")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${verifyLink}" style="color:#2E75B6;word-break:break-all;font-size:11px;">${verifyLink}</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
      </p>
    `),
    PORTAL_NAME,
  );

// Research Portal password reset
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
        <a href="${resetLink}" style="color:#2E75B6;word-break:break-all;font-size:11px;">${resetLink}</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        This link expires in 24 hours. If you did not request a reset, please ignore this email.
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendAdminAddedResearcher = ({ email, name, password }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/research/login`;
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
      <div style="background:#EFF6FF;padding:16px 20px;border-left:4px solid #2E75B6;
                  border-radius:0 6px 6px 0;margin:20px 0;">
        <p style="color:#1e40af;font-weight:bold;margin:0 0 6px;">Important</p>
        <p style="color:#1e40af;margin:0;">
          This invitation expires in <strong>72 hours</strong>. Please set your password promptly.
        </p>
      </div>
      ${btn(inviteLink, "Set Password & Activate Account", "#2E75B6")}
      <p style="color:#6b7280;font-size:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
        <strong>Or copy this link:</strong><br/>
        <a href="${inviteLink}" style="color:#2E75B6;word-break:break-all;font-size:11px;">${inviteLink}</a>
      </p>
    `),
    PORTAL_NAME,
  );

exports.sendReviewerPromoted = ({ email, name, promotedBy }) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/hmis`;
  return sendMail(
    email,
    `You're Now a Reviewer — ${PORTAL_NAME}`,
    shell(`
      <h2 style="color:#1E7B45;margin-top:0;">You've Been Promoted to Reviewer</h2>
      <p style="color:#374151;line-height:1.7;">Dear <strong>${name}</strong>,</p>
      <p style="color:#374151;line-height:1.7;">
        Congratulations! Your account has been upgraded to <strong>Reviewer</strong> status
        by <strong>${promotedBy}</strong>.
      </p>
      ${btn(dashboardUrl, "Go to Reviewer Dashboard", "#1E7B45")}
    `),
    PORTAL_NAME,
  );
};

exports.sendProposalSubmitted = ({
  email,
  name,
  proposalTitle,
  mpesaReceipt,
  amount,
}) =>
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

exports.sendProposalApproved = ({
  email,
  name,
  proposalTitle,
  stage,
  reviewerComment,
}) => {
  const stageLabels = {
    proposal: "Stage 1 — Proposal",
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
      ${
        reviewerComment
          ? `
      <div style="background:#f3f4f6;padding:16px;border-left:4px solid #6b7280;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#374151;font-weight:bold;margin:0 0 6px;">Reviewer Comment:</p>
        <p style="color:#374151;margin:0;line-height:1.7;">${reviewerComment}</p>
      </div>`
          : ""
      }
      <p style="color:#374151;line-height:1.7;">${nextSteps[stage] || ""}</p>
    `),
    PORTAL_NAME,
  );
};

exports.sendRevisionRequested = ({
  email,
  name,
  proposalTitle,
  stage,
  reviewerComment,
}) => {
  const stageLabels = {
    proposal: "Stage 1 — Proposal",
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

exports.sendProposalRejected = ({
  email,
  name,
  proposalTitle,
  stage,
  reviewerComment,
}) =>
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
      ${
        reviewerComment
          ? `
      <div style="background:#FEF2F2;padding:16px;border-left:4px solid #B91C1C;
                  border-radius:0 6px 6px 0;margin:16px 0;">
        <p style="color:#991b1b;font-weight:bold;margin:0 0 6px;">Reviewer Feedback:</p>
        <p style="color:#7f1d1d;margin:0;line-height:1.7;">${reviewerComment}</p>
      </div>`
          : ""
      }
    `),
    PORTAL_NAME,
  );

exports.sendNewProposalToReview = ({
  email,
  name,
  proposalTitle,
  researcherName,
  stage,
  discipline,
  reviewLink,
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
        [
          "Stage",
          stage === "proposal" ? "Stage 1 — Proposal" : "Stage 3 — Final Paper",
        ],
      ])}
      ${btn(reviewLink, "Review Submission", "#1A3C6E")}
    `),
    PORTAL_NAME,
  );

exports.sendResubmissionNotice = ({
  email,
  reviewerName,
  proposalTitle,
  researcherName,
  reviewLink,
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

exports.sendPaymentConfirmation = ({
  email,
  name,
  mpesaReceipt,
  amount,
  purpose,
}) =>
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
  email,
  name,
  proposalTitle,
  mpesaReceipt,
  amount,
  downloadLink,
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

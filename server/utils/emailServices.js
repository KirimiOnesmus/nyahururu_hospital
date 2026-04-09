const nodemailer = require("nodemailer");

// Configure your email service with error checking
let transporter;

const initializeTransporter = async () => {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log("Email transporter verified successfully");
    return true;
  } catch (error) {
    console.error("Failed to verify email transporter:", error);
    return false;
  }
};

// Initialize transporter on startup
initializeTransporter();

exports.testEmail = async (email) => {
  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Test Email - Healthcare Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>If you received this email, your email service is working correctly!</p>
        </div>
      `,
    });

    console.log("Test email sent:", result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending test email:", error);
    throw error;
  }
};

exports.sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${process.env.FRONTEND_URL}verify-email?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification - Healthcare Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2196F3; margin-top: 0;">Email Verification</h2>
          <p style="color: #555; line-height: 1.6;">Thank you for registering. Please verify your email address by clicking the button below:</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>Or copy this link:</strong><br/>
            <a href="${verificationUrl}" style="color: #2196F3; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (email, token, userId) => {
  const resetUrl = `${process.env.FRONTEND_URL}reset-password?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request - Healthcare Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2196F3; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6;">You requested to reset your password. Click the button below to proceed:</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #2196F3; 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>Or copy this link:</strong><br/>
            <a href="${resetUrl}" style="color: #2196F3; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Password reset email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

exports.sendNewPasswordEmail = async (email, password, userId) => {
  const loginUrl = `${process.env.FRONTEND_URL}login`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your New Password - Healthcare Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50; margin-top: 0;">Email Verified Successfully!</h2>
          <p style="color: #555; line-height: 1.6;">Your email has been verified. Your temporary password is:</p>
          
          <div style="margin: 30px 0; padding: 15px; background-color: #fff; border: 2px solid #4CAF50; border-radius: 5px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; color: #4CAF50; letter-spacing: 3px; margin: 0; font-family: monospace;">
              ${password}
            </p>
          </div>
          
          <p style="color: #d32f2f; font-weight: bold; background-color: #ffebee; padding: 10px; border-radius: 4px;">
            ⚠️ Please change this password immediately after logging in for your security.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${loginUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login Now
            </a>
          </div>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you didn't verify this email, please contact support immediately.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`New password email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending new password email:", error);
    throw error;
  }
};

exports.sendAccountNotificationEmail = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2196F3; margin-top: 0;">Account Notification</h2>
          <p style="color: #555; line-height: 1.6;">${message}</p>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you did not perform this action, please contact support immediately.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Notification email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw error;
  }
};

// Appointment booking Notification

exports.sendAppointmentConfirmationEmail = async (appointmentData) => {
  const { patientName, patientEmail, service, appointmentDate, time, phone } =
    appointmentData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: "Appointment Booking Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50; margin-top: 0;">✅ Appointment Booked Successfully!</h2>
          
          <p style="color: #555; line-height: 1.6;">Dear ${patientName},</p>
          <p style="color: #555; line-height: 1.6;">
            Your appointment has been received and is pending confirmation from our medical team.
          </p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #333; margin-top: 0;">Appointment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0; color: #333;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(
                  appointmentDate
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Contact:</td>
                <td style="padding: 8px 0; color: #333;">${phone || "N/A"}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            You will receive a confirmation email once your appointment has been reviewed by our staff.
          </p>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you need to reschedule or cancel, please contact us as soon as possible.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Appointment confirmation sent to patient ${patientEmail}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending appointment confirmation email:", error);
    throw error;
  }
};

exports.sendAppointmentStatusUpdateEmail = async (
  email,
  appointmentData,
  status
) => {
  const { patientName, service, appointmentDate, time } = appointmentData;

  let statusColor, statusText, statusMessage;

  switch (status) {
    case "confirmed":
      statusColor = "#4CAF50";
      statusText = "Confirmed";
      statusMessage =
        "Your appointment has been confirmed by our medical team.";
      break;
    case "cancelled":
      statusColor = "#f44336";
      statusText = "Cancelled";
      statusMessage =
        "Your appointment has been cancelled. Please contact us if you need to reschedule.";
      break;
    case "rescheduled":
      statusColor = "#ff9800";
      statusText = "Rescheduled";
      statusMessage =
        "Your appointment has been rescheduled. Please check the new details below.";
      break;
    default:
      statusColor = "#2196F3";
      statusText = status;
      statusMessage = `Your appointment status has been updated to: ${status}`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Appointment ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: ${statusColor}; margin-top: 0;">Appointment ${statusText}</h2>
          
          <p style="color: #555; line-height: 1.6;">Dear ${patientName},</p>
          <p style="color: #555; line-height: 1.6;">${statusMessage}</p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <h3 style="color: #333; margin-top: 0;">Appointment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0; color: #333;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(
                  appointmentDate
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; color: ${statusColor}; font-weight: bold;">${statusText}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you have any questions, please contact us.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Status update email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending status update email:", error);
    throw error;
  }
};

// feedback handling email
exports.sendFeedbackReplyEmail = async (
  email,
  userName,
  originalMessage,
  replyMessage
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Response to Your Feedback - Healthcare Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2196F3; margin-top: 0;">Thank You for Your Feedback!</h2>
          
          <p style="color: #555; line-height: 1.6;">Dear ${
            userName || "User"
          },</p>
          <p style="color: #555; line-height: 1.6;">
            We have reviewed your feedback and would like to respond:
          </p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e0e0e0;">
            <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;"><strong>Your Message:</strong></p>
            <p style="color: #333; margin: 0;">${originalMessage}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <p style="color: #1976d2; font-size: 13px; margin: 0 0 5px 0;"><strong>Our Response:</strong></p>
            <p style="color: #333; margin: 0;">${replyMessage}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We appreciate you taking the time to share your thoughts with us. If you have any further questions or concerns, please don't hesitate to reach out.
          </p>
          
          <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            This is an automated response to your feedback submission. Please do not reply to this email directly.
          </p>
        </div>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`Feedback reply sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending feedback reply email:", error);
    throw error;
  }
};

// blood donation

exports.sendDonorRegistrationEmail = async (donorData) => {
  const { fullName, email, donationDate, donationTime, phone } = donorData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject:
      "Blood Donation Registration Confirmation - Thank You for Saving Lives!",
    html: `

        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
    

    <p style="color: #333; line-height: 1.6; font-size: 16px;">
      Dear <strong style="color: #e53935;">${fullName}</strong>,
    </p>
    
    <p style="color: #555; line-height: 1.6;">
      Your blood donation registration has been received successfully. Your willingness to donate blood 
      is a gift of life that will help save lives in our community. We deeply appreciate your commitment!
    </p>
    

    <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #e53935;">
      <h3 style="color: #c62828; margin: 0 0 15px 0; font-size: 18px;">📋 Appointment Details</h3>
      
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #ffcdd2;">
        <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;"><strong>📅 Scheduled Date:</strong></p>
        <p style="color: #333; margin: 0; font-size: 15px;">${new Date(
          donationDate
        ).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</p>
      </div>
      
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #ffcdd2;">
        <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;"><strong>⏰ Scheduled Time:</strong></p>
        <p style="color: #333; margin: 0; font-size: 15px;">${donationTime}</p>
      </div>
      
      <div>
        <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;"><strong>📞 Contact Phone:</strong></p>
        <p style="color: #333; margin: 0; font-size: 15px;">${
          phone || "Not provided"
        }</p>
      </div>
    </div>
    
 
    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #2196F3;">
      <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">💡 Preparation Tips</h3>
      
      <div style="margin-bottom: 10px;">
        <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.6;">
          <span style="color: #2196F3; font-weight: bold;">✓</span> Get a good night's sleep before donation
        </p>
      </div>
      
      <div style="margin-bottom: 10px;">
        <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.6;">
          <span style="color: #2196F3; font-weight: bold;">✓</span> Eat a healthy meal and stay well-hydrated
        </p>
      </div>
      
      <div style="margin-bottom: 10px;">
        <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.6;">
          <span style="color: #2196F3; font-weight: bold;">✓</span> Avoid fatty foods for 24 hours before donation
        </p>
      </div>
      
      <div style="margin-bottom: 10px;">
        <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.6;">
          <span style="color: #2196F3; font-weight: bold;">✓</span> Bring a valid ID
        </p>
      </div>
      
      <div>
        <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.6;">
          <span style="color: #2196F3; font-weight: bold;">✓</span> Wear comfortable clothing with sleeves that can be rolled up
        </p>
      </div>
    </div>
    

    <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; border: 2px dashed #e0e0e0; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: 600;">
        Questions or Need to Reschedule?
      </p>
      <p style="margin: 0; color: #333; font-size: 15px;">
        Contact us: 
        <a href="mailto:${
          process.env.EMAIL_USER
        }" style="color: #e53935; text-decoration: none; font-weight: 600;">
          ${process.env.EMAIL_USER}
        </a>
      </p>
    </div>

    <p style="color: #999; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; line-height: 1.5;">
      This is an automated confirmation email. Please do not reply directly to this message.<br/>
      © ${new Date().getFullYear()} N.C.R.H - Healthcare Management System. All rights reserved.
    </p>
    
  </div>
</div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Donor registration confirmation sent to ${email}:`,
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending donor registration email:", error);
    throw error;
  }
};




// RESEARCHER EMAILS
const shell = (content, title = "Nyahururu Research Portal") => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
    ${content}
    <p style="color: #999; font-size: 11px; margin-top: 20px; padding-top: 20px;
       border-top: 1px solid #ddd; text-align: center; line-height: 1.5;">
      This is an automated message from the ${title}.<br/>
      © ${new Date().getFullYear()} N.C.R.H — Healthcare Management System. All rights reserved.
    </p>
  </div>
</div>`;
 
//Helper to create button
 
const btn = (url, label, color = "#2196F3") => `
<div style="margin: 30px 0; text-align: center;">
  <a href="${url}"
     style="display: inline-block; padding: 12px 30px; background-color: ${color};
            color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
    ${label}
  </a>
</div>`;
 
// Helper to send email

const sendMail = async (to, subject, html) => {
  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized");
    }
 
    const result = await transporter.sendMail({
      from: `"Nyahururu Research Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
 
    console.log(`[Email] ${subject} → ${to} (${result.messageId})`);
    return result;
  } catch (error) {
    console.error(`[Email] Error sending ${subject}:`, error);
    throw error;
  }
};
  
 
exports.sendResearcherVerificationEmail = async ({
  email,
  name,
  verifyLink,
}) => {
  const html = shell(`
    <h2 style="color: #2196F3; margin-top: 0;">Verify Your Email</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Thank you for registering with Nyahururu Research Portal.
      Please verify your email address to complete your account setup.
    </p>
    ${btn(verifyLink, "Verify Email Address", "#2196F3")}
    <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
      <strong>Or copy this link:</strong><br/>
      <a href="${verifyLink}" style="color: #2196F3; word-break: break-all; font-size: 11px;">${verifyLink}</a>
    </p>
    <p style="color: #999; font-size: 11px; margin-top: 15px;">
      This link expires in 24 hours. If you didn't create this account, please ignore this email.
    </p>
  `);
 
  return sendMail(email, "Verify Your Email — Nyahururu Research Portal", html);
};
 
// Send password reset email

exports.sendPasswordResetEmail = async ({
  email,
  name,
  resetLink,
}) => {
  const html = shell(`
    <h2 style="color: #f44336; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      You requested to reset your password. Click the button below to proceed.
    </p>
    ${btn(resetLink, "Reset Your Password", "#f44336")}
    <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
      <strong>Or copy this link:</strong><br/>
      <a href="${resetLink}" style="color: #2196F3; word-break: break-all; font-size: 11px;">${resetLink}</a>
    </p>
    <p style="color: #999; font-size: 11px; margin-top: 15px;">
      This link expires in 24 hours. If you didn't request this, please ignore this email.
    </p>
  `);
 
  return sendMail(email, "Password Reset Request — Nyahururu Research Portal", html);
};
 
// Send proposal submission confirmation

exports.sendProposalSubmitted = async ({
  email,
  name,
  proposalTitle,
  mpesaReceipt,
  amount,
}) => {
  const html = shell(`
    <h2 style="color: #4CAF50; margin-top: 0;">Proposal Submitted Successfully</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Your research proposal has been submitted successfully and is now under review.
    </p>
    <div style="background-color: #fff; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">Submission Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
          <td style="padding: 8px 0; color: #333;">Under Review</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">M-Pesa Receipt:</td>
          <td style="padding: 8px 0; color: #333;">${mpesaReceipt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount Paid:</td>
          <td style="padding: 8px 0; color: #333;">KES ${amount}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      You will receive an email update once a reviewer has made a decision.
      Resubmissions after a revision request are <strong>completely free</strong>.
    </p>
  `);
 
  return sendMail(email, "Proposal Submitted — Nyahururu Research Portal", html);
};
 
//Send proposal approved notification
 
exports.sendProposalApproved = async ({
  email,
  name,
  proposalTitle,
  stage,
  reviewerComment,
}) => {
  const stageLabel = {
    proposal: "Stage 1 — Proposal",
    abstract: "Stage 2 — Abstract",
    final_paper: "Stage 3 — Final Paper",
  }[stage] || stage;
 
  const nextStep =
    stage === "proposal"
      ? "You may now proceed to submit your <strong>Abstract (Stage 2)</strong>."
      : stage === "abstract"
      ? "You may now proceed to submit your <strong>Final Paper (Stage 3)</strong>."
      : "Your research is now published on the public research portal!";
 
  const html = shell(`
    <h2 style="color: #4CAF50; margin-top: 0;">${stageLabel} Approved</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Congratulations! Your submission has been reviewed and approved.
    </p>
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #2e7d32; margin-top: 0; font-size: 16px;">Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Stage:</td>
          <td style="padding: 8px 0; color: #2e7d32; font-weight: bold;">${stageLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
          <td style="padding: 8px 0; color: #4CAF50; font-weight: bold;">Approved</td>
        </tr>
      </table>
    </div>
    ${
      reviewerComment
        ? `
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #666;">
      <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;"><strong>Reviewer Comments:</strong></p>
      <p style="color: #333; margin: 0; line-height: 1.6;">${reviewerComment}</p>
    </div>`
        : ""
    }
    <p style="color: #555; line-height: 1.6;">
      ${nextStep}
    </p>
  `);
 
  return sendMail(email, `${stageLabel} Approved — Nyahururu Research Portal`, html);
};
 
// Send revision requested notification

exports.sendRevisionRequested = async ({
  email,
  name,
  proposalTitle,
  stage,
  reviewerComment,
}) => {
  const stageLabel = {
    proposal: "Stage 1 — Proposal",
    abstract: "Stage 2 — Abstract",
    final_paper: "Stage 3 — Final Paper",
  }[stage] || stage;
 
  const html = shell(`
    <h2 style="color: #ff9800; margin-top: 0;">Revision Requested</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Your submission has been reviewed. The reviewer has requested some revisions
      before it can be approved.
    </p>
    <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #ff9800;">
      <h3 style="color: #e65100; margin-top: 0; font-size: 16px;">Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Stage:</td>
          <td style="padding: 8px 0; color: #333;">${stageLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
          <td style="padding: 8px 0; color: #ff9800; font-weight: bold;">Needs Revision</td>
        </tr>
      </table>
    </div>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #f44336;">
      <p style="color: #c62828; font-size: 13px; margin: 0 0 5px 0;"><strong>Reviewer Feedback:</strong></p>
      <p style="color: #333; margin: 0; line-height: 1.6;">${reviewerComment}</p>
    </div>
    <p style="color: #555; line-height: 1.6;">
      Please address the reviewer's comments and resubmit.
      <strong style="color: #4CAF50;">Resubmission is completely free</strong> — no additional payment required.
    </p>
  `);
 
  return sendMail(email, `Revision Requested — ${proposalTitle}`, html);
};
 
//Send download receipt

exports.sendDownloadReceipt = async ({
  email,
  name,
  proposalTitle,
  mpesaReceipt,
  amount,
  downloadLink,
}) => {
  const html = shell(`
    <h2 style="color: #4CAF50; margin-top: 0;">Download Receipt</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Your payment has been confirmed. You can now download the research paper.
    </p>
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #2e7d32; margin-top: 0; font-size: 16px;">Receipt Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Paper Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">M-Pesa Receipt:</td>
          <td style="padding: 8px 0; color: #333;">${mpesaReceipt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount Paid:</td>
          <td style="padding: 8px 0; color: #333;">KES ${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString("en-KE")}</td>
        </tr>
      </table>
    </div>
    ${btn(downloadLink, "Download Paper Now", "#4CAF50")}
    <p style="color: #999; font-size: 12px; margin-top: 15px;">
      This download link is valid for 24 hours. If you have trouble downloading,
      please contact support.
    </p>
  `);
 
  return sendMail(email, `Download Receipt — ${proposalTitle}`, html);
};
//REVIEWER EMAILS

 
//Send reviewer invitation (when new reviewer is invited)

exports.sendReviewerInvite = async ({
  email,
  name,
  inviteLink,
  invitedBy,
}) => {
  const html = shell(`
    <h2 style="color: #2196F3; margin-top: 0;">You've Been Invited as a Reviewer</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      <strong>${invitedBy}</strong> has invited you to join the Nyahururu Research Portal
      as a <strong>Reviewer</strong>.
    </p>
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #2196F3;">
      <p style="color: #1565c0; line-height: 1.6;">
        As a reviewer, you will evaluate research proposals, abstracts, and final papers submitted
        by researchers across Central Kenya. Your expertise and feedback are valuable to the research community.
      </p>
    </div>
    <p style="color: #d32f2f; font-weight: bold; background-color: #ffebee;
       padding: 15px; border-radius: 4px; line-height: 1.6;">
      <strong>Important:</strong> This invitation link expires in <strong>72 hours</strong>.
      Please set your password promptly to activate your reviewer account.
    </p>
    ${btn(inviteLink, "Set Password & Activate Account", "#2196F3")}
    <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
      <strong>Or copy this link:</strong><br/>
      <a href="${inviteLink}" style="color: #2196F3; word-break: break-all; font-size: 11px;">${inviteLink}</a>
    </p>
  `);
 
  return sendMail(email, "You're Invited as a Reviewer — Nyahururu Research Portal", html);
};
 
//Send reviewer promotion notification (when existing researcher becomes reviewer)

exports.sendReviewerPromoted = async ({
  email,
  name,
  promotedBy,
}) => {
  const html = shell(`
    <h2 style="color: #4CAF50; margin-top: 0;">✨ You're Now a Reviewer</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Congratulations! Your account has been upgraded to <strong>Reviewer</strong> status
      by <strong>${promotedBy}</strong>.
    </p>
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #2e7d32; margin-top: 0; font-size: 16px;">🎯 What's Next?</h3>
      <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Log in to your dashboard</li>
        <li style="margin-bottom: 8px;">Review pending research submissions</li>
        <li style="margin-bottom: 8px;">Provide constructive feedback to researchers</li>
        <li>Help shape the future of research in Central Kenya</li>
      </ul>
    </div>
    ${btn(`${process.env.FRONTEND_URL}/research/dashboard`, "Go to Reviewer Dashboard", "#4CAF50")}
    <p style="color: #555; line-height: 1.6; margin-top: 20px;">
      Thank you for joining our review team. Your expertise is invaluable!
    </p>
  `);
 
  return sendMail(email, "You're Now a Reviewer — Nyahururu Research Portal", html);
};
 
//Send new proposal assignment notification

exports.sendNewProposalToReview = async ({
  email,
  reviewerName,
  proposalTitle,
  researcherName,
  discipline,
  reviewLink,
}) => {
  const html = shell(`
    <h2 style="color: #2196F3; margin-top: 0;">New Proposal for Review</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${reviewerName}</strong>,<br/>
      A new research proposal has been assigned to you for review.
    </p>
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #2196F3;">
      <h3 style="color: #1565c0; margin-top: 0; font-size: 16px;">Proposal Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold; width: 35%;">Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Researcher:</td>
          <td style="padding: 8px 0; color: #333;">${researcherName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Discipline:</td>
          <td style="padding: 8px 0; color: #333;">${discipline}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      Please review the proposal and provide your feedback. Your thorough evaluation
      helps researchers improve their work and contributes to the research community.
    </p>
    ${btn(reviewLink, "Review Proposal", "#2196F3")}
  `);
 
  return sendMail(email, `New Proposal for Review — ${proposalTitle}`, html);
};
 
//Send resubmission notice (researcher resubmitted after revision request)
 
exports.sendResubmissionNotice = async ({
  email,
  reviewerName,
  proposalTitle,
  researcherName,
  reviewLink,
}) => {
  const html = shell(`
    <h2 style="color: #ff9800; margin-top: 0;">Resubmission Received</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${reviewerName}</strong>,<br/>
      <strong>${researcherName}</strong> has resubmitted their proposal after addressing
      your previous feedback.
    </p>
    <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #ff9800;">
      <h3 style="color: #e65100; margin-top: 0; font-size: 16px;">Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Researcher:</td>
          <td style="padding: 8px 0; color: #333;">${researcherName}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      Please review the revised version and confirm whether the changes address your feedback.
    </p>
    ${btn(reviewLink, "Review Resubmission", "#ff9800")}
  `);
 
  return sendMail(email, `Resubmission Received — ${proposalTitle}`, html);
};
 
//Send review submission confirmation
 
exports.sendReviewCompletedConfirmation = async ({
  email,
  reviewerName,
  proposalTitle,
  decision,
}) => {
  const decisionLabel = {
    approved: "Approved",
    revision: "Revision Requested",
    rejected: "Rejected",
  }[decision] || decision;
 
  const decisionColor = {
    approved: "#4CAF50",
    revision: "#ff9800",
    rejected: "#f44336",
  }[decision] || "#2196F3";
 
  const html = shell(`
    <h2 style="color: ${decisionColor}; margin-top: 0;">Review Submitted</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${reviewerName}</strong>,<br/>
      Thank you for submitting your review. Your feedback has been recorded.
    </p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid ${decisionColor};">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">Review Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Proposal Title:</td>
          <td style="padding: 8px 0; color: #333;">${proposalTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Decision:</td>
          <td style="padding: 8px 0; color: ${decisionColor}; font-weight: bold;">${decisionLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Submitted:</td>
          <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString("en-KE")}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      The researcher will be notified of your decision shortly.
      Thank you for your valuable contribution to the research community!
    </p>
  `);
 
  return sendMail(email, `Review Submitted — ${proposalTitle}`, html);
};
 
// Send monthly reviewer statistics

exports.sendMonthlySummary = async ({
  email,
  reviewerName,
  reviewsCompleted,
  approvalsCount,
  revisionsCount,
  rejectionsCount,
}) => {
  const html = shell(`
    <h2 style="color: #2196F3; margin-top: 0;">Your Monthly Review Summary</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${reviewerName}</strong>,<br/>
      Here's a summary of your review activity this month.
    </p>
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #2196F3;">
      <h3 style="color: #1565c0; margin-top: 0; font-size: 16px;">Statistics</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #666; font-weight: bold; width: 60%;">Total Reviews Completed:</td>
          <td style="padding: 12px 0; color: #1565c0; font-size: 18px; font-weight: bold;">${reviewsCompleted}</td>
        </tr>
        <tr style="border-top: 1px solid #bbdefb;">
          <td style="padding: 12px 0; color: #666;">Approvals:</td>
          <td style="padding: 12px 0; color: #4CAF50; font-weight: bold;">${approvalsCount}</td>
        </tr>
        <tr style="border-top: 1px solid #bbdefb;">
          <td style="padding: 12px 0; color: #666;">Revisions Requested:</td>
          <td style="padding: 12px 0; color: #ff9800; font-weight: bold;">${revisionsCount}</td>
        </tr>
        <tr style="border-top: 1px solid #bbdefb;">
          <td style="padding: 12px 0; color: #666;"> Rejections:</td>
          <td style="padding: 12px 0; color: #f44336; font-weight: bold;">${rejectionsCount}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      Thank you for your continued contribution to the research community.
      Your diligent review work helps maintain the quality of our research portal.
    </p>
  `);
 
  return sendMail(email, `Your Monthly Review Summary — Nyahururu Research Portal`, html);
};
 
//PAYMENT EMAILS

exports.sendPaymentConfirmation = async ({
  email,
  name,
  mpesaReceipt,
  amount,
  purpose,
}) => {
  const html = shell(`
    <h2 style="color: #4CAF50; margin-top: 0;">Payment Confirmed</h2>
    <p style="color: #555; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br/>
      Your M-Pesa payment has been received successfully.
    </p>
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px;
         margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #2e7d32; margin-top: 0; font-size: 16px;">🧾 Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">M-Pesa Receipt:</td>
          <td style="padding: 8px 0; color: #333;">${mpesaReceipt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
          <td style="padding: 8px 0; color: #333;">KES ${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Purpose:</td>
          <td style="padding: 8px 0; color: #333;">${purpose}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString("en-KE")}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; line-height: 1.6;">
      Please keep this receipt for your records.
    </p>
  `);
 
  return sendMail(email, `Payment Confirmed — Nyahururu Research Portal`, html);
};
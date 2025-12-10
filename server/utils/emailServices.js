const nodemailer = require('nodemailer');

// Configure your email service with error checking
let transporter;

const initializeTransporter = async () => {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Failed to verify email transporter:', error);
    return false;
  }
};

// Initialize transporter on startup
initializeTransporter();

exports.testEmail = async (email) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Test Email - Healthcare Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>If you received this email, your email service is working correctly!</p>
        </div>
      `,
    });

    console.log('Test email sent:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

exports.sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${process.env.FRONTEND_URL}verify-email?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Healthcare Management System',
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (email, token, userId) => {
  const resetUrl = `${process.env.FRONTEND_URL}reset-password?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Healthcare Management System',
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Password reset email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

exports.sendNewPasswordEmail = async (email, password, userId) => {
  const loginUrl = `${process.env.FRONTEND_URL}login`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your New Password - Healthcare Management System',
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`New password email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending new password email:', error);
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Notification email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};


// Appointment booking Notification


exports.sendAppointmentConfirmationEmail = async (appointmentData) => {
  const { patientName, patientEmail, service, appointmentDate, time, phone } = appointmentData;

  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: patientEmail,  
    subject: 'Appointment Booking Confirmation',
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
                <td style="padding: 8px 0; color: #333;">${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Contact:</td>
                <td style="padding: 8px 0; color: #333;">${phone || 'N/A'}</td>
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Appointment confirmation sent to patient ${patientEmail}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    throw error;
  }
};

exports.sendAppointmentStatusUpdateEmail = async (email, appointmentData, status) => {
  const { patientName, service, appointmentDate, time } = appointmentData;

  let statusColor, statusText, statusMessage;

  switch (status) {
    case 'confirmed':
      statusColor = '#4CAF50';
      statusText = 'Confirmed';
      statusMessage = 'Your appointment has been confirmed by our medical team.';
      break;
    case 'cancelled':
      statusColor = '#f44336';
      statusText = 'Cancelled';
      statusMessage = 'Your appointment has been cancelled. Please contact us if you need to reschedule.';
      break;
    case 'rescheduled':
      statusColor = '#ff9800';
      statusText = 'Rescheduled';
      statusMessage = 'Your appointment has been rescheduled. Please check the new details below.';
      break;
    default:
      statusColor = '#2196F3';
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
                <td style="padding: 8px 0; color: #333;">${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
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
      throw new Error('Email transporter not initialized');
    }

    const result = await transporter.sendMail(mailOptions);
    // console.log(`Status update email sent to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending status update email:', error);
    throw error;
  }
};
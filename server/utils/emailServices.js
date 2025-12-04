const nodemailer = require('nodemailer');

// Configure your email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Healthcare Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        
        <p>Or copy this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
        
        <p style="color: #666; font-size: 12px;">
          This link will expire in 24 hours. If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (email, token, userId) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Healthcare Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #2196F3; 
                    color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        
        <p style="color: #666; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

exports.sendNewPasswordEmail = async (email, password, userId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your New Password - Healthcare Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verified Successfully!</h2>
        <p>Your email has been verified. Your temporary password is:</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="font-size: 18px; font-weight: bold; color: #2196F3; letter-spacing: 2px;">
            ${password}
          </p>
        </div>
        
        <p style="color: #ff6b6b; font-weight: bold;">
             Please change this password immediately after logging in for your security.
        </p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" 
             style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Login Now
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          If you didn't verify this email, please contact support immediately.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`New password email sent to ${email}`);
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Notification</h2>
        <p>${message}</p>
        
        <p style="color: #666; font-size: 12px;">
          If you did not perform this action, please contact support immediately.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};
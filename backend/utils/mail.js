import '../config/env.js';

import nodemailer from 'nodemailer'
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate } from './emailTemplates.js';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  timeout: 30000,
  connectionTimeout: 30000,
  // Pooling enable karo for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});


// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});


// Async/Await version with better error handling
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    
    const mailOptions = {
      from: `"Vingo" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text || undefined,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    throw new Error('Failed to send email. Please try again.');
  }
};


// Welcome Email
export const sendWelcomeEmail = async (to, name) => {
  const html = getWelcomeEmailTemplate(name);
  return sendEmail(to, 'Welcome to Vingo! 🎉', html);
};


// OTP Email - Optimized
export const sentOtpEmail = async (to, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Vingo Password Reset</h2>
      <p>Hello,</p>
      <p>Your OTP for password reset is:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
        ${otp}
      </div>
      <p>This OTP will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Vingo Team</p>
    </div>
  `;
  
  return sendEmail(to, 'Your OTP for Password Reset - Vingo', html);
};


// Verification Email
export const sendVerificationEmail = async (to, name, verificationLink) => {
  const html = getVerificationEmailTemplate(name, verificationLink);
  return sendEmail(to, 'Verify Your Email Address - Vingo', html);
};

// Two Factor OTP Email
export const sendTwoFactorOtpEmail = async (to, name, otp, purpose = 'login') => {
  const html = getTwoFactorOtpEmailTemplate(name, otp, purpose);
  const subject = purpose === 'login' 
    ? 'Your Vingo Login Verification Code' 
    : 'Enable Two-Factor Authentication on Vingo';
  
  return sendEmail(to, subject, html);
};

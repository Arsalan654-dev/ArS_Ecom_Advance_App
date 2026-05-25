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
});


// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});



export const sendWelcomeEmail = async (to, name) => {
    try {
        const html = getWelcomeEmailTemplate(name);
        
        const info = await transporter.sendMail({
            from: `"Vingo" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Welcome to Vingo! 🎉',
            html: html
        });
        
        console.log("Welcome email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw new Error('Failed to send welcome email.');
    }
};



export const sentOtpEmail = async (to, otp) => {
  try {
    console.log("Attempting to send email to:", to);
    console.log("Using SMTP user:", process.env.SMTP_USER);
    
    const mailOptions = {
      from: `"Vingo App" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Your OTP for Password Reset - Vingo',
      text: `Hello,

Your OTP for password reset is: ${otp}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Vingo Team`,
      html: `
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
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email. Please check email configuration.');
  }
};


export const sendVerificationEmail = async (to, name, verificationLink) => {
    try {
        const html = getVerificationEmailTemplate(name, verificationLink);
        
        const info = await transporter.sendMail({
            from: `"Vingo" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Verify Your Email Address - Vingo',
            html: html
        });
        
        console.log("Verification email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error('Failed to send verification email. Please check email configuration.');
    }
};

export const sendTwoFactorOtpEmail = async (to, name, otp, purpose = 'login') => {
  try {
    console.log("Attempting to send 2FA email to:", to);
    
    const html = getTwoFactorOtpEmailTemplate(name, otp, purpose);
    
    const subject = purpose === 'login' 
      ? 'Your Vingo Login Verification Code' 
      : 'Enable Two-Factor Authentication on Vingo';
    
    const info = await transporter.sendMail({
      from: `"Vingo Security" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log("2FA email sent successfully:", info.messageId);
    return info;
    
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    throw new Error('Failed to send 2FA verification email. Please check email configuration.');
  }
};

// backend/utils/mail.js
import '../config/env.js';
import nodemailer from 'nodemailer';
import { 
    getVerificationEmailTemplate, 
    getWelcomeEmailTemplate, 
    getTwoFactorOtpEmailTemplate 
} from './emailTemplates.js';

const SENDER_NAME = 'Vingo App';

// SMTP Configuration from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // false for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// Main email sending function
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Sending email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        
        const info = await transporter.sendMail({
            from: `${SENDER_NAME} <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        throw error;
    }
};

// OTP Email for Password Reset
export const sendOtpEmail = async (to, name, otp) => {
    const html = getOtpEmailTemplate(name, otp);
    return sendEmail(to, 'Your OTP for Password Reset - Vingo', html);
};

// Email Verification
export const sendVerificationEmail = async (to, name, verificationLink) => {
    const html = getVerificationEmailTemplate(name, verificationLink);
    return sendEmail(to, 'Verify Your Email Address - Vingo', html);
};

// Welcome Email
export const sendWelcomeEmail = async (to, name) => {
    const html = getWelcomeEmailTemplate(name);
    return sendEmail(to, 'Welcome to Vingo! 🎉', html);
};

// Two Factor OTP Email
export const sendTwoFactorOtpEmail = async (to, name, otp, purpose = 'login') => {
    const html = getTwoFactorOtpEmailTemplate(name, otp, purpose);
    const subject = purpose === 'login' 
        ? 'Your Vingo Login Verification Code' 
        : 'Enable Two-Factor Authentication on Vingo';
    return sendEmail(to, subject, html);
};

// OTP Email Template (yeh emailTemplates.js mein nahi tha, isliye alag se likh raha hoon)
const getOtpEmailTemplate = (name, otp) => `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .otp-box { background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; font-family: monospace; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>You requested to reset your password. Use the OTP below to proceed:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>Vingo Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Vingo. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
`;
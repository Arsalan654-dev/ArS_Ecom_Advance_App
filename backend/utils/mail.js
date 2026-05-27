import '../config/env.js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate } from './emailTemplates.js';

// Initialize Resend if API key present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_SENDER = process.env.RESEND_SENDER_EMAIL || 'onboarding@vingo.com';
const SENDER_NAME = 'Vingo App';

// Helper: send via Resend
const sendViaResend = async (to, subject, html) => {
    if (!resend) throw new Error('Resend is not configured');
    
    console.log('📧 Sending via Resend to:', to);
    
    const result = await resend.emails.send({
        from: `${SENDER_NAME} <${DEFAULT_SENDER}>`,
        to: [to],  // ✅ to should be email address
        subject,
        html,
        replyTo: 'support@vingo.com'
    });

    if (!result || !result.id) {
        throw new Error('Resend failed to send email');
    }

    console.log('✅ Resend success:', result.id);
    return { success: true, messageId: result.id };
};

// Helper: send via SMTP fallback
const sendViaSmtp = async (to, subject, html) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP not configured');
    }

    console.log('📧 Sending via SMTP to:', to);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const info = await transporter.sendMail({
        from: `${SENDER_NAME} <${process.env.SMTP_USER}>`,
        to: to,  // ✅ to should be email address
        subject,
        html
    });

    console.log('✅ SMTP success:', info.messageId);
    return { success: true, messageId: info.messageId };
};

// Common email sending function with fallback
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Sending email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);

        if (!to || !subject || !html) {
            throw new Error('Missing required email parameters: to, subject, or html');
        }

        // Validate email format
        if (!to.includes('@') || !to.includes('.')) {
            throw new Error(`Invalid email address: ${to}`);
        }

       

        // Fallback to SMTP
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            return await sendViaSmtp(to, subject, html);
        }

        throw new Error('No email provider configured (Resend or SMTP)');

    } catch (error) {
        console.error('❌ Email sending failed:', error?.message || error);
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
    console.log(`📧 Sending verification email to: ${to}`);
    console.log(`📧 Verification link: ${verificationLink}`);
    
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

// Add missing OTP template
const getOtpEmailTemplate = (name, otp) => {
    return `
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
};
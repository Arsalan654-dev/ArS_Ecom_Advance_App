import '../config/env.js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate, getOtpEmailTemplate } from './emailTemplates.js';

// Initialize Resend if API key present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_SENDER = process.env.RESEND_SENDER_EMAIL || 'yourmail@vingo.com';
const SENDER_NAME = 'Vingo App';

// Helper: send via Resend
const sendViaResend = async (to, subject, html) => {
    if (!resend) throw new Error('Resend is not configured');
    const result = await resend.emails.send({
        from: `${SENDER_NAME} <${DEFAULT_SENDER}>`,
        to: [to],
        subject,
        html,
        
    });

    if (!result || !result.id) {
        throw new Error('Resend failed to send email');
    }

    return { success: true, messageId: result.id };
};

// Helper: send via SMTP fallback (nodemailer)
const sendViaSmtp = async (to, subject, html) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP not configured');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
        secure: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const info = await transporter.sendMail({
        from: `${SENDER_NAME} <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });

    return { success: true, messageId: info.messageId };
};

// Common email sending function with fallback
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Sending email to: ${to}`);

        if (!to || !subject || !html) {
            throw new Error('Missing required email parameters: to, subject, or html');
        }

        // Prefer Resend if configured
        if (resend) {
            return await sendViaResend(to, subject, html);
        }

        // Fallback to SMTP
        return await sendViaSmtp(to, subject, html);

    } catch (error) {
        console.error('❌ Email sending failed:', error?.message || error);
        throw error;
    }
};

// OTP Email for Password Reset
export const sendOtpEmail = async (to, name, otp) => {
    const html = getOtpEmailTemplate(otp);
    return sendEmail(to, 'Password Reset OTP - Vingo', html);
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
// 

// D:\Ars_Vingo_App-main\backend\utils\mail.js - COMPLETE RESEND VERSION

import '../config/env.js';
import { Resend } from 'resend';
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate } from './emailTemplates.js';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email (use resend.dev for testing, or your verified domain)
const DEFAULT_SENDER = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = 'Vingo App';

// Common email sending function
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Sending email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        
        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <${DEFAULT_SENDER}>`,
            to: [to],
            subject: subject,
            html: html,
            // Optional: Add replyTo
            replyTo: 'support@vingo.com',
        });
        
        if (error) {
            console.error('❌ Resend API error:', error);
            throw new Error(error.message);
        }
        
        console.log(`✅ Email sent successfully!`);
        console.log(`📨 Message ID: ${data?.id}`);
        return { success: true, messageId: data?.id };
        
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw new Error('Failed to send email. Please try again later.');
    }
};

// OTP Email for Password Reset
export const sentOtpEmail = async (to, otp) => {
    const html = `
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
                    <h2>Hello,</h2>
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
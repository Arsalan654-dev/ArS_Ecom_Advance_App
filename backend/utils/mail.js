import '../config/env.js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate } from './emailTemplates.js';

const dnsLookup = promisify(dns.lookup);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_SENDER = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = 'Vingo App';

// Get IPv4 address for SMTP server
const getSMTPHost = async () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    
    // If it's Gmail, force IPv4
    if (host === 'smtp.gmail.com') {
        try {
            const { address } = await dnsLookup('smtp.gmail.com', { family: 4 });
            console.log(`📧 Resolved ${host} to IPv4: ${address}`);
            return address;
        } catch (error) {
            console.error('DNS resolution failed, using hostname:', error);
            return host;
        }
    }
    return host;
};

// Send via SMTP with IPv4
const sendViaSmtp = async (to, subject, html) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP not configured');
    }

    console.log('📧 Sending via SMTP to:', to);
    
    const smtpHost = await getSMTPHost();
    
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: 587,  // Force port 587
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false
        },
        family: 4  // Force IPv4
    });

    const info = await transporter.sendMail({
        from: `${SENDER_NAME} <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });

    console.log('✅ SMTP success:', info.messageId);
    return { success: true, messageId: info.messageId };
};

// Send via Resend (fallback)
const sendViaResend = async (to, subject, html) => {
    if (!resend) throw new Error('Resend not configured');
    
    console.log('📧 Sending via Resend to:', to);
    
    const result = await resend.emails.send({
        from: `${SENDER_NAME} <${DEFAULT_SENDER}>`,
        to: [to],
        subject,
        html,
        replyTo: 'support@vingo.com'
    });

    if (!result || !result.id) {
        throw new Error('Resend failed');
    }

    console.log('✅ Resend success:', result.id);
    return { success: true, messageId: result.id };
};

// Main send function
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Sending email to: ${to}`);
        
        if (!to || !subject || !html) {
            throw new Error('Missing required parameters');
        }

        // Try Resend first
        if (resend) {
            try {
                return await sendViaResend(to, subject, html);
            } catch (resendError) {
                console.log('Resend failed, trying SMTP:', resendError.message);
            }
        }

        // Fallback to SMTP with IPv4
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            return await sendViaSmtp(to, subject, html);
        }

        throw new Error('No email provider available');

    } catch (error) {
        console.error('❌ Email failed:', error.message);
        throw error;
    }
};

// Export functions
export const sendVerificationEmail = async (to, name, verificationLink) => {
    const html = getVerificationEmailTemplate(name, verificationLink);
    return sendEmail(to, 'Verify Your Email Address - Vingo', html);
};

export const sendWelcomeEmail = async (to, name) => {
    const html = getWelcomeEmailTemplate(name);
    return sendEmail(to, 'Welcome to Vingo! 🎉', html);
};

export const sendOtpEmail = async (to, name, otp) => {
    const html = getOtpEmailTemplate(name, otp);
    return sendEmail(to, 'Your OTP for Password Reset - Vingo', html);
};

export const sendTwoFactorOtpEmail = async (to, name, otp, purpose = 'login') => {
    const html = getTwoFactorOtpEmailTemplate(name, otp, purpose);
    const subject = purpose === 'login' 
        ? 'Your Vingo Login Verification Code' 
        : 'Enable Two-Factor Authentication on Vingo';
    return sendEmail(to, subject, html);
};

// OTP Template
const getOtpEmailTemplate = (name, otp) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; padding: 20px; letter-spacing: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Vingo Password Reset</h1>
                </div>
                <div class="otp-code">${otp}</div>
                <p>Hello ${name},</p>
                <p>Use this OTP to reset your password. It will expire in 10 minutes.</p>
            </div>
        </body>
        </html>
    `;
};
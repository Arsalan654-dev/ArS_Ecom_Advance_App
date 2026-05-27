import '../config/env.js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
import { getVerificationEmailTemplate, getWelcomeEmailTemplate, getTwoFactorOtpEmailTemplate } from './emailTemplates.js';

const dnsLookup = promisify(dns.lookup);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_SENDER = process.env.RESEND_SENDER_EMAIL || 'onboarding@vingo.com';
const SENDER_NAME = 'Vingo App';

// Cache for SMTP hosts
let smtpHostIPv4 = null;

const getSMTPHostIPv4 = async () => {
    if (smtpHostIPv4) return smtpHostIPv4;
    
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    try {
        const { address } = await dnsLookup(host, { family: 4 });
        smtpHostIPv4 = address;
        console.log(`📧 Resolved ${host} to IPv4: ${address}`);
        return address;
    } catch (error) {
        console.error('DNS resolution failed:', error);
        return host;
    }
};

// Provider 1: Brevo SMTP (Best for Railway)
const sendViaBrevo = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_BREVO_USER || process.env.SMTP_USER,
            pass: process.env.SMTP_BREVO_PASS || process.env.SMTP_BREVO_PASS
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
        tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
        from: `${SENDER_NAME} <${process.env.SMTP_BREVO_USER || process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });

    return { success: true, provider: 'brevo', messageId: info.messageId };
};

// Provider 2: Gmail SMTP with IPv4
const sendViaGmailSMTP = async (to, subject, html) => {
    const smtpHost = await getSMTPHostIPv4();
    
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: 465,  // Use 465 instead of 587 for Gmail
        secure: true,  // SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 15000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false },
        family: 4
    });

    const info = await transporter.sendMail({
        from: `${SENDER_NAME} <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });

    return { success: true, provider: 'gmail', messageId: info.messageId };
};

// Provider 3: Resend
const sendViaResend = async (to, subject, html) => {
    if (!resend) throw new Error('Resend not configured');
    
    const result = await resend.emails.send({
        from: `${SENDER_NAME} <${DEFAULT_SENDER}>`,
        to: [to],
        subject,
        html
    });

    if (!result?.id) throw new Error('Resend failed');
    return { success: true, provider: 'resend', messageId: result.id };
};





// Main send function with fallbacks
const sendEmail = async (to, subject, html) => {
    console.log(`📧 Sending to: ${to}`);
    
    // Try providers in order
    const providers = [
        { name: 'Brevo', fn: () => sendViaBrevo(to, subject, html), condition: () => process.env.SMTP_BREVO_PASS || (process.env.SMTP_BREVO_HOST?.includes('brevo')) },
        { name: 'Resend', fn: () => sendViaResend(to, subject, html), condition: () => !!resend },
        { name: 'Gmail SMTP', fn: () => sendViaGmailSMTP(to, subject, html), condition: () => !!process.env.SMTP_USER },
        
    ];

    for (const provider of providers) {
        if (!provider.condition()) continue;
        
        try {
            console.log(`📧 Trying ${provider.name}...`);
            const result = await provider.fn();
            console.log(`✅ Email sent via ${provider.name}`);
            return result;
        } catch (error) {
            console.log(`${provider.name} failed:`, error.message);
        }
    }

    throw new Error('All email providers failed');
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

const getOtpEmailTemplate = (name, otp) => `
    <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Vingo Password Reset</h2>
        <p>Hello ${name},</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px;">
            <strong>${otp}</strong>
        </div>
        <p>This OTP expires in 10 minutes.</p>
    </div>
`;
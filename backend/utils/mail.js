// backend/utils/mail.js

import '../config/env.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'jaffri.arsalan786@gmail.com';
const SENDER_NAME = 'Vingo App';

const sendEmail = async (to, subject, html) => {
    console.log(`📧 Sending to: ${to}`);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html
        })
    });

    const data = await response.json();
    
    if (!response.ok) {
        console.error('❌ Brevo error:', data);
        throw new Error(data.message || 'Email failed');
    }
    
    console.log('✅ Email sent:', data.messageId);
    return { success: true, messageId: data.messageId };
};

export const sendOtpEmail = async (to, name, otp) => {
    const html = `<div style="font-family:Arial;padding:20px"><h2>Hi ${name}</h2><p>Your OTP: <b style="font-size:24px;color:#4F46E5">${otp}</b></p><p>Valid for 10 minutes</p></div>`;
    return sendEmail(to, 'Your OTP for Vingo', html);
};

export const sendVerificationEmail = async (to, name, link) => {
    const html = `<div style="font-family:Arial;padding:20px"><h2>Welcome ${name}!</h2><p><a href="${link}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Verify Email</a></p></div>`;
    return sendEmail(to, 'Verify Your Email - Vingo', html);
};

export const sendWelcomeEmail = async (to, name) => {
    return sendEmail(to, 'Welcome to Vingo!', `<h1>Hi ${name}, welcome!</h1>`);
};

export const sendTwoFactorOtpEmail = async (to, name, otp) => {
    return sendEmail(to, 'Your Vingo Code', `<h1>${otp}</h1>`);
};
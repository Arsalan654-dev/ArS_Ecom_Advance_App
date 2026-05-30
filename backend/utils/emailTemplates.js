// backend\utils\emailTemplates.js

export const getVerificationEmailTemplate = (name, verificationLink) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Vingo!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering with Vingo! Please verify your email address to get started.</p>
                    <p style="text-align: center;">
                        <a href="${verificationLink}" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy this link: ${verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Vingo. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

export const getWelcomeEmailTemplate = (name) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Vingo! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Your email has been successfully verified!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse our amazing products</li>
                        <li>Place orders with ease</li>
                        <li>Track your deliveries</li>
                        <li>And much more!</li>
                    </ul>
                    <p>Get started with your shopping journey today!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Vingo. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

export const getTwoFactorOtpEmailTemplate = (name, otp, purpose = 'login') => {
    const purposeText = purpose === 'login' ? 'login' : 'enable two-factor authentication';
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
                .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Vingo Security Verification</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Your verification code for ${purposeText} is:</p>
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                    </div>
                    <p><strong>This code will expire in 10 minutes.</strong></p>
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> Do not share this code with anyone. Vingo support will never ask for your verification code.
                    </div>
                    <p>If you didn't request this verification code, please ignore this email. Your account security may be at risk if you share this code.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Vingo. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Add these exports at the end of file
export const getOtpEmailTemplate = (otp) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Vingo Password Reset</h1>
                </div>
                <div class="otp-code">${otp}</div>
                <p>Use this OTP to reset your password. It will expire in 10 minutes.</p>
            </div>
        </body>
        </html>
    `;
};
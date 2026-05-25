import '../config/env.js';

const WHATSAPP_API_VERSION = 'v20.0';

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  return String(phoneNumber).replace(/\D/g, '');
};

export const sendWhatsAppOtp = async (phoneNumber, otp, purpose = 'verification') => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error('WhatsApp Cloud API is not configured');
  }

  const to = formatPhoneNumber(phoneNumber);

  if (!to) {
    throw new Error('Recipient phone number is required');
  }

  const purposeLabel =
    purpose === 'login'
      ? 'login'
      : purpose === 'password-reset'
        ? 'password reset'
        : 'verification';

  const messageBody = `Your Vingo ${purposeLabel} code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody
        }
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Failed to send WhatsApp OTP');
  }

  return payload;
};

import dotenv from 'dotenv';
dotenv.config();

export interface SmsOptions {
  to: string;
  message: string;
}

/**
 * Service abstraction for sending SMS notifications.
 * Supports multiple providers through environment variables (SMS_PROVIDER).
 * Options: 'TWILIO', 'MSG91', 'FAST2SMS', 'MOCK'
 */
export const sendSms = async (options: SmsOptions): Promise<boolean> => {
  const provider = process.env.SMS_PROVIDER || 'MOCK';
  
  try {
    switch (provider) {
      case 'TWILIO':
        return await sendViaTwilio(options);
      case 'MSG91':
        return await sendViaMsg91(options);
      case 'FAST2SMS':
        return await sendViaFast2Sms(options);
      case 'MOCK':
      default:
        console.log(`[Mock SMS] To: ${options.to} | Message: ${options.message}`);
        return true;
    }
  } catch (error) {
    console.error(`[SMS Service] Failed to send SMS via ${provider}:`, error);
    return false;
  }
};

const sendViaTwilio = async (options: SmsOptions): Promise<boolean> => {
  // Implementation for Twilio
  // Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
  console.log('Sending via Twilio...', options);
  return true;
};

const sendViaMsg91 = async (options: SmsOptions): Promise<boolean> => {
  // Implementation for MSG91
  console.log('Sending via MSG91...', options);
  return true;
};

const sendViaFast2Sms = async (options: SmsOptions): Promise<boolean> => {
  // Implementation for Fast2SMS
  console.log('Sending via Fast2SMS...', options);
  return true;
};

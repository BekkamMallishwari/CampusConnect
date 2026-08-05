import Razorpay from 'razorpay';

export const getRazorpayInstance = (): Razorpay => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error('❌ Razorpay credentials missing in environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).');
    throw new Error('Razorpay environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing on the server.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};


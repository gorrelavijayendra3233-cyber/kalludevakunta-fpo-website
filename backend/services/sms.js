const sendSMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.warn("Fast2SMS API Key is not configured in .env. Skipping SMS dispatch.");
    return false;
  }

  try {
    // Cleanse phone number (remove non-digits)
    const cleanPhone = String(phone).replace(/\D/g, "");
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&variables_values=${otp}&route=otp&numbers=${cleanPhone}`;
    
    console.log(`[SMS SERVICE] Dispatching OTP SMS to ${cleanPhone}...`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "cache-control": "no-cache"
      },
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (response.ok && data.return === true) {
      console.log(`[SMS SERVICE] SMS dispatched successfully to ${cleanPhone}. Fast2SMS Response:`, data);
      return true;
    } else {
      console.error(`[SMS SERVICE] Fast2SMS dispatch failed for ${cleanPhone}. Response:`, data);
      return false;
    }
  } catch (err) {
    console.error(`[SMS SERVICE] Connection error sending SMS:`, err);
    return false;
  }
};

module.exports = { sendSMS };

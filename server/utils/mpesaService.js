const axios = require("axios");

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortCode: process.env.MPESA_SHORTCODE || "174379",
  passKey: process.env.MPESA_PASSKEY,
  // Use sandbox by default, switch to production in .env
  baseUrl: process.env.MPESA_API_URL || "https://sandbox.safaricom.co.ke",
};

let accessTokenCache = {
  token: null,
  expiresAt: null,
};

const getAccessToken = async () => {
  try {
    // Check if token is still valid
    if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
      console.log("Using cached access token");
      return accessTokenCache.token;
    }

    console.log("Requesting new access token from M-Pesa...");

    const auth = Buffer.from(
      `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`,
    ).toString("base64");

    const response = await axios.get(
      `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    if (!response.data.access_token) {
      throw new Error("No access token in response");
    }

    accessTokenCache.token = response.data.access_token;
    accessTokenCache.expiresAt = Date.now() + 3500000; // 3500 seconds

    console.log("New access token obtained");
    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get access token:", error.message);
    throw new Error(`Failed to authenticate with M-Pesa: ${error.message}`);
  }
};

const generateTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const generatePassword = (timestamp) => {
  const passwordString = `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`;
  return Buffer.from(passwordString).toString("base64");
};

const initiateSTKPush = async (config) => {
  try {
    const {
      phone,
      amount,
      accountRef = "ResearchProposal",
      description = "Research proposal submission fee",
      callbackUrl = process.env.MPESA_CALLBACK_URL ||
        "https://mydomain.com/api/research/mpesa/callback",
    } = config;

    // Validation
    if (!phone || !amount) {
      throw new Error("Phone and amount are required");
    }

    if (amount < 1 || amount > 150000) {
      throw new Error("Amount must be between 1 and 150000 KES");
    }

    if (!phone.startsWith("254") || phone.length !== 12) {
      throw new Error("Phone must be in format 254712345678");
    }

    if (accountRef.length > 12) {
      throw new Error("Account reference must be max 12 characters");
    }

    console.log(`Initiating STK Push: ${phone}, KES ${amount}`);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Prepare request
    const requestBody = {
      BusinessShortCode: MPESA_CONFIG.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount), // Ensure integer
      PartyA: phone,
      PartyB: MPESA_CONFIG.shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: description,
    };

    console.log("Sending STK Push request to M-Pesa...");
    console.log("Request:", JSON.stringify(requestBody, null, 2));

    // Send STK Push request
    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("📨 M-Pesa Response:", JSON.stringify(response.data, null, 2));

    // Check response
    if (!response.data) {
      throw new Error("Empty response from M-Pesa");
    }

    const {
      ResponseCode,
      ResponseDescription,
      MerchantRequestID,
      CheckoutRequestID,
    } = response.data;

    if (ResponseCode !== "0") {
      console.error(`STK Push failed - ${ResponseDescription}`);
      throw new Error(ResponseDescription || "M-Pesa STK Push failed");
    }

    console.log(`STK Push sent successfully!`);
    console.log(`MerchantRequestID: ${MerchantRequestID}`);
    console.log(`CheckoutRequestID: ${CheckoutRequestID}`);

    return {
      success: true,
      ResponseCode,
      ResponseDescription,
      MerchantRequestID,
      CheckoutRequestID,
      phone,
      amount,
      timestamp,
    };
  } catch (error) {
    console.error("STK Push Error:", error.message);
    console.error("Stack:", error.stack);

    // Return structured error
    return {
      success: false,
      ResponseCode: error.response?.status || "500",
      ResponseDescription: error.message,
      error: error.message,
    };
  }
};

const querySTKStatus = async (config) => {
  try {
    const { checkoutRequestId, businessShortCode = MPESA_CONFIG.shortCode } =
      config;

    if (!checkoutRequestId) {
      throw new Error("CheckoutRequestID is required");
    }

    console.log(` Querying STK status for: ${checkoutRequestId}`);

    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const requestBody = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    console.log(
      "Status Query Response:",
      JSON.stringify(response.data, null, 2),
    );

    const {
      ResponseCode,
      ResponseDescription,
      ResultCode,
      ResultDesc,
      MpesaReceiptNumber,
    } = response.data;

    // ResultCode 0 = completed, anything else = pending/failed
    const isCompleted = ResultCode === "0";

    return {
      checkoutRequestId,
      ResponseCode,
      ResponseDescription,
      ResultCode,
      ResultDesc,
      status: isCompleted ? "completed" : "pending",
      receipt: MpesaReceiptNumber,
      isCompleted,
    };
  } catch (error) {
    console.error("Query Status Error:", error.message);
    return {
      checkoutRequestId: config.checkoutRequestId,
      status: "error",
      error: error.message,
    };
  }
};


const parseCallback = (callbackData) => {
  try {
    console.log('🔔 [Parse Callback] Processing M-Pesa callback...');
 
    const result = callbackData.Body?.stkCallback;
 
    if (!result) {
      console.warn('⚠️  [Parse Callback] No stkCallback in body');
      return null;
    }
 
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = result;
 
    console.log(`[Parse Callback] CheckoutRequestID: ${CheckoutRequestID}`);
    console.log(`[Parse Callback] ResultCode: ${ResultCode} (${ResultDesc})`);
 
    // ResultCode 0 = Success
    const isSuccess = Number(ResultCode) === 0;


    // Initialize variables BEFORE the loop
    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;
    let transactionDate = null;
 
    // Extract metadata if payment was successful
    if (isSuccess && CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
      const items = CallbackMetadata.Item;
 
      // Map metadata items correctly
      items.forEach((item) => {
        console.log(`  [Meta] ${item.Name}: ${item.Value}`);
        
        if (item.Name === 'Amount') {
          amount = item.Value;  // FIX: Map Amount to amount, not mpesaReceiptNumber
        }
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = item.Value;
        }
        if (item.Name === 'PhoneNumber') {
          phoneNumber = item.Value;
        }
        if (item.Name === 'TransactionDate') {
          transactionDate = item.Value;
        }
      });
 
      console.log(`✅ [Parse Callback] Payment received!`);
      console.log(`  Receipt: ${mpesaReceiptNumber}`);
      console.log(`  Amount: ${amount}`);
      console.log(`  Phone: ${phoneNumber}`);
    } else {
      console.log(`❌ [Parse Callback] Payment ${isSuccess ? 'completed' : 'failed'}: ${ResultDesc}`);
    }
 
    return {
      success: isSuccess,
      status: isSuccess ? 'complete' : 'failed',  // Match 'complete', not 'completed'
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: String(ResultCode),
      resultDesc: ResultDesc,
      mpesaReceiptNumber,  // FIX: Return correct field name
      amount,
      phone: phoneNumber,
      transactionDate,
    };
  } catch (error) {
    console.error('❌ [Parse Callback] Processing error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
};

const processCallback = (callbackData) => {
  try {
    console.log("Processing M-Pesa callback...");
    console.log("Callback Data:", JSON.stringify(callbackData, null, 2));

    const result = callbackData.Body?.stkCallback;

    if (!result) {
      console.warn("No stkCallback in body");
      return null;
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = result;

    console.log(`CheckoutRequestID: ${CheckoutRequestID}`);
    console.log(`ResultCode: ${ResultCode} (${ResultDesc})`);

    // ResultCode 0 = Success
    const isSuccess = Number(ResultCode) === 0;

    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;
    let transactionDate = null;

    // Extract metadata if payment was successful
    if (
      isSuccess &&
      CallbackMetadata?.Item &&
      Array.isArray(CallbackMetadata.Item)
    ) {
      const items = CallbackMetadata.Item;

      // Map metadata items
      items.forEach((item) => {
        console.log(`  [Meta] ${item.Name}: ${item.Value}`);

        if (item.Name === "Amount") amount = item.Value;
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
        if (item.Name === "PhoneNumber") phoneNumber = item.Value;
        if (item.Name === "TransactionDate") transactionDate = item.Value;
      });

      console.log(`Payment received!`);
      console.log(`Receipt: ${mpesaReceiptNumber}`);
      console.log(`Phone: ${phoneNumber}`);
    } else {
      console.log(
        `❌ Payment ${isSuccess ? "completed" : "failed"}: ${ResultDesc}`,
      );
    }

    return {
      success: isSuccess,
      status: isSuccess ? "completed" : "failed",
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: String(ResultCode),
      resultDesc: ResultDesc,
      mpesaReceiptNumber,
      amount,
      phone: phoneNumber,
      transactionDate,
    };
  } catch (error) {
    console.error("Callback processing error:", error.message);
    console.error("Stack:", error.stack);
    return null;
  }
};

const sendB2CPayment = async (config) => {
  try {
    const {
      phone,
      amount,
      commandId = "BusinessPayment",
      remarks = "Payment from Nyahururu Research Portal",
      callbackUrl = process.env.MPESA_B2C_CALLBACK_URL ||
        'https://mydomain.com/api/research/mpesa/b2c-callback'
    } = config;

    if (!phone || !amount) {
      throw new Error("Phone and amount are required");
    }

    console.log(`Initiating B2C Payment: ${phone}, KES ${amount}`);

    const accessToken = await getAccessToken();

    const requestBody = {
      OriginatorConversationID: `B2C-${Date.now()}`,
      InitiatedName: "Nyahururu",
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL, // Must be encrypted
      CommandID: commandId,
      Timeout: "180",
      PartyA: MPESA_CONFIG.shortCode,
      PartyB: phone,
      Remarks: remarks,
      QueueTimeOutURL: callbackUrl,
      ResultURL: callbackUrl,
      Amount: Math.floor(amount),
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("B2C Payment initiated:", response.data);

    return {
      success: true,
      conversationId: response.data.ConversationID,
      response: response.data,
    };
  } catch (error) {
    console.error(" B2C Payment Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

const checkBalance = async () => {
  try {
    console.log("Checking M-Pesa account balance...");

    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const requestBody = {
      CommandID: "GetAccount",
      Partyalias: MPESA_CONFIG.shortCode,
      IdentifierType: "4",
      Remarks: "Balance check",
      Initiator: process.env.MPESA_INITIATOR_NAME || "testapi",
      SecurityCredential:
        process.env.MPESA_SECURITY_CREDENTIAL || "encrypted_credential",
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/accountbalance/v1/query`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    console.log("Balance check response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Balance check error:", error.message);
    return { success: false, error: error.message };
  }
};

const validatePhone = (phone) => {
  return /^254[0-9]{9}$/.test(phone);
};

const validateAmount = (amount) => {
  return amount >= 1 && amount <= 150000;
};

// Export all functions
module.exports = {
  // Core functions
  initiateSTKPush,
  querySTKStatus,
  processCallback,
  sendB2CPayment,
  checkBalance,
  parseCallback,

  // Utilities
  getAccessToken,
  generateTimestamp,
  generatePassword,
  validatePhone,
  validateAmount,

  // Config access
  getConfig: () => MPESA_CONFIG,
};

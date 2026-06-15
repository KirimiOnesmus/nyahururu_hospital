
const axios = require("axios");
const { MPESA_RESULT_CODES } = require("../constants/researchIndex")


const getConfig = () => ({
  consumerKey:    process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortCode:      process.env.MPESA_SHORTCODE     || "174379",
  passKey:        process.env.MPESA_PASSKEY,
  baseUrl:        process.env.MPESA_API_URL        || "https://sandbox.safaricom.co.ke",
  callbackUrl:    process.env.MPESA_CALLBACK_URL   || "https://yourdomain.com/api/v1/payments/callback",
});


//  ACCESS TOKEN — in-memory cache

let _tokenCache = { token: null, expiresAt: 0 };

const getAccessToken = async () => {
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const cfg  = getConfig();
  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64");

  const { data } = await axios.get(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10_000,
    }
  );

  if (!data.access_token) throw new Error("M-Pesa: No access_token in response");

  _tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + 3_500_000, // ~58 min (token lasts 60 min)
  };

  return _tokenCache.token;
};


//  HELPERS

const generateTimestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

const generatePassword = (shortCode, passKey, timestamp) =>
  Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");

const normalizePhone = (phone) => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("254") && digits.length === 12) return digits;
  return null; // invalid
};

const validatePhone = (phone) => /^254[0-9]{9}$/.test(phone);
const validateAmount = (amount) => Number.isInteger(amount) && amount >= 1 && amount <= 150_000;


//  STK PUSH

const initiateSTKPush = async ({ phone, amount, accountRef = "Research", description = "Research Portal Payment" }) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) throw new Error("Invalid phone number format");

  const intAmount = Math.floor(Number(amount));
  if (!validateAmount(intAmount)) throw new Error("Amount must be between 1 and 150,000 KES");

  if (accountRef.length > 12) throw new Error("Account reference must be 12 characters or fewer");

  const cfg       = getConfig();
  const timestamp = generateTimestamp();
  const password  = generatePassword(cfg.shortCode, cfg.passKey, timestamp);
  const token     = await getAccessToken();

  const payload = {
    BusinessShortCode: cfg.shortCode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   "CustomerPayBillOnline",
    Amount:            intAmount,
    PartyA:            normalizedPhone,
    PartyB:            cfg.shortCode,
    PhoneNumber:       normalizedPhone,
    CallBackURL:       cfg.callbackUrl,
    AccountReference:  accountRef,
    TransactionDesc:   description,
  };

  const { data } = await axios.post(
    `${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );

  if (!data) throw new Error("Empty response from M-Pesa STK Push");

  return {
    ResponseCode:       data.ResponseCode,
    ResponseDescription:data.ResponseDescription,
    MerchantRequestID:  data.MerchantRequestID,
    CheckoutRequestID:  data.CheckoutRequestID,
    CustomerMessage:    data.CustomerMessage,
  };
};


//  STK STATUS QUERY

const querySTKStatus = async (checkoutRequestId) => {
  if (!checkoutRequestId) throw new Error("CheckoutRequestID is required");

  const cfg       = getConfig();
  const timestamp = generateTimestamp();
  const password  = generatePassword(cfg.shortCode, cfg.passKey, timestamp);
  const token     = await getAccessToken();

  const { data } = await axios.post(
    `${cfg.baseUrl}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: cfg.shortCode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    }
  );

  const resultCode  = String(data.ResultCode ?? "");
  const isCompleted = resultCode === MPESA_RESULT_CODES.SUCCESS;

  return {
    checkoutRequestId,
    ResponseCode:        data.ResponseCode,
    ResultCode:          resultCode,
    ResultDesc:          data.ResultDesc,
    MpesaReceiptNumber:  data.MpesaReceiptNumber || null,
    isCompleted,
    status: isCompleted ? "completed" : "pending",
  };
};


//  CALLBACK PARSER

const parseCallback = (body) => {
  const result = body?.Body?.stkCallback;
  if (!result) return null;

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = result;


  const resultCodeStr = String(ResultCode ?? "");
  const isSuccess     = resultCodeStr === MPESA_RESULT_CODES.SUCCESS;

  let mpesaReceiptNumber = null;
  let amount             = null;
  let phone              = null;
  let transactionDate    = null;

  if (isSuccess && Array.isArray(CallbackMetadata?.Item)) {
    CallbackMetadata.Item.forEach(({ Name, Value }) => {
      if (Name === "MpesaReceiptNumber") mpesaReceiptNumber = Value;
      if (Name === "Amount")             amount             = Value;
      if (Name === "PhoneNumber")        phone              = String(Value);
      if (Name === "TransactionDate")    transactionDate    = String(Value);
    });
  }

  return {
    merchantRequestId:  MerchantRequestID,
    checkoutRequestId:  CheckoutRequestID,
    resultCode:         resultCodeStr,
    resultDesc:         ResultDesc,
    status:
      resultCodeStr === MPESA_RESULT_CODES.SUCCESS   ? "completed" :
      resultCodeStr === MPESA_RESULT_CODES.CANCELLED ? "cancelled" : "failed",
    mpesaReceiptNumber,
    amount,
    phone,
    transactionDate,
  };
};


//  B2C PAYMENT (REFUND / PAYOUT)

const sendB2CPayment = async ({ phone, amount, remarks = "Research Portal Refund" }) => {
  const cfg   = getConfig();
  const token = await getAccessToken();

  const { data } = await axios.post(
    `${cfg.baseUrl}/mpesa/b2c/v3/paymentrequest`,
    {
      OriginatorConversationID: `B2C-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      InitiatorName:    process.env.MPESA_INITIATOR_NAME || "testapi",
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID:        "BusinessPayment",
      Amount:           Math.floor(amount),
      PartyA:           cfg.shortCode,
      PartyB:           phone,
      Remarks:          remarks,
      QueueTimeOutURL:  process.env.MPESA_B2C_CALLBACK_URL || cfg.callbackUrl,
      ResultURL:        process.env.MPESA_B2C_CALLBACK_URL || cfg.callbackUrl,
      Occassion:        "",
    },
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );

  return {
    success:        true,
    conversationId: data.ConversationID,
    ResponseCode:   data.ResponseCode,
    ResponseDesc:   data.ResponseDescription,
  };
};


module.exports = {
  initiateSTKPush,
  querySTKStatus,
  parseCallback,
  sendB2CPayment,
  getAccessToken,
  normalizePhone,
  validatePhone,
  validateAmount,
  generateTimestamp,
  // Expose for testing
  _resetTokenCache: () => { _tokenCache = { token: null, expiresAt: 0 }; },
};

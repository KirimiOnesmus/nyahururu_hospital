const QRCode = require("qrcode");

const generateVerificationQR = async (certificateNumber, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-certificate?cert=${encodeURIComponent(
    certificateNumber
  )}&token=${encodeURIComponent(token)}`;

  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
  });
};

module.exports = { generateVerificationQR };
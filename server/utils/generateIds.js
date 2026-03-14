// utils/generateIds.js

// Role short forms
const roleShortCodes = {
  superadmin: "SA",
  admin: "AD",
  doctor: "DR",
  staff: "ST",
  it: "IT",
  nurse: "NR",
  pharmacist: "PH",
  communication: "CM",
};

// Generate Employee ID: NCRH-ROLE-XXXX
async function generateEmployeeId(role, User) {
  try {
    // Normalize role to lowercase for lookup
    const normalizedRole = (role || "staff").toLowerCase().trim();
    const short = roleShortCodes[normalizedRole] || "ST";

    // Count existing records of same role
    const count = await User.countDocuments({ role });

    const number = String(count + 1).padStart(4, "0");

    return `NCRH-${short}-${number}`;
  } catch (error) {
    console.error("Error generating employee ID:", error);
    // Fallback
    return `NCRH-ST-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  }
}

// Generate RFID tag based on employee ID
function generateRFID(employeeId) {
  try {
    if (!employeeId) {
      // Fallback if no employee ID provided
      const timestamp = Date.now();
      return `RFID-${timestamp}`;
    }
    
    // Simple format: prepend RFID- to employee ID
    // Results in: RFID-NCRH-DR-0001
    return `RFID-${employeeId}`;
  } catch (error) {
    console.error("Error generating RFID:", error);
    // Fallback
    return `RFID-${Date.now()}`;
  }
}

module.exports = { generateEmployeeId, generateRFID };
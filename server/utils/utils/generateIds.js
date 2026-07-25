const roleShortCodes = {
  superadmin: "SA",
  admin: "AD",
  doctor: "DR",
  staff: "ST",
  it: "IT",
  nurse: "NR",
  pharmacist: "PH",
  communication: "CM",
  research: "RS",
  vendor: "VN",
};

// Generate Employee ID: NCRH-ROLE-XXXX
//
// CUTOVER NOTE: `User` here is now the Sequelize model (see
// controllers/userController.js), not the old Mongoose model — swapped
// `User.countDocuments({ role })` for the Sequelize equivalent,
// `User.count({ where: { role } })`.
async function generateEmployeeId(role, User) {
  try {
    const normalizedRole = (role || "staff").toLowerCase().trim();
    const short = roleShortCodes[normalizedRole] || "ST";

    const count = await User.count({ where: { role } });

    const number = String(count + 1).padStart(4, "0");

    return `NCRH-${short}-${number}`;
  } catch (error) {
    console.error("Error generating employee ID:", error);

    return `NCRH-ST-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  }
}

function generateRFID(employeeId) {
  try {
    if (!employeeId) {
      const timestamp = Date.now();
      return `RFID-${timestamp}`;
    }

    return `RFID-${employeeId}`;
  } catch (error) {
    console.error("Error generating RFID:", error);
    // Fallback
    return `RFID-${Date.now()}`;
  }
}

module.exports = { generateEmployeeId, generateRFID };

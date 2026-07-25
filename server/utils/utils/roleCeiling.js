"use strict";

// Single source of truth for "who may assign/hold which role", used by
// userController.createUser/updateUser and the deprecated-in-favor-of-those
// authController.register path.
//
// Rank is deliberately coarse: only superadmin may create or promote
// someone to admin/superadmin. admin and it may provision any of the
// "operational" roles (doctor, nurse, pharmacist, communication, research,
// staff) but can never mint another admin or superadmin — closing the
// exact escalation path described in C2 ("an it-role account can create a
// superadmin account").
const ROLE_RANK = {
  superadmin: 3,
  admin: 2,
  it: 1,
  doctor: 0,
  nurse: 0,
  pharmacist: 0,
  communication: 0,
  research: 0,
  staff: 0,
  vendor: 0,
};

const PRIVILEGED_ROLES = ["admin", "superadmin"];

const rankOf = (role) => ROLE_RANK[String(role || "").toLowerCase()] ?? 0;

/**
 * Throws an AppError (via the caller, see usage below) unless `callerRole`
 * is allowed to assign `targetRole`.
 *   - Only superadmin can assign admin/superadmin.
 *   - Nobody can assign a role that outranks their own.
 */
const canAssignRole = (callerRole, targetRole) => {
  const target = String(targetRole || "").toLowerCase();

  if (PRIVILEGED_ROLES.includes(target) && callerRole !== "superadmin") {
    return false;
  }

  return rankOf(callerRole) >= rankOf(target);
};

module.exports = { ROLE_RANK, PRIVILEGED_ROLES, canAssignRole, rankOf };

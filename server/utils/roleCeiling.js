"use strict";


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


const canAssignRole = (callerRole, targetRole) => {
  const target = String(targetRole || "").toLowerCase();

  if (PRIVILEGED_ROLES.includes(target) && callerRole !== "superadmin") {
    return false;
  }

  return rankOf(callerRole) >= rankOf(target);
};

module.exports = { ROLE_RANK, PRIVILEGED_ROLES, canAssignRole, rankOf };

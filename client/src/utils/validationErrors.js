
const FIELD_LABELS = {
  phone: "Phone number",
  title: "Title",
  discipline: "Discipline",
  abstract: "Abstract",
  background: "Problem statement",
  objectives: "Objectives",
  methodology: "Methodology",
  expectedOutcome: "Expected outcome",
  timeline: "Timeline",
};

export const formatApiError = (err) => {
  const list = Array.isArray(err?.errors) ? err.errors : [];

  if (list.length === 0) {
    return { summary: err?.message || "Something went wrong. Please try again.", fieldErrors: {} };
  }

  const fieldErrors = {};
  list.forEach(({ field, message }) => { if (field) fieldErrors[field] = message; });

  const summary = list.length === 1
    ? `${FIELD_LABELS[list[0].field] || list[0].field}: ${list[0].message}`
    : list.map(({ field, message }) => `${FIELD_LABELS[field] || field}: ${message}`).join(" · ");

  return { summary, fieldErrors };
};
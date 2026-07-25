const { z } = require("zod");

const countWords = (str = "") =>
  str.trim().split(/\s+/).filter(Boolean).length;

const wordCountString = (min, max, fieldLabel) =>
  z
    .string()
    .trim()
    .refine((val) => val.length > 0, { message: `${fieldLabel} is required` })
    .refine((val) => countWords(val) >= min, {
      message: `${fieldLabel} must be at least ${min} words`,
    })
    .refine((val) => countWords(val) <= max, {
      message: `${fieldLabel} must not exceed ${max} words`,
    });

module.exports = { countWords, wordCountString };
"use strict";

const HOMEPAGE_BANNER_CATEGORY = "Homepage Banner";

const normalizeGalleryCategory = (category) => {
  const value = String(category || "").trim();
  if (/^home\s*page\s*banner$/i.test(value) || /^homepage\s*banner$/i.test(value)) {
    return HOMEPAGE_BANNER_CATEGORY;
  }
  return value;
};

module.exports = { HOMEPAGE_BANNER_CATEGORY, normalizeGalleryCategory };

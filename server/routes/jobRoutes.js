const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fetch jobs from MedIHire securely
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
    //   "https://api.medihire.com/api/v2/public/jobs",
    "https://localhost:5000/api/v2/public/jobs",
      {
        headers: {
          "X-API-KEY": process.env.MEDIHIRE_API_KEY,
          "X-API-SECRET": process.env.MEDIHIRE_API_SECRET,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

module.exports = router;
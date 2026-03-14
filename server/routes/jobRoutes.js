const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fetch jobs from MedIHire securely
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
    //   "https://api.medihire.com/api/v2/public/jobs",
    process.env.MEDIHIRE_JOBS_URL || "http://localhost:5000/api/v2/public/jobs",
      {
        headers: {
           "x-api-key": process.env.MEDIHIRE_API_KEY,
          "x-api-secret": process.env.MEDIHIRE_API_SECRET,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
       console.error("Full error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,     // <-- this is what your API actually returned
      url: error.config?.url,
      headers: error.config?.headers
    });
    res.status(500).json({
       message: "Failed to fetch jobs" ,
         debug: {                         // remove this block before going to production
        error: error.message,
        status: error.response?.status,
        detail: error.response?.data
      }

    });
  }
});

module.exports = router;
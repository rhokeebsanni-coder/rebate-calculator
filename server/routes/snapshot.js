const express = require("express");
const router = express.Router();

const { createSnapshot, getSnapshots } = require("../controllers/snapshot.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// All routes require authentication
router.use(authMiddleware);

router.get("/", getSnapshots);
router.post("/", createSnapshot);

module.exports = router;

// routes/materials.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");


const {
  createMaterial,
  getMaterials,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materials.js");

router.use(authMiddleware);

router.get("/", getMaterials);
router.post("/", createMaterial);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

module.exports = router;

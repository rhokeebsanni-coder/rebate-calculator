// routes/materials.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const asyncHandler = require("../middleware/asyncHandler.js");

const {
  createMaterial,
  getMaterials,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materials.js");

router.use(authMiddleware);

router.get("/", asyncHandler(getMaterials));
router.post("/", asyncHandler(createMaterial));
router.put("/:id", asyncHandler(updateMaterial));
router.delete("/:id", asyncHandler(deleteMaterial));

module.exports = router;

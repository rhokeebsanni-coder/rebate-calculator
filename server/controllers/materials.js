// controllers/materials.js
const Material = require("../models/material.js");
const CustomError = require("../errors/custom-error.js");

const createMaterial = async (req, res) => {
  const { name, sku, yieldPerTon } = req.body;

  const material = await Material.create({
    userId: req.user.userId,
    name: name || "New Material",
    sku: sku || `SKU-${Date.now()}`,
    yieldPerTon: yieldPerTon || 1,
  });

  res.status(201).json({
    success: true,
    material,
  });
};

const getMaterials = async (req, res) => {
  const materials = await Material.find({ userId: req.user.userId }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    materials,
  });
};

const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { name, sku, yieldPerTon } = req.body;

  const material = await Material.findByIdAndUpdate(
    id,
    { name, sku, yieldPerTon },
    { new: true },
  );

  if (!material) {
    throw new CustomError("Material not found.", 404);
  }

  res.status(200).json({
    success: true,
    material,
  });
};

const deleteMaterial = async (req, res) => {
  const { id } = req.params;

  const material = await Material.findByIdAndDelete(id);

  if (!material) {
    throw new CustomError("Material not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Material deleted.",
  });
};

module.exports = {
  createMaterial,
  getMaterials,
  updateMaterial,
  deleteMaterial,
};

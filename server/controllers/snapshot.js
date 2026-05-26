const Snapshot = require("../models/snapshot");
const CustomError = require("../errors/custom-error");

const createSnapshot = async (req, res) => {
  const { grossTotal, rebate, netTotal, skus } = req.body;

  // Validate required fields
  if (
    grossTotal === undefined ||
    rebate === undefined ||
    netTotal === undefined
  ) {
    throw new CustomError(
      "Missing required fields: grossTotal, rebate, netTotal.",
      400,
    );
  }

  // Validate and format items
  const validItems = skus
    ? skus
        .filter((item) => item.name && Number(item.yieldperton) > 0)
        .map((item) => ({
          name: item.name,
          yieldperton: Number(item.yieldperton),
          calculatedUnitPrice:
            item.yieldperton > 0 ? netTotal / item.yieldperton : 0,
        }))
    : [];

  if (validItems.length === 0) {
    throw new CustomError("At least one valid item is required.", 400);
  }

  // Create snapshot
  const snapshot = await Snapshot.create({
    userId: req.user.userId,
    grossTotal: Number(grossTotal),
    rebate: Number(rebate),
    netTotal: Number(netTotal),
    items: validItems,
  });

  res.status(201).json({
    success: true,
    message: "Snapshot created successfully.",
    snapshot,
  });
};

const getSnapshots = async (req, res) => {
  const snapshots = await Snapshot.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: snapshots.length,
    snapshots,
  });
};

module.exports = {
  createSnapshot,
  getSnapshots,
};

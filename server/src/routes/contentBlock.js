const express = require("express");
const router = express.Router();
const contentBlockController = require("../controller/contentBlock");
const { validateContentBlock, validateBulkContentBlock, validateReorder } = require("../validator/contentBlock.validate");

// Create single content block
router.post("/", validateContentBlock, contentBlockController.createContentBlock);

// Bulk create content blocks
router.post("/bulk", validateBulkContentBlock, contentBlockController.bulkCreateContentBlocks);

// Get all content blocks with optional filters (packageId, type, isActive)
router.get("/", contentBlockController.getAllContentBlocks);

// Get content block by ID
router.get("/:id", contentBlockController.getContentBlockById);

// Update content block
router.put("/:id", contentBlockController.updateContentBlock);

// Delete content block
router.delete("/:id", contentBlockController.deleteContentBlock);

// Reorder content blocks for a specific package and type
router.put("/reorder/:packageId/:type", validateReorder, contentBlockController.reorderContentBlocks);

module.exports = router;

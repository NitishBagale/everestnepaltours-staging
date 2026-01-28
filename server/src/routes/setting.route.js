const express = require("express");
const {
  createSettingController,
  getAllSettingController,
  updateSettingController,
} = require("../controller/setting.controller");

const router = express.Router();

router.post("/create", createSettingController);
router.get("/get", getAllSettingController);
router.patch("/update", updateSettingController);

module.exports = router;

const {
  createSettingService,
  updateSettingService,
  getAllSettingService,
} = require("../services/setting.service");

exports.createSettingController = async (req, res, next) => {
  const { name, settings } = req.body;
  try {
    const result = await createSettingService({ name, settings });
    res.status(201).json({
      success: true,
      message: "Setting Added Successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllSettingController = async (req, res, next) => {
  try {
    const result = await getAllSettingService();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSettingController = async (req, res, next) => {
  const id = req.query.id;
  const data = req.body;
  try {
    const result = await updateSettingService(id, data);
    res.status(200).json({
      success: true,
      message: "Setting Updated Successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

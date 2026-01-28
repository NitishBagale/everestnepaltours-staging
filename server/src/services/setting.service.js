const Setting = require("../../models/setting.model");

async function createSettingService({ name, settings }) {
  try {
    if (!name) {
      throw new Error("Setting name is required");
    }
    return await Setting.create({ name, settings });
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllSettingService() {
  try {
    return await Setting.findAll({});
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateSettingService(id, data) {
  try {
    const isValidSetting = await Setting.findOne({ where: { id } });
    if (!isValidSetting) {
      throw new Error("Invalid Id");
    }
    return await Setting.update(data, { where: { id } });
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createSettingService,
  updateSettingService,
  getAllSettingService,
};

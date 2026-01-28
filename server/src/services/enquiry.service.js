const Enquiry = require("../../models/enquiry.model");

async function createEnquiryService(enquiryData) {
  try {
    return await Enquiry.create(enquiryData);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllEnquiryService() {
  try {
    return await Enquiry.findAll({});
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteEnquiryService(id) {
  try {
    const result = await Enquiry.destroy({ where: { id } });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateEnquireService(id, updateData) {
  try {
    const result = await Enquiry.update(updateData, { where: { id } });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getEnquireByIdService(id) {
  try {
    const result = await Enquiry.findByPk(id);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createEnquiryService,
  getAllEnquiryService,
  deleteEnquiryService,
  updateEnquireService,
  getEnquireByIdService,
};

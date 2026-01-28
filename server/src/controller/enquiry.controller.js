const Enquiry = require("../../models/enquiry.model");
const { sendEnquiryNotification } = require("../lib/mail/send.mail.js");
const {
  createEnquiryService,
  getAllEnquiryService,
  deleteEnquiryService,
  updateEnquireService,
} = require("../services/enquiry.service");

exports.createEnquiry = async (req, res, next) => {
  const enquiryData = req.body;
  try {
    const result = await createEnquiryService(enquiryData);
        // Send email notification to admin
    try {
      await sendEnquiryNotification({
        name: enquiryData.name,
        email: enquiryData.email,
        contact: enquiryData.contact,
        message: enquiryData.message,
      });
    } catch (emailError) {
      console.error("Failed to send enquiry email notification:", emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: "Enquiry Submitted Successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting enquiry",
      error: error.message,
    });
  }
};

exports.getAllEnquiry = async (req, res, next) => {
  try {
    const result = await getAllEnquiryService();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enquiry",
      error: error.message,
    });
  }
};

exports.updateEnquiry = async (req, res, next) => {
  const id = req.query.id;
  const updateData = req.body;
  try {
    const result = await updateEnquireService(id, updateData);
    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnquiryById = async (req, res, next) => {
  const id = req.query.id;
  try {
    const result = await getEnquireByIdService(id);
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

exports.deleteEnquiry = async (req, res, next) => {
  const id = req.query.id;
  try {
    const result = await deleteEnquiryService(id);
    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

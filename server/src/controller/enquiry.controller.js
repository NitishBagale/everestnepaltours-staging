const { sendEnquiryNotification } = require("../lib/mail/send.mail.js");

exports.createEnquiry = async (req, res, next) => {
  const enquiryData = req.body;
  try {
    await sendEnquiryNotification({
      name: enquiryData.name,
      email: enquiryData.email,
      contact: enquiryData.contact,
      message: enquiryData.message,
    });
    res.status(200).json({
      success: true,
      message: "Enquiry Submitted Successfully",
      data: enquiryData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting enquiry",
      error: error.message,
    });
  }
};

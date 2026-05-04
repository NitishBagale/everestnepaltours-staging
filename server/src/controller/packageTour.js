const {
  createPackageTourService,
  getAllPackageToursService,
  getPackageTourByIdService,
  updatePackageTourService,
  getPackageTourByNameService,
  addReviewServices,
  deletePackageTourService,
  getPackageTourByCategoryIdService,
  getPackageTourByTagsService,
} = require("../services/packageTour");
const sendMail = require("../utils/sendMail");
const { ADMIN_MAIL } = require("../../config/env");

exports.uploadPackageTourImages = async (req, res, next) => {
  try {
    console.log("Files received:", req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }
    let images = req.files.map((file) => file.path);
    console.log("Image URLs:", images);
    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      imageUrls: images,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createPackageTour = async (req, res, next) => {
  try {
    const packageTourData = req.body;
    const newPackageTour = await createPackageTourService(packageTourData);
    res.status(201).json({
      success: true,
      data: newPackageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPackageTours = async (req, res, next) => {
  try {
    const packageTours = await getAllPackageToursService();
    res.status(200).json({
      success: true,
      data: packageTours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPackageTourById = async (req, res, next) => {
  try {
    const packageTourId = req.params.id;
    const packageTour = await getPackageTourByIdService(packageTourId);
    res.status(200).json({
      success: true,
      data: packageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const packageTourId = req.params.id;
    const reviewData = req.body;
    const updatedPackageTour = await addReviewServices(
      packageTourId,
      reviewData
    );
    res.status(200).json({
      success: true,
      data: updatedPackageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPackageTourByName = async (req, res, next) => {
  try {
    const title = req.query.title;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title query parameter is required",
      });
    }
    const packageTour = await getPackageTourByNameService(title);
    if (!packageTour) {
      return res.status(404).json({
        success: false,
        message: "Package tour not found",
      });
    }
    res.status(200).json({
      success: true,
      data: packageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePackageTour = async (req, res, next) => {
  try {
    const id = req.params.id;
    const packageTourData = req.body;
    const updatedPackageTour = await updatePackageTourService(
      id,
      packageTourData
    );
    res.status(200).json({
      success: true,
      data: updatedPackageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletePackageTourById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedPackageTour = await deletePackageTourService(id);
    res.status(200).json({
      success: true,
      data: deletedPackageTour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPackageTourByCategoryId = async(req,res)=>{
  try {
    const categoryId = req.params.categoryId;
    const packageTours = await getPackageTourByCategoryIdService(categoryId);
    res.status(200).json({
      success: true,
      data: packageTours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


exports.getAllPackageTourByTags = async(req,res)=>{
  try {
    const tag = req.params.tag;
    const packageTours = await getPackageTourByTagsService(tag);
    res.status(200).json({
      success: true,
      data: packageTours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

exports.askExpert = async (req, res) => {
  try {
    const packageTourId = req.params.id;
    const { name, email, message } = req.body || {};

    const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }
    if (String(message).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters.",
      });
    }

    const packageTour = await getPackageTourByIdService(packageTourId);
    const packageTitle = packageTour?.package?.title || "Package Tour";

    await sendMail({
      from: `"Everest Vacation" <${ADMIN_MAIL}>`,
      to: ADMIN_MAIL,
      subject: `Ask an Expert: ${packageTitle}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Package:</strong> ${packageTitle}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

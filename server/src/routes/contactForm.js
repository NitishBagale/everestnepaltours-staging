const { Router } = require("express");
const {
  createContactForm,
  uploadQR,
} = require("../controller/contactForm");
const validateContactForm = require("../validator/contactForm");
const { upload } = require("../utils/cloudinary");
const contactFormRouter = Router();

contactFormRouter.post("/upload-images", upload.array("images"), uploadQR);
contactFormRouter.post("/", validateContactForm, createContactForm);

module.exports = contactFormRouter;

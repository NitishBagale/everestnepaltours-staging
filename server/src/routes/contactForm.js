const { Router } = require("express");
const {
  createContactForm,
  getAllContactForms,
  getContactFormById,
  updateContactForm,
  deleteContactForm,
  uploadQR,
} = require("../controller/contactForm");
const validateContactForm = require("../validator/contactForm");
const { upload } = require("../utils/cloudinary");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const contactFormRouter = Router();

contactFormRouter.post("/upload-images", upload.array("images"), uploadQR);
contactFormRouter.post("/", validateContactForm, createContactForm);
contactFormRouter.get(
  "/",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  getAllContactForms
);
contactFormRouter.get("/:id", getContactFormById);
contactFormRouter.put("/:id", validateContactForm, updateContactForm);
contactFormRouter.delete("/:id", deleteContactForm);

module.exports = contactFormRouter;

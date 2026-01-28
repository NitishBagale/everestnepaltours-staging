const express = require("express");
const {
  createEnquiry,
  getAllEnquiry,
  deleteEnquiry,
  updateEnquiry,
  getEnquiryById,
} = require("../controller/enquiry.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const validateEnquiry = require("../validator/enquiry.validate");

const router = express.Router();

router.post("/create", validateEnquiry, createEnquiry);
router.get("/get",isAuthenticated, isAuthorized(["admin", "editor"]), getAllEnquiry);
router.delete(
  "/delete",
  deleteEnquiry
);
router.put("/update", isAuthenticated, isAuthorized(["admin", "editor"]), validateEnquiry, updateEnquiry);
router.get("/getById", isAuthenticated, isAuthorized(["admin", "editor"]), getEnquiryById);

module.exports = router;





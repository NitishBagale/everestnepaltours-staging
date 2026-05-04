const express = require("express");
const {
  createEnquiry,
} = require("../controller/enquiry.controller");
const validateEnquiry = require("../validator/enquiry.validate");

const router = express.Router();

router.post("/create", validateEnquiry, createEnquiry);

module.exports = router;





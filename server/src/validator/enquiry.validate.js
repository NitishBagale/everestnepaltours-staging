const Joi = require("joi");

const enquirySchema = Joi.object({
  name: Joi.string().min(5).max(20).required(),
  email: Joi.string().email().required(),
  contact: Joi.string().required(),
  message: Joi.string().min(5).max(500).optional(),
});

const validateEnquiry = (req, res, next) => {
  const { error } = enquirySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validateEnquiry;

const Joi = require("joi");

const enquirySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  contact: Joi.string().required(),
  message: Joi.string().min(5).max(5000).required(),
});

const validateEnquiry = (req, res, next) => {
  const { error } = enquirySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validateEnquiry;

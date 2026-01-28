const Joi = require("joi");
const otpSchema = Joi.object({
  otp: Joi.number().min(6).max(6).required(),
  email: Joi.string().email().required(),
});

const validateOTP = (req, res, next) => {
  const { error } = otpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validateOTP;

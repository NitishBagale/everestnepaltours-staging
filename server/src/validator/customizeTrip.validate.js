const Joi = require("joi");

const customizeTripSchema = Joi.object({
  tripName: Joi.string().allow("").max(200),
  tripSlug: Joi.string().allow("").max(200),
  travelerType: Joi.string().min(2).max(100).required(),
  travelDateType: Joi.string().min(2).max(200).required(),
  destinations: Joi.array().items(Joi.string().min(2).max(100)).min(1).required(),
  tripDuration: Joi.string().min(1).max(200).required(),
  hotelCategory: Joi.string().min(2).max(100).required(),
  budgetRange: Joi.string().min(1).max(200).required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(3).max(100).required(),
  passportCountry: Joi.string().min(2).max(100).required(),
  customizeDetails: Joi.string().min(20).max(5000).required(),
});

const validateCustomizeTrip = (req, res, next) => {
  const { error } = customizeTripSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

module.exports = validateCustomizeTrip;

const Joi = require("joi");

const bookingSchema = Joi.object({
  bookingDate: Joi.date().required(),
  pickupDate: Joi.string().required(),
  returnDate: Joi.string().optional(),
  totalAmount: Joi.string().required(),
  status: Joi.string().required(),
  paymentStatus: Joi.string().required(),
  pickUp: Joi.string().required(),
  destination: Joi.string().required(),
  anotherDestination: Joi.string().allow(null, ""),
  trvellerInfo: Joi.object({
    fullName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    contactNumber: Joi.string().required(),
    travelDate: Joi.date().required(),
    noOfTravellers: Joi.number().min(1).required(),
    accommodation: Joi.string().min(3).max(50).required(),
    passport: Joi.string().min(5).max(20).required(),
    details: Joi.string().min(5).max(500).required(),
  }).required(),


}).unknown(true);

const validateBooking = (req, res, next) => {
  const { error } = bookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validateBooking;

const Joi = require("joi");

const paymentAndCancellationSchema = Joi.object({
  payment_and_cancellation_policy: Joi.object({
    payment: Joi.object({
      currency: Joi.string().min(3).max(50).required(),
      advance_payment: Joi.string().min(5).max(100).required(),
      methods: Joi.array().items(
        Joi.object({
          option: Joi.string().min(3).max(50).required(),
          details: Joi.object({
            account_number: Joi.string().optional(),
            bank_name: Joi.string().optional(),
            branch: Joi.string().optional(),
            swift_code: Joi.string().optional(),
            beneficiary: Joi.string().optional(),
            address: Joi.string().optional(),
            note: Joi.string().optional(),
            extra_charge: Joi.string().optional(),
            requirements: Joi.array().items(Joi.string()).optional(),
            description: Joi.string().optional()
          }).required()
        })
      ).required()
    }).required(),

    cancellations: Joi.object({
      notice_period: Joi.string().min(5).max(50).required(),
      charges: Joi.array().items(
        Joi.object({
          days_before_arrival: Joi.number().integer().required(),
          charge: Joi.string().required()
        })
      ).required(),
      notes: Joi.array().items(Joi.string()).optional()
    }).required(),

    re_routing_alteration: Joi.object({
      note: Joi.string().min(10).max(1000).required(),
      disclaimer: Joi.string().min(10).max(1000).required()
    }).required(),

    refunds: Joi.object({
      policy: Joi.string().min(10).max(2000).required()
    }).required(),

    liability: Joi.object({
      policy: Joi.string().min(10).max(2000).required()
    }).required(),

    insurance: Joi.object({
      policy: Joi.string().min(10).max(1000).required()
    }).required()
  }).required()
});

const validatePaymentAndCancellationPolicy = (req, res, next) => {
  const { error } = paymentAndCancellationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validatePaymentAndCancellationPolicy;

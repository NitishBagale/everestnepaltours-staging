const Joi = require("joi");

const ContactForm = Joi.object({
    fullName: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(5).max(150).required(),
    message: Joi.string().min(10).max(2000).required(),
    qr: Joi.string().uri().optional(),
})

const validateContactForm = (req, res, next) => {
    const { error } = ContactForm.validate(req.body);
    if (error) {
        console.log(error)
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
module.exports = validateContactForm;
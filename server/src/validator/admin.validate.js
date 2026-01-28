const Joi = require("joi");

const adminSchema = new Joi.object({
    name: Joi.string().min(5).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(20).required(),
    role: Joi.string().required(),
    profileImage: Joi.string().uri(),
})

const validateAdmin = (req, res, next) => {
    const { error } = adminSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

module.exports = validateAdmin
const Joi = require("joi");


const cmsSchema = new Joi.object({
    section : Joi.string().min(3).max(50).required(),    // Add this
    categoryId : Joi.string().optional(),
    contentTitle: Joi.string().optional(),  // Add this
    publish: Joi.boolean().optional(),      // Add this
    content : Joi.object().required(),
    status  : Joi.boolean().required(),
    slug : Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    meta_title: Joi.string().min(3).max(200).optional(),
    meta_description: Joi.string().min(3).max(500).optional(),
    meta_keywords: Joi.string().min(2).max(500).optional(),
    sort_order: Joi.number().integer().min(0).optional(),
})

const validateCms = (req, res, next) => {
    const { error } = cmsSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

module.exports = validateCms

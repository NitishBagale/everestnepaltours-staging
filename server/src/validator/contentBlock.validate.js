const Joi = require("joi");

const contentBlockSchema = Joi.object({
    packageId: Joi.number().integer().required(),
    type: Joi.string().valid('after_description', 'before_faq', 'after_faq', 'custom').required(),
    title: Joi.string().min(3).max(200).optional().allow(null, ''),
    content: Joi.string().min(10).required(),
    order: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional()
}).unknown(true);

const bulkContentBlockSchema = Joi.object({
    packageId: Joi.number().integer().required(),
    blocks: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('after_description', 'before_faq', 'after_faq', 'custom').required(),
            title: Joi.string().min(3).max(200).optional().allow(null, ''),
            content: Joi.string().min(10).required(),
            order: Joi.number().integer().min(0).optional(),
            isActive: Joi.boolean().optional()
        })
    ).min(1).required()
}).unknown(true);

const reorderSchema = Joi.object({
    orderUpdates: Joi.array().items(
        Joi.object({
            id: Joi.string().uuid().required(),
            order: Joi.number().integer().min(0).required()
        })
    ).min(1).required()
}).unknown(true);

const validateContentBlock = (req, res, next) => {
    const { error } = contentBlockSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

const validateBulkContentBlock = (req, res, next) => {
    const { error } = bulkContentBlockSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

const validateReorder = (req, res, next) => {
    const { error } = reorderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

module.exports = {
    validateContentBlock,
    validateBulkContentBlock,
    validateReorder
};

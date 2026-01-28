const Joi = require("joi");


const blogSchema = Joi.object({
  mainTitle: Joi.string().min(3).max(255).required(),
  slug: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  coverImage: Joi.string().uri().required(),
  date: Joi.string().required(),
  blogContant: Joi.string().min(20).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  meta_title: Joi.string().min(3).max(200).optional(),
  meta_description: Joi.string().min(3).max(500).optional(),
  meta_keywords: Joi.string().min(2).max(500).optional(),
})

const validateBlog = (req, res, next) => {
  const { error } = blogSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { blogSchema, validateBlog };

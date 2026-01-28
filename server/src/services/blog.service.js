const { Op, fn } = require("sequelize");
const Blog = require("../../models/blog.model");
const { get } = require("../routes/blog.routes");

const createBlog = async (data) => {
  return await Blog.create(data);
};

const getAllBlogs = async () => {
  return await Blog.findAll({ order: [["createdAt", "DESC"]] });
};

const getBlogBySlug = async (slug) => {
  return await Blog.findOne({ where: { slug } });
};

const updateBlogByName = async (mainTitle, data) => {
  const blog = await Blog.findOne({ where: { mainTitle } });
  if (!blog) return null;
  await blog.update(data);
  return blog;
};

const deleteBlogByName = async (mainTitle) => {
  console.log("Service: Looking for blog with mainTitle:", mainTitle);
  const blog = await Blog.findOne({ where: { mainTitle } });
  console.log("Service: Found blog:", blog ? blog.mainTitle : "null");
  if (!blog) return null;
  await blog.destroy();
  return blog;
};
 const getBlogBySlugWithRelated = async (slug) => {
  try {
    // 1. Get the current blog
    const blog = await Blog.findOne({ where: { slug } });
    if (!blog) return null;

    // Clean tags (remove empty strings)
    const blogTags = (blog.tags || []).filter((tag) => tag.trim() !== "");

    let relatedBlogs = [];

    // 2. Get related blogs based on tags
    if (blogTags.length > 0) {
      relatedBlogs = await Blog.findAll({
        where: {
          id: { [Op.ne]: blog.id }, // Exclude current blog
          tags: { [Op.overlap]: blogTags }, // Match any tags
        },
        order: fn("RANDOM"), // Randomize results
        limit: 3,
      });
    }

    // 3. Fallback: get latest blogs if less than 3
    if (relatedBlogs.length < 3) {
      const additionalBlogs = await Blog.findAll({
        where: {
          id: {
            [Op.notIn]: [blog.id, ...relatedBlogs.map((b) => b.id)],
          },
        },
        order: [["createdAt", "DESC"]],
        limit: 3 - relatedBlogs.length,
      });

      relatedBlogs = [...relatedBlogs, ...additionalBlogs];
    }

    return { blog, relatedBlogs };
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw new Error(`Error fetching blog: ${error.message}`);
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlogByName,
  deleteBlogByName,
  getBlogBySlugWithRelated,
};

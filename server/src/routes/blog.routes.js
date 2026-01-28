const express = require("express");
const blogRouter = express.Router();
const blogController = require("../controller/blog.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

blogRouter.post(
  "/",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  blogController.createBlog
);

blogRouter.get("/", blogController.getBlogs);

blogRouter.get("/by-slug", blogController.getBlogBySlug);

blogRouter.put(
  "/by-name",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  blogController.updateBlogByName
);

blogRouter.delete(
  "/by-name",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  blogController.deleteBlogByName
);

blogRouter.get("/related", blogController.getBlogBySlugWithRelated);

module.exports = blogRouter;

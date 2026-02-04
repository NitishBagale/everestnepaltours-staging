const { Router } = require("express");
const { createCategory, getAllCategories, deleteCategory, updateCategory, getCategoryById } = require("../controller/category");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

const categoryRouter = Router();

categoryRouter.post(
  "/",
  isAuthenticated,
  isAuthorized(["admin", "editor", "superadmin"]),
  createCategory
);
categoryRouter.get("/",  getAllCategories);
categoryRouter.get("/:id",  getCategoryById);
categoryRouter.put(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor", "superadmin"]),
  updateCategory
);
categoryRouter.delete(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor", "superadmin"]),
  deleteCategory
);
module.exports = categoryRouter;

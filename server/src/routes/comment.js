const { Router } = require("express");
const {
  addComment,
  getCommentById,
  getAllComments,
  updateComment,
  deleteComment,
  getCommentByPackageTourName,
} = require("../controller/comment");
const isAuthenticated = require("../middleware/isAuthenticated");

const commentRouter = Router();

commentRouter.post("/", isAuthenticated, addComment);
commentRouter.get("/", getAllComments);
commentRouter.get("/by-package/:packageTourName", getCommentByPackageTourName);
commentRouter.get("/:id", getCommentById);
commentRouter.put("/:id", isAuthenticated, updateComment);
commentRouter.delete("/:id", isAuthenticated, deleteComment);

module.exports = commentRouter;

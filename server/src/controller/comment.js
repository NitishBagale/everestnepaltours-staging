const {
  addCommentServices,
  getAllCommentsService,
  deleteCommentService,
  updateCommentService,
  getCommentsByIdService,
  getCommentByPackageTourNameService,
} = require("../services/comment");

exports.addComment = async (req, res, next) => {
  try {
    const commentData = req.body;
    const newComment = await addCommentServices(commentData);
    res.status(200).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllComments = async (req, res, next) => {
  try {
    const comments = await getAllCommentsService();
    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCommentById = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await getCommentsByIdService(commentId);
    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCommentByPackageTourName = async (req, res, next) => {
  try {
    const packageTourName = req.params.packageTourName;
    const comments = await getCommentByPackageTourNameService(packageTourName);
    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const updateData = req.body;
    const updatedComment = await updateCommentService(commentId, updateData);
    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const deletedComment = await deleteCommentService(commentId);
    res.status(200).json({
      success: true,
      data: deletedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

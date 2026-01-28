const Comment = require("../../models/comment");

async function addCommentServices(commentData) {
    try {
        return await Comment.create(commentData);
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getCommentsByIdService(id) {
    try {
        return await Comment.findAll({ where: { id } });
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getAllCommentsService() {
    try {
        return await Comment.findAll({});
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getCommentByPackageTourNameService(packageTourName) {
    try {
        return await Comment.findAll({ where: { packageTourName } });
    } catch (error) {
        throw new Error(error.message);
    }
}

async function updateCommentService(id, updateData) {
    try {
        const comment = await Comment.findByPk(id);
        if (!comment) {
            throw new Error("Comment not found");
        }
        return await comment.update(updateData);
    } catch (error) {
        throw new Error(error.message);
    }
}

async function deleteCommentService(id) {
    try {
        const result = await Comment.destroy({ where: { id } });
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    addCommentServices,
    getCommentsByIdService,
    getAllCommentsService,
    getCommentByPackageTourNameService,
    updateCommentService,
    deleteCommentService
}
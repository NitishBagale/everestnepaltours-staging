const {
    createContentBlockService,
    getAllContentBlocksService,
    getContentBlockByIdService,
    updateContentBlockService,
    deleteContentBlockService,
    reorderContentBlocksService,
    bulkCreateContentBlocksService
} = require("../services/contentBlock");

exports.createContentBlock = async (req, res) => {
    try {
        const blockData = req.body;
        const contentBlock = await createContentBlockService(blockData);
        
        res.status(201).json({
            success: true,
            message: "Content block created successfully",
            data: contentBlock
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllContentBlocks = async (req, res) => {
    try {
        const { packageId, type, isActive } = req.query;
        
        const filters = {};
        if (packageId) filters.packageId = packageId;
        if (type) filters.type = type;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        
        const contentBlocks = await getAllContentBlocksService(filters);
        
        res.status(200).json({
            success: true,
            data: contentBlocks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getContentBlockById = async (req, res) => {
    try {
        const { id } = req.params;
        const contentBlock = await getContentBlockByIdService(id);
        
        res.status(200).json({
            success: true,
            data: contentBlock
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateContentBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const updatedBlock = await updateContentBlockService(id, updateData);
        
        res.status(200).json({
            success: true,
            message: "Content block updated successfully",
            data: updatedBlock
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteContentBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteContentBlockService(id);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.reorderContentBlocks = async (req, res) => {
    try {
        const { packageId, type } = req.params;
        const { orderUpdates } = req.body;
        
        if (!Array.isArray(orderUpdates)) {
            return res.status(400).json({
                success: false,
                message: "orderUpdates must be an array of {id, order}"
            });
        }
        
        const reorderedBlocks = await reorderContentBlocksService(
            packageId,
            type,
            orderUpdates
        );
        
        res.status(200).json({
            success: true,
            message: "Content blocks reordered successfully",
            data: reorderedBlocks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.bulkCreateContentBlocks = async (req, res) => {
    try {
        const { packageId, blocks } = req.body;
        
        if (!packageId || !Array.isArray(blocks)) {
            return res.status(400).json({
                success: false,
                message: "packageId and blocks array are required"
            });
        }
        
        const createdBlocks = await bulkCreateContentBlocksService(packageId, blocks);
        
        res.status(201).json({
            success: true,
            message: "Content blocks created successfully",
            data: createdBlocks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

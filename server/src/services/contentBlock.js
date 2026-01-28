const ContentBlock = require("../../models/contentBlock");
const PackageTour = require("../../models/packageTour");
const { Op } = require("sequelize");

async function createContentBlockService(blockData) {
    try {
        // Validate that package exists
        const packageExists = await PackageTour.findByPk(blockData.packageId);
        if (!packageExists) {
            throw new Error(`Package with id ${blockData.packageId} not found. Please use a valid packageId.`);
        }

        // If order not provided, get the next available order number
        if (blockData.order === undefined || blockData.order === null) {
            const maxOrder = await ContentBlock.max('order', {
                where: {
                    packageId: blockData.packageId,
                    type: blockData.type
                }
            });
            blockData.order = (maxOrder || 0) + 1;
        }

        const contentBlock = await ContentBlock.create(blockData);
        return contentBlock;
    } catch (error) {
        throw new Error(`Failed to create content block: ${error.message}`);
    }
}

async function getAllContentBlocksService(filters = {}) {
    try {
        const where = {};
        
        if (filters.packageId) {
            where.packageId = filters.packageId;
        }
        
        if (filters.type) {
            where.type = filters.type;
        }
        
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        const contentBlocks = await ContentBlock.findAll({
            where,
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });
        
        return contentBlocks;
    } catch (error) {
        throw new Error(`Failed to get content blocks: ${error.message}`);
    }
}

async function getContentBlockByIdService(id) {
    try {
        const contentBlock = await ContentBlock.findByPk(id);
        
        if (!contentBlock) {
            throw new Error("Content block not found");
        }
        
        return contentBlock;
    } catch (error) {
        throw new Error(`Failed to get content block: ${error.message}`);
    }
}

async function updateContentBlockService(id, updateData) {
    try {
        const contentBlock = await ContentBlock.findByPk(id);
        
        if (!contentBlock) {
            throw new Error("Content block not found");
        }

        await contentBlock.update(updateData);
        return contentBlock;
    } catch (error) {
        throw new Error(`Failed to update content block: ${error.message}`);
    }
}

async function deleteContentBlockService(id) {
    try {
        const contentBlock = await ContentBlock.findByPk(id);
        
        if (!contentBlock) {
            throw new Error("Content block not found");
        }

        await contentBlock.destroy();
        return { message: "Content block deleted successfully" };
    } catch (error) {
        throw new Error(`Failed to delete content block: ${error.message}`);
    }
}

async function reorderContentBlocksService(packageId, type, orderUpdates) {
    try {
        // orderUpdates should be an array of { id, order }
        const updatePromises = orderUpdates.map(({ id, order }) =>
            ContentBlock.update(
                { order },
                {
                    where: {
                        id,
                        packageId,
                        type
                    }
                }
            )
        );

        await Promise.all(updatePromises);
        
        return await getAllContentBlocksService({ packageId, type });
    } catch (error) {
        throw new Error(`Failed to reorder content blocks: ${error.message}`);
    }
}

async function bulkCreateContentBlocksService(packageId, blocks) {
    try {
        const blocksWithPackageId = blocks.map((block, index) => ({
            ...block,
            packageId,
            order: block.order !== undefined ? block.order : index + 1
        }));

        const createdBlocks = await ContentBlock.bulkCreate(blocksWithPackageId);
        return createdBlocks;
    } catch (error) {
        throw new Error(`Failed to bulk create content blocks: ${error.message}`);
    }
}

module.exports = {
    createContentBlockService,
    getAllContentBlocksService,
    getContentBlockByIdService,
    updateContentBlockService,
    deleteContentBlockService,
    reorderContentBlocksService,
    bulkCreateContentBlocksService
};

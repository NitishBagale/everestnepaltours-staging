const Media = require("../../models/media");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const PackageTour = require("../../models/packageTour");
const axios = require("axios");
const { Op } = require("sequelize");


async function processImage(filePath) {
    const sizes = {
        thumbnail: { width: 150, height: 150 },
        small: { width: 400 },
        medium: { width: 800 },
        large: { width: 1200 }
    };
    const variants = {};
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    const metadata = await sharp(filePath).metadata();

    for (const [key, size] of Object.entries(sizes)) {
        const output = path.join(dir, `${name}_${key}${ext}`);
        await sharp(filePath)
            .resize({
                width: size.width,
                height: size.height,
                fit: "inside",
                withoutEnlargement: true,
            })
            .toFile(output)
            .jpeg({ quality: 85 });
        variants[key] = output;
    }
    return { variants, width: metadata.width, height: metadata.height };
}

/**
 * Generate Cloudinary transformation URLs
 */
function generateCloudinaryVariants(cloudinaryUrl) {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
        return {};
    }

    const sizes = {
        thumbnail: 'c_limit,w_150,h_150',
        small: 'c_limit,w_400',
        medium: 'c_limit,w_800',
        large: 'c_limit,w_1200'
    };

    const variants = {};
    const urlParts = cloudinaryUrl.split('/upload/');
    
    if (urlParts.length === 2) {
        for (const [key, transformation] of Object.entries(sizes)) {
            variants[key] = `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
        }
    }

    return variants;
}

/**
 * Fetch image dimensions from Cloudinary URL
 */
async function getCloudinaryDimensions(cloudinaryUrl) {
    try {
        const response = await axios.get(cloudinaryUrl, {
            responseType: 'arraybuffer',
            timeout: 5000
        });
        const metadata = await sharp(Buffer.from(response.data)).metadata();
        return { width: metadata.width, height: metadata.height };
    } catch (error) {
        console.warn("Failed to fetch dimensions:", error.message);
        return { width: null, height: null };
    }
}

async function createMediaService(mediaData) {
    try {
        const { url, mimeType, width: providedWidth, height: providedHeight, hash } = mediaData;

        if (hash) {
            const existing = await Media.findOne({ where: { hash } });
            if (existing) {
                return existing;
            }
        }
        
        // Check if it's a Cloudinary URL or local file
        const isCloudinary = url.includes('cloudinary.com');
        
        let variants = {};
        let width = providedWidth || null;
        let height = providedHeight || null;

        if (isCloudinary) {
            // Use Cloudinary transformations
            variants = generateCloudinaryVariants(url);
            
            // Fetch dimensions if not provided
            if (!width || !height) {
                const dimensions = await getCloudinaryDimensions(url);
                width = dimensions.width;
                height = dimensions.height;
            }
        } else if (mimeType && mimeType.startsWith('image/')) {
            // Process local files with Sharp
            const processed = await processImage(url);
            variants = processed.variants;
            width = processed.width;
            height = processed.height;
        }

        const media = await Media.create({
            ...mediaData,
            variants,
            width,
            height
        });
        
        return media;
    } catch (error) {
        throw new Error(`Failed to create media: ${error.message}`);
    }
}

async function getAllMediaService() {
    try {
        const mediaList = await Media.findAll();
        return mediaList;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function listMediaService({ search = "", page = 1, limit = 24 } = {}) {
    try {
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
        const offset = (parsedPage - 1) * parsedLimit;

        const where = search
            ? {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${search}%` } },
                    { originalName: { [Op.iLike]: `%${search}%` } },
                    { altText: { [Op.iLike]: `%${search}%` } },
                ],
            }
            : undefined;

        const result = await Media.findAndCountAll({
            where,
            order: [["createdAt", "DESC"]],
            limit: parsedLimit,
            offset,
        });

        return {
            data: result.rows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total: result.count,
                totalPages: Math.ceil(result.count / parsedLimit),
            },
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getMediaByIdService(id){
    try {
        const media = await Media.findByPk(id);
        return media;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateMediaService(id, data) {
    try {
        const media = await Media.findByPk(id);
        if (!media) return null;
        await media.update(data);
        return media;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteMediaService(id) {
    try {
        const media = await Media.findByPk(id);
        if (!media) return null;
        await media.destroy();
        return media;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getMediaUsageService(id){
    try {
        const packageCount = await PackageTour.count({
            where: { 'package.mediaId': id }
        });
        return ({
            packageCount
        })
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    createMediaService,
    getAllMediaService,
    getMediaByIdService,
    updateMediaService,
    deleteMediaService,
    getMediaUsageService,
    listMediaService
}

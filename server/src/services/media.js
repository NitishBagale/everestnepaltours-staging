const Media = require("../../models/media");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const PackageTour = require("../../models/packageTour");
const axios = require("axios");
const { Op } = require("sequelize");
const { cloudinary } = require("../utils/cloudinary");

function getCloudinaryAssetDetails(media) {
    const metaData = media?.metaData || {};
    const url = media?.url || metaData?.secureUrl || "";

    if (metaData?.publicId) {
        return {
            publicId: metaData.publicId,
            folder: metaData.folder || "",
            resourceType: metaData.resourceType || "image",
        };
    }

    if (!url || !url.includes("cloudinary.com")) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        const uploadIndex = pathParts.findIndex((part) => part === "upload");
        if (uploadIndex === -1) return null;

        const assetParts = pathParts.slice(uploadIndex + 1);
        while (assetParts.length && !/^v\d+$/.test(assetParts[0])) {
            assetParts.shift();
        }
        if (assetParts.length && /^v\d+$/.test(assetParts[0])) {
            assetParts.shift();
        }
        if (!assetParts.length) return null;

        const lastPart = assetParts[assetParts.length - 1];
        assetParts[assetParts.length - 1] = lastPart.replace(/\.[^.]+$/, "");
        const publicId = assetParts.join("/");
        const folder = assetParts.slice(0, -1).join("/");
        const resourceType = pathParts[2] || "image";

        return { publicId, folder, resourceType };
    } catch (error) {
        return null;
    }
}

function getMediaFolder(media) {
    return getCloudinaryAssetDetails(media)?.folder || "";
}

function getFolderFromPublicId(publicId = "") {
    const parts = String(publicId).split("/").filter(Boolean);
    return parts.slice(0, -1).join("/");
}

function getCloudinaryResourceFolder(resource = {}) {
    return (
        resource.asset_folder ||
        resource.folder ||
        getFolderFromPublicId(resource.public_id || "")
    );
}

function chunkArray(items = [], size = 100) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function mapCloudinaryResource(resource, mediaRecord = null) {
    return {
        id: mediaRecord?.id || `cloudinary:${resource.public_id}`,
        url: mediaRecord?.url || resource.secure_url,
        originalName: mediaRecord?.originalName || resource.filename || resource.public_id.split("/").pop(),
        mimeType: mediaRecord?.mimeType || (resource.format ? `image/${resource.format}` : "image/*"),
        size: mediaRecord?.size || resource.bytes || 0,
        title: mediaRecord?.title || resource.filename || resource.public_id.split("/").pop(),
        altText: mediaRecord?.altText || "",
        width: mediaRecord?.width || resource.width || null,
        height: mediaRecord?.height || resource.height || null,
        variants: mediaRecord?.variants || generateCloudinaryVariants(resource.secure_url),
        metaData: {
            ...(mediaRecord?.metaData || {}),
            publicId: resource.public_id,
            folder: getCloudinaryResourceFolder(resource),
            resourceType: resource.resource_type || "image",
            secureUrl: resource.secure_url,
            source: mediaRecord ? "database" : "cloudinary",
        },
        createdAt: mediaRecord?.createdAt || resource.created_at,
    };
}

async function collectCloudinaryFolders(prefix = "") {
    const response = prefix
        ? await cloudinary.api.sub_folders(prefix)
        : await cloudinary.api.root_folders();
    const folders = Array.isArray(response?.folders) ? response.folders : [];
    let allFolders = folders.map((folder) => folder.path).filter(Boolean);

    for (const folder of folders) {
        const nested = await collectCloudinaryFolders(folder.path);
        allFolders = [...allFolders, ...nested];
    }

    return allFolders;
}

async function listCloudinaryFolderAssetsService({ folder = "", search = "", page = 1, limit = 24 } = {}) {
    try {
        const normalizedFolder = String(folder || "").trim();
        if (!normalizedFolder) {
            return {
                data: [],
                pagination: {
                    page: 1,
                    limit: Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100),
                    total: 0,
                    totalPages: 1,
                },
            };
        }

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);

        const [prefixedResourcesResponse, assetFolderSearchResponse, mediaRows] = await Promise.all([
            cloudinary.api.resources({
                type: "upload",
                resource_type: "image",
                prefix: `${normalizedFolder}/`,
                max_results: 500,
            }).catch(() => ({ resources: [] })),
            cloudinary.search
                .expression(`asset_folder="${normalizedFolder}" AND resource_type="image"`)
                .max_results(500)
                .execute()
                .catch(() => ({ resources: [] })),
            Media.findAll(),
        ]);

        const mediaByPublicId = new Map();
        const mediaByUrl = new Map();
        mediaRows.forEach((item) => {
            const details = getCloudinaryAssetDetails(item);
            if (details?.publicId) mediaByPublicId.set(details.publicId, item);
            if (item?.url) mediaByUrl.set(item.url, item);
        });

        const allResources = [
            ...(Array.isArray(prefixedResourcesResponse?.resources)
                ? prefixedResourcesResponse.resources
                : []),
            ...(Array.isArray(assetFolderSearchResponse?.resources)
                ? assetFolderSearchResponse.resources
                : []),
        ];

        const uniqueResources = Array.from(
            new Map(allResources.map((resource) => [resource.public_id, resource])).values()
        );

        const exactFolderResources = uniqueResources.filter(
            (resource) => getCloudinaryResourceFolder(resource) === normalizedFolder
        );

        const mapped = exactFolderResources.map((resource) =>
            mapCloudinaryResource(
                resource,
                mediaByPublicId.get(resource.public_id) || mediaByUrl.get(resource.secure_url) || null
            )
        );

        const normalizedSearch = String(search || "").trim().toLowerCase();
        const filtered = normalizedSearch
            ? mapped.filter((item) =>
                [item.title, item.originalName, item.altText]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(normalizedSearch))
            )
            : mapped;

        const total = filtered.length;
        const offset = (parsedPage - 1) * parsedLimit;
        const pagedRows = filtered.slice(offset, offset + parsedLimit);

        return {
            data: pagedRows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
            },
        };
    } catch (error) {
        throw new Error(`Failed to load folder assets: ${error.message}`);
    }
}

async function pruneMissingCloudinaryMediaRows(mediaRows = []) {
    const cloudinaryRows = mediaRows.filter((item) => {
        const details = getCloudinaryAssetDetails(item);
        return details?.publicId;
    });

    if (!cloudinaryRows.length) {
        return mediaRows;
    }

    try {
        const groupedPublicIds = new Map();
        const rowDetailsById = new Map();

        cloudinaryRows.forEach((item) => {
            const details = getCloudinaryAssetDetails(item);
            if (!details?.publicId) return;

            const resourceType = details.resourceType || "image";
            rowDetailsById.set(item.id, details);

            if (!groupedPublicIds.has(resourceType)) {
                groupedPublicIds.set(resourceType, new Set());
            }
            groupedPublicIds.get(resourceType).add(details.publicId);
        });

        const existingKeys = new Set();

        for (const [resourceType, publicIdSet] of groupedPublicIds.entries()) {
            const publicIds = Array.from(publicIdSet);
            const batches = chunkArray(publicIds, 100);

            for (const batch of batches) {
                const response = await cloudinary.api.resources_by_ids(batch, {
                    resource_type: resourceType,
                    type: "upload",
                    max_results: batch.length,
                });
                const resources = Array.isArray(response?.resources) ? response.resources : [];

                resources.forEach((resource) => {
                    if (resource?.public_id) {
                        existingKeys.add(`${resourceType}:${resource.public_id}`);
                    }
                });
            }
        }

        const staleIds = cloudinaryRows
            .filter((item) => {
                const details = rowDetailsById.get(item.id);
                if (!details?.publicId) return false;
                const resourceType = details.resourceType || "image";
                return !existingKeys.has(`${resourceType}:${details.publicId}`);
            })
            .map((item) => item.id);

        if (staleIds.length) {
            await Media.destroy({
                where: { id: staleIds },
                force: true,
            });
        }

        return mediaRows.filter((item) => !staleIds.includes(item.id));
    } catch (error) {
        console.warn("Failed to prune missing Cloudinary media rows:", error.message);
        return mediaRows;
    }
}


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
        const {
            url,
            mimeType,
            width: providedWidth,
            height: providedHeight,
            hash,
            metaData = {},
        } = mediaData;

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
            height,
            metaData,
        });
        
        return media;
    } catch (error) {
        throw new Error(`Failed to create media: ${error.message}`);
    }
}

async function getAllMediaService() {
    try {
        const mediaList = await Media.findAll();
        return pruneMissingCloudinaryMediaRows(mediaList);
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function listMediaService({ search = "", page = 1, limit = 24, folder = "" } = {}) {
    try {
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);

        const where = search
            ? {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${search}%` } },
                    { originalName: { [Op.iLike]: `%${search}%` } },
                    { altText: { [Op.iLike]: `%${search}%` } },
                ],
            }
            : undefined;

        const result = await Media.findAll({
            where,
            order: [["createdAt", "DESC"]],
        });
        const cleanedResult = await pruneMissingCloudinaryMediaRows(result);

        const normalizedFolder = String(folder || "").trim();
        const filteredRows = normalizedFolder
            ? cleanedResult.filter((item) => getMediaFolder(item) === normalizedFolder)
            : cleanedResult;
        const total = filteredRows.length;
        const offset = (parsedPage - 1) * parsedLimit;
        const pagedRows = filteredRows.slice(offset, offset + parsedLimit);

        return {
            data: pagedRows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
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
    const media = await Media.findByPk(id);
    if (!media) return null;

    const cloudinaryAsset = getCloudinaryAssetDetails(media);
    if (cloudinaryAsset?.publicId) {
        const destroyResult = await cloudinary.uploader.destroy(
            cloudinaryAsset.publicId,
            {
                resource_type: cloudinaryAsset.resourceType || "image",
                invalidate: true,
            }
        );

        if (destroyResult?.result && destroyResult.result !== "ok" && destroyResult.result !== "not found") {
            throw new Error(`Cloudinary deletion failed: ${destroyResult.result}`);
        }
    }

    await media.destroy();
    return media;
}

async function deleteCloudinaryAssetService({ publicId, resourceType = "image" }) {
    try {
        if (!publicId) {
            throw new Error("Cloudinary publicId is required");
        }

        const destroyResult = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType || "image",
            invalidate: true,
        });

        if (destroyResult?.result && destroyResult.result !== "ok" && destroyResult.result !== "not found") {
            throw new Error(`Cloudinary deletion failed: ${destroyResult.result}`);
        }

        const mediaRows = await Media.findAll().catch(() => []);
        const media = mediaRows.find((item) => {
            const details = getCloudinaryAssetDetails(item);
            return details?.publicId === publicId;
        });

        if (media) {
            await media.destroy();
        }

        return { success: true };
    } catch (error) {
        throw new Error(error.message);
    }
}

async function listCloudinaryFoldersService() {
    try {
        const folders = await collectCloudinaryFolders();
        return Array.from(new Set(folders)).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        throw new Error(`Failed to load Cloudinary folders: ${error.message}`);
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
    deleteCloudinaryAssetService,
    getMediaUsageService,
    listMediaService,
    listCloudinaryFoldersService,
    listCloudinaryFolderAssetsService
}

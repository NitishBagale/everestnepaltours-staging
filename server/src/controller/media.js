const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
const {
  createMediaService,
  getMediaByIdService,
  getAllMediaService,
  deleteMediaService,
  updateMediaService,
  getMediaUsageService,
  listMediaService,
} = require("../services/media");

async function computeFileHash(file) {
  try {
    if (!file?.path) return null;
    let buffer;
    if (/^https?:\/\//i.test(file.path)) {
      const response = await axios.get(file.path, {
        responseType: "arraybuffer",
        timeout: 10000,
      });
      buffer = Buffer.from(response.data);
    } else if (fs.existsSync(file.path)) {
      buffer = fs.readFileSync(file.path);
    } else {
      return null;
    }

    return crypto.createHash("sha256").update(buffer).digest("hex");
  } catch (error) {
    console.warn("Failed to compute hash:", error.message);
    return null;
  }
}

exports.createMedia = async (req, res) => {
    try {
        const {title, altText, category} = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        
        // Log to see what Cloudinary returns
        console.log("Cloudinary file object:", JSON.stringify(file, null, 2));
        
        // Extract dimensions from Cloudinary metadata
        const width = file.width || file.metadata?.width || null;
        const height = file.height || file.metadata?.height || null;
        
        const hash = await computeFileHash(file);
        const mediaData = await createMediaService({
            title: title || req.file.originalname,
            altText,
            category,
            uploadedBy: req.user?.id || null,
            originalName: req.file.originalname,
            url: req.file.path,
            mimeType: req.file.mimetype,
            size: req.file.size,
            width,
            height,
            hash
        });
        res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            data: mediaData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getAllMedia = async (req, res) => {
    try {
        const { search, page, limit } = req.query;
        if (search || page || limit) {
            const result = await listMediaService({ search, page, limit });
            return res.status(200).json({
                success: true,
                ...result,
            });
        }

        const mediaList = await getAllMediaService();
        res.status(200).json({
            success: true,
            data: mediaList,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    }

exports.getMediaById = async (req, res) => {
    try {
        const media = await getMediaByIdService(req.params.id);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }
        res.status(200).json(media);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getMediaUsage = async (req, res) => {
    try {
        const usage = await getMediaUsageService(req.params.id);
        res.status(200).json(usage);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.updateMedia = async (req, res) => {
    try {
        const updatedMedia = await updateMediaService(req.params.id, req.body);
        if (!updatedMedia) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }
        res.status(200).json(updatedMedia);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.deleteMedia = async (req, res) => {
    try {
        const deletedMedia = await deleteMediaService(req.params.id);
        if (!deletedMedia) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }
        res.status(200).json({ success: true, message: "Media deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.bulkUploadMedia = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }
        const uploadResults = [];
        for (const file of files) {
            const hash = await computeFileHash(file);
            const mediaData = await createMediaService({
                title: req.body.title || file.originalname,
                altText: req.body.altText || '',
                category: req.body.category || 'uncategorized',
                uploadedBy: req.user?.id || null,
                originalName: file.originalname,
                url: file.path,
                mimeType: file.mimetype,
                size: file.size,
                width: file.width || null,
                height: file.height || null,
                hash
            });
            uploadResults.push(mediaData);
        }
        res.status(201).json({ success: true, data: uploadResults });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

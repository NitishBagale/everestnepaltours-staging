const slugify = require('slugify');

/**
 * Generate a clean, SEO-friendly slug from text
 * @param {string} text - The text to convert to slug
 * @returns {string} - Clean slug
 */
function generateSlug(text) {
    if (!text) return '';
    
    return slugify(text, {
        lower: true,           // Convert to lowercase
        strict: true,          // Strip special characters except replacement
        remove: /[*+~.()'"!:@]/g,  // Remove specific characters
        replacement: '-',      // Replace spaces with hyphens
        trim: true            // Trim leading/trailing replacement chars
    });
}

/**
 * Generate unique slug by checking existing slugs
 * @param {string} text - The text to convert to slug
 * @param {Object} model - Sequelize model to check against
 * @param {string} id - Optional ID to exclude from uniqueness check (for updates)
 * @param {string} slugField - Name of the slug field (default: 'slug')
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(text, model, id = null, slugField = 'slug') {
    const baseSlug = generateSlug(text);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const where = { [slugField]: slug };
        
        // Exclude current record when updating
        if (id) {
            where.id = { [require('sequelize').Op.ne]: id };
        }

        const existing = await model.findOne({ where });
        
        if (!existing) {
            return slug;
        }

        // Append counter if slug exists
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

/**
 * Generate unique slug for package JSONB structure
 * @param {string} text - The text to convert to slug
 * @param {Object} model - Sequelize model (PackageTour)
 * @param {number} id - Optional ID to exclude from uniqueness check
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniquePackageSlug(text, model, id = null) {
    const { Op } = require('sequelize');
    const baseSlug = generateSlug(text);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const where = {
            'package.slug': slug
        };
        
        // Exclude current record when updating
        if (id) {
            where.id = { [Op.ne]: id };
        }

        const existing = await model.findOne({ where });
        
        if (!existing) {
            return slug;
        }

        // Append counter if slug exists
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

/**
 * Validate if a slug is properly formatted
 * @param {string} slug - The slug to validate
 * @returns {boolean} - True if valid
 */
function isValidSlug(slug) {
    // Only lowercase letters, numbers, and hyphens
    // Must not start or end with hyphen
    // No consecutive hyphens
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugPattern.test(slug);
}

/**
 * Clean an existing slug (fix encoding issues)
 * @param {string} slug - The slug to clean
 * @returns {string} - Cleaned slug
 */
function cleanSlug(slug) {
    if (!slug) return '';
    
    // Decode URL encoding (%20, %2C, etc.)
    let decoded = decodeURIComponent(slug);
    
    // Generate clean slug from decoded text
    return generateSlug(decoded);
}

module.exports = {
    generateSlug,
    generateUniqueSlug,
    generateUniquePackageSlug,
    isValidSlug,
    cleanSlug
};

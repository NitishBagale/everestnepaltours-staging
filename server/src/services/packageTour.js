const PackageTour = require("../../models/packageTour");
const { postgres } = require("../../config/db/postgres/connectPostgres");
const { generateUniquePackageSlug, cleanSlug } = require("../utils/slugGenerator");
const crypto = require("crypto");

function normalizeItinerary(itinerary = []) {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map((item, index) => {
    const order = typeof item.order === "number" ? item.order : index + 1;
    return {
      id: item.id || crypto.randomUUID(),
      ...item,
      order,
    };
  });
}

async function createPackageTourService(packageTourData) {
  try {
    console.log(packageTourData);
    
    // Generate slug from title if not provided
    if (packageTourData.package) {
      if (packageTourData.package.title) {
        if (!packageTourData.package.slug) {
          packageTourData.package.slug = await generateUniquePackageSlug(
            packageTourData.package.title,
            PackageTour
          );
        } else {
          packageTourData.package.slug = cleanSlug(packageTourData.package.slug);
        }
      }

      if (Array.isArray(packageTourData.package.itinerary)) {
        packageTourData.package.itinerary = normalizeItinerary(
          packageTourData.package.itinerary
        );
      }
    }
    
    return await PackageTour.create({ ...packageTourData });
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllPackageToursService() {
  try {
    return await PackageTour.findAll({});
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getPackageTourByIdService(id) {
  try {
    return await PackageTour.findByPk(id);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function addReviewServices(packageTourId, reviewData) {
  try {
    const packageTour = await PackageTour.findByPk(packageTourId);
    if (!packageTour) {
      throw new Error("Package Tour not found");
    }
    
    // Create a new package object with the review added
    const updatedPackage = { ...packageTour.package };
    const updatedReviews = updatedPackage.review ? [...updatedPackage.review, reviewData] : [reviewData];
    updatedPackage.review = updatedReviews;
    
    // Update the package field and mark it as changed
    packageTour.package = updatedPackage;
    packageTour.changed('package', true);
    
    await packageTour.save();
    return packageTour;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getPackageTourByNameService(title) {
  try {
    const packageTours = await PackageTour.findAll();

    // Filter in JavaScript since JSONB search is tricky
    const found = packageTours.find(
      (tour) =>
        tour.package &&
        tour.package.title &&
        tour.package.title.toLowerCase().includes(title.toLowerCase())
    );

    return found || null;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updatePackageTourService(id, updateData) {
  try {
    const packageTour = await PackageTour.findByPk(id);
    if (!packageTour) {
      throw new Error("Package Tour not found");
    }
    
    // Regenerate slug if title changed and slug not explicitly provided
    if (updateData.package) {
      if (updateData.package.title) {
        if (!updateData.package.slug ||
          (packageTour.package.title !== updateData.package.title)) {
          updateData.package.slug = await generateUniquePackageSlug(
            updateData.package.title,
            PackageTour,
            id
          );
        } else {
          updateData.package.slug = cleanSlug(updateData.package.slug);
        }
      } else if (updateData.package.slug) {
        updateData.package.slug = cleanSlug(updateData.package.slug);
      }

      if (Array.isArray(updateData.package.itinerary)) {
        updateData.package.itinerary = normalizeItinerary(
          updateData.package.itinerary
        );
      }
    }
    
    return await packageTour.update(updateData);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deletePackageTourService(id) {
  try {
    const result = await PackageTour.destroy({ where: { id } });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getPackageTourByCategoryIdService(categoryId) {
  try {
    const packageTours = await PackageTour.findAll({
      where: postgres.where(
        postgres.fn('jsonb_extract_path_text', postgres.col('package'), 'categoryId'),
        categoryId
      )
    });
    return packageTours;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getPackageTourByTagsService(tag) {
  try {
    const packageTours = await PackageTour.findAll({
      where: postgres.literal(`package->'tags' ? '${tag}'`)
    });
    return packageTours;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createPackageTourService,
  getAllPackageToursService,
  getPackageTourByIdService,
  getPackageTourByNameService,
  addReviewServices,
  updatePackageTourService,
  deletePackageTourService,
  getPackageTourByCategoryIdService,
  getPackageTourByTagsService
};

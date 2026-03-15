import cloudinary from "cloudinary";
import Gallery from "../models/Gallery.js";

export const uploadGalleryImage = async (req, res) => {
  try {
    // Configure Cloudinary at request time to ensure env vars are loaded
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const { title, description, eventCategory } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!title || !eventCategory) {
      return res.status(400).json({ error: "Title and event category are required" });
    }

    // Upload to Cloudinary using Promise wrapper for stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: `chinmayi_events/${eventCategory.toLowerCase()}`,
          public_id: `${Date.now()}_${title.replace(/\s+/g, "_")}`,
          quality: "auto",
          fetch_format: "auto"
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write the buffer directly to the upload stream
      uploadStream.end(req.file.buffer);
    });

    // Save metadata to MongoDB
    const gallery = new Gallery({
      title,
      description: description || "",
      eventCategory: eventCategory.toLowerCase(),
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      mediaType: uploadResult.resource_type === "video" ? "video" : "image",
      isFeatured: false
    });

    await gallery.save();

    return res.status(201).json({
      message: "Image uploaded successfully",
      gallery
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({
      error: "Failed to upload image",
      details: error.message
    });
  }
};

export const getGalleriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const galleries = await Gallery.find({
      eventCategory: category.toLowerCase()
    }).sort({ uploadedAt: -1 });

    if (galleries.length === 0) {
      return res.status(200).json({
        message: "No images found for this category",
        galleries: []
      });
    }

    res.status(200).json({
      message: "Galleries retrieved successfully",
      galleries
    });
  } catch (error) {
    console.error("Error fetching galleries:", error);
    res.status(500).json({
      error: "Failed to fetch galleries",
      details: error.message
    });
  }
};

export const getAllCategoriesWithFeatured = async (req, res) => {
  try {
    const categories = [
      "wedding",
      "birthday",
      "engagement",
      "reception",
      "haldi(pre-wedding)",
      "naming-ceremony",
      "housewarming",
      "corporate",
      "other"
    ];

    const categoriesData = await Promise.all(
      categories.map(async (category) => {
        // Get featured image, or latest image if no featured
        const featured = await Gallery.findOne({
          eventCategory: category
        }).sort({ uploadedAt: -1 });

        return {
          category,
          categoryLabel: category.charAt(0).toUpperCase() + category.slice(1),
          featuredImage: featured ? featured.cloudinaryUrl : null,
          imageCount: await Gallery.countDocuments({ eventCategory: category })
        };
      })
    );

    // Filter out categories with no images
    const categoriesWithImages = categoriesData.filter(c => c.imageCount > 0);

    res.status(200).json({
      message: "Categories retrieved successfully",
      categories: categoriesWithImages
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message
    });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    // Configure Cloudinary at request time to ensure env vars are loaded
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: "Image ID is required" });
    }

    const gallery = await Gallery.findById(imageId);

    if (!gallery) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete from Cloudinary
    await cloudinary.v2.uploader.destroy(gallery.cloudinaryPublicId);

    // Delete from MongoDB
    await Gallery.findByIdAndDelete(imageId);

    res.status(200).json({
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      error: "Failed to delete image",
      details: error.message
    });
  }
};

export const setFeaturedImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: "Image ID is required" });
    }

    const gallery = await Gallery.findById(imageId);

    if (!gallery) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Unset all featured images in this category
    await Gallery.updateMany(
      { eventCategory: gallery.eventCategory },
      { isFeatured: false }
    );

    // Set this image as featured
    gallery.isFeatured = true;
    await gallery.save();

    res.status(200).json({
      message: "Image set as featured successfully",
      gallery
    });
  } catch (error) {
    console.error("Error setting featured image:", error);
    res.status(500).json({
      error: "Failed to set featured image",
      details: error.message
    });
  }
};

export const getAdminGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find({}).sort({ uploadedAt: -1 });

    res.status(200).json({
      message: "All galleries retrieved successfully",
      galleries
    });
  } catch (error) {
    console.error("Error fetching galleries:", error);
    res.status(500).json({
      error: "Failed to fetch galleries",
      details: error.message
    });
  }
};

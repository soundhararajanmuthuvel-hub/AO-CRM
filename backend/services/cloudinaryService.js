const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary with environmental variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary.
 * @param {string} filePath Path to local file
 * @param {object} options Cloudinary upload options (e.g. folder, resource_type)
 * @returns {Promise<object>} Cloudinary upload response
 */
const uploadFile = async (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = {
  cloudinary,
  uploadFile
};

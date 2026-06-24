const { Product } = require('../models');
const cloudinaryService = require('../services/cloudinaryService');
const fs = require('fs');

exports.getProducts = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const products = await Product.findAll({
      where: { workspaceId },
      order: [['name', 'ASC']]
    });
    return res.json(products);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Server error retrieving products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const {
      name, sku, barcode, category, brand, unit,
      price, offerPrice, stock, description, benefits,
      ingredients, specifications, imageUrls, videoUrls,
      productUrl, cataloguePdfUrl,
      imageUrl, catalogueUrl, videoUrl, websiteUrl
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await Product.create({
      workspaceId,
      name, sku, barcode, category, brand, unit,
      price, offerPrice, stock, description, benefits,
      ingredients, specifications, imageUrls, videoUrls,
      productUrl, cataloguePdfUrl,
      imageUrl, catalogueUrl, videoUrl, websiteUrl
    });

    return res.json({ success: true, product });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ error: 'Server error creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { productId } = req.params;
    const {
      name, sku, barcode, category, brand, unit,
      price, offerPrice, stock, description, benefits,
      ingredients, specifications, imageUrls, videoUrls,
      productUrl, cataloguePdfUrl,
      imageUrl, catalogueUrl, videoUrl, websiteUrl
    } = req.body;

    const product = await Product.findOne({ where: { id: productId, workspaceId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({
      name, sku, barcode, category, brand, unit,
      price, offerPrice, stock, description, benefits,
      ingredients, specifications, imageUrls, videoUrls,
      productUrl, cataloguePdfUrl,
      imageUrl, catalogueUrl, videoUrl, websiteUrl
    });

    return res.json({ success: true, product });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ error: 'Server error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { productId } = req.params;

    const product = await Product.findOne({ where: { id: productId, workspaceId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    return res.json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ error: 'Server error deleting product' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { productId } = req.query;

    let targetProduct = null;
    if (productId) {
      targetProduct = await Product.findOne({ where: { id: productId, workspaceId } });
    }

    // Recommend other products
    const query = { workspaceId };
    if (targetProduct) {
      query.id = { [require('sequelize').Op.ne]: targetProduct.id };
    }

    const recs = await Product.findAll({
      where: query,
      limit: 3,
      order: sequelize => sequelize.random ? sequelize.random() : [['name', 'ASC']]
    });

    return res.json(recs);
  } catch (error) {
    console.error('getRecommendations error:', error);
    return res.status(500).json({ error: 'Server error generating recommendations' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const id = req.params.id || req.params.productId;
    const product = await Product.findOne({ where: { id, workspaceId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({ error: 'Server error retrieving product details' });
  }
};

exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await cloudinaryService.uploadFile(req.file.path, {
      folder: 'cusmancrm/products/images',
      resource_type: 'image'
    });

    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Error removing local temp file:', err);
    }

    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('uploadProductImage error:', error);
    return res.status(500).json({ error: error.message || 'Server error uploading image to Cloudinary' });
  }
};

exports.uploadProductCatalogue = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No catalogue PDF file provided' });
    }

    const result = await cloudinaryService.uploadFile(req.file.path, {
      folder: 'cusmancrm/products/catalogues',
      resource_type: 'raw'
    });

    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Error removing local temp file:', err);
    }

    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('uploadProductCatalogue error:', error);
    return res.status(500).json({ error: error.message || 'Server error uploading catalogue PDF to Cloudinary' });
  }
};

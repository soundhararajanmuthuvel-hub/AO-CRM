const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'pcs',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  offerPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  specifications: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrls: {
    type: DataTypes.TEXT, // JSON string array of image paths
    allowNull: true,
  },
  videoUrls: {
    type: DataTypes.TEXT, // JSON string array of video paths
    allowNull: true,
  },
  productUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cataloguePdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    field: 'image_url',
    allowNull: true,
  },
  catalogueUrl: {
    type: DataTypes.STRING,
    field: 'catalogue_url',
    allowNull: true,
  },
  videoUrl: {
    type: DataTypes.STRING,
    field: 'video_url',
    allowNull: true,
  },
  websiteUrl: {
    type: DataTypes.STRING,
    field: 'website_url',
    allowNull: true,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['workspaceId']
    }
  ]
});

module.exports = Product;

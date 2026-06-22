const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  console.log('Connecting to PostgreSQL database...');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  console.warn('DATABASE_URL not set or not postgres. Falling back to SQLite for local development...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;

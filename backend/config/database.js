const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.startsWith('mysql')) {
  console.log('Connecting to MySQL database...');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else if (dbUrl && dbUrl.startsWith('postgres')) {
  console.log('Connecting to PostgreSQL database...');
  sequelize = new Sequelize(dbUrl, {
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
  console.error('DATABASE_URL is not set or does not specify a mysql connection.');
  throw new Error('Database connection configuration missing or invalid. Set DATABASE_URL starting with mysql://');
}

module.exports = sequelize;

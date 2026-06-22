const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  // Obfuscate password in database URL for safe troubleshooting logs
  const safeUrl = dbUrl.replace(/:[^:@/]+@/, ':****@');
  console.log(`DATABASE_URL detected: ${safeUrl}`);
} else {
  console.error('DATABASE_URL environment variable is missing.');
}

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
  const errorMsg = dbUrl 
    ? `Database connection configuration invalid. Received URL format not supported. Set DATABASE_URL starting with mysql://`
    : `DATABASE_URL environment variable is missing. Set DATABASE_URL in your environment variables.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

module.exports = sequelize;

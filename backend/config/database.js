const { Sequelize } = require('sequelize');
const path = require('path');
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

const useSSL = process.env.DB_SSL === 'true' || (dbUrl && dbUrl.includes('aivencloud.com'));

if (dbUrl && dbUrl.startsWith('mysql')) {
  console.log('Connecting to MySQL database...');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: useSSL ? {
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
      ssl: useSSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else if (dbUrl && dbUrl.startsWith('sqlite')) {
  console.log('Connecting to SQLite database...');
  const storagePath = dbUrl.replace(/^sqlite:\/\//, '');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath === ':memory:' ? ':memory:' : (path.isAbsolute(storagePath) ? storagePath : path.join(__dirname, '..', storagePath || 'cusmancrm.sqlite')),
    logging: false
  });
} else {
  // Default to sqlite fallback if nothing else is matched or provided
  console.log('No valid mysql/postgres DATABASE_URL provided. Falling back to SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'cusmancrm.sqlite'),
    logging: false
  });
}

module.exports = sequelize;

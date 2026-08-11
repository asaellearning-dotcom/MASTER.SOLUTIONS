require('dotenv').config();

console.log('process.env.DB_HOST', process.env.DB_HOST);
console.log('process.env.DB_PORT', process.env.DB_PORT);
console.log('process.env.DB_USER', process.env.DB_USER);
console.log('process.env.DB_PASSWORD', process.env.DB_PASSWORD);
console.log('process.env.DB_NAME', process.env.DB_NAME);

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'master_solutions',
  },
});

module.exports = knex;

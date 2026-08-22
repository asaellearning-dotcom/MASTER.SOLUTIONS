const products = require('./product');
const users = require('./user');
const invoice = require('./invoice');
const entries = require('./entry');
const customers = require('./customer');
const sysEntities = require('./sysentity');
const business = require('./business');
const licenses = require('./license');
const statistics = require('./statistics');


module.exports = {
    products,
    users,
    entries,
    invoice,
    customers,
    sysEntities,
    business,
    licenses,
    statistics,
}
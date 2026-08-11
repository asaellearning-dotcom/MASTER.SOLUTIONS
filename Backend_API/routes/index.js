const express = require('express');

const router = express.Router();

router.use('/products', require('./products'));
router.use('/entries', require('./entries'));
router.use('/users', require('./user'));
router.use('/sales', require('./sales'));
router.use('/customers', require('./customers'));
router.use('/business', require('./business'));


module.exports = router;
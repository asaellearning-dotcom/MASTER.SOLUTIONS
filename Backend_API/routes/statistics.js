const { Router } = require('express');
const db = require('../databse');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');

const router = Router();

const VALID_PERIODS = Object.keys(db.statistics.PERIOD_DEFS);

/**
 * GET /api/statistics/earnings?period=7d|30d|90d|6m|1y
 * Total earned and invoice count for the business in the selected period.
 */
router.get('/earnings', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const period = String(req.query.period || '30d');
        const dbResponse = await db.statistics.getEarnings(req.user.businessId, period);

        if (dbResponse.invalid) {
            return res.status(400).json({
                ok: false,
                message: dbResponse.message,
                periods: VALID_PERIODS,
            });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({ ok: true, ...dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

/**
 * GET /api/statistics/top-products?period=7d|30d|90d|6m|1y&limit=10
 * Best-selling products by quantity in the selected period.
 */
router.get('/top-products', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const period = String(req.query.period || '30d');
        const limit = Number(req.query.limit || 10);
        const dbResponse = await db.statistics.getTopProducts(
            req.user.businessId,
            period,
            limit
        );

        if (dbResponse.invalid) {
            return res.status(400).json({
                ok: false,
                message: dbResponse.message,
                periods: VALID_PERIODS,
            });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({ ok: true, ...dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

/**
 * GET /api/statistics/customers?period=7d|30d|90d|6m|1y
 * Total registered customers and how many bought in the period.
 */
router.get('/customers', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const period = String(req.query.period || '30d');
        const dbResponse = await db.statistics.getCustomerStats(req.user.businessId, period);

        if (dbResponse.invalid) {
            return res.status(400).json({
                ok: false,
                message: dbResponse.message,
                periods: VALID_PERIODS,
            });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({ ok: true, ...dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

/**
 * GET /api/statistics/overview?period=7d|30d|90d|6m|1y&limit=10
 * Combined earnings + top products + customers for dashboards.
 */
router.get('/overview', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const period = String(req.query.period || '30d');
        const limit = Number(req.query.limit || 10);
        const businessId = req.user.businessId;

        const [earnings, topProducts, customers] = await Promise.all([
            db.statistics.getEarnings(businessId, period),
            db.statistics.getTopProducts(businessId, period, limit),
            db.statistics.getCustomerStats(businessId, period),
        ]);

        const firstInvalid = [earnings, topProducts, customers].find((r) => r.invalid);
        if (firstInvalid) {
            return res.status(400).json({
                ok: false,
                message: firstInvalid.message,
                periods: VALID_PERIODS,
            });
        }

        if (earnings.error || topProducts.error || customers.error) {
            throw new Error(earnings.error || topProducts.error || customers.error);
        }

        return res.status(200).json({
            ok: true,
            period: earnings.data.period,
            earnings: {
                totalEarned: earnings.data.totalEarned,
                invoiceCount: earnings.data.invoiceCount,
            },
            topProducts: topProducts.data.products,
            customers: {
                totalCustomers: customers.data.totalCustomers,
                activeCustomers: customers.data.activeCustomers,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

/**
 * GET /api/statistics/product-analysis?period=30d&productId=12
 * GET /api/statistics/product-analysis?period=30d&search=aceite
 * Daily units sold for a selected product.
 */
router.get('/product-analysis', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const period = String(req.query.period || '30d');
        const search = String(req.query.search || '').trim();
        const productId = Number(req.query.productId);

        if (!Number.isFinite(productId) && !search) {
            return res.status(400).json({
                ok: false,
                message: 'productId o search es requerido',
            });
        }

        const dbResponse = await db.statistics.getProductAnalysis(
            req.user.businessId,
            period,
            {
                productId: Number.isFinite(productId) ? productId : undefined,
                search,
            }
        );

        if (dbResponse.invalid) {
            return res.status(400).json({
                ok: false,
                message: dbResponse.message,
                periods: VALID_PERIODS,
            });
        }

        if (dbResponse.notFound) {
            return res.status(404).json({
                ok: false,
                message: dbResponse.message,
            });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({ ok: true, ...dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

module.exports = router;

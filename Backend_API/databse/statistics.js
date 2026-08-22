const knex = require('../knexfile');
const { formatDateForSQL } = require('../utils');

const PERIOD_DEFS = {
    today: { label: 'Hoy', unit: 'today' },
    '7d': { label: '7 días', amount: 7, unit: 'day' },
    '30d': { label: '30 días', amount: 30, unit: 'day' },
    '90d': { label: '90 días', amount: 90, unit: 'day' },
    '6m': { label: '6 meses', amount: 6, unit: 'month' },
    '1y': { label: '1 año', amount: 1, unit: 'year' },
};

function getStartOfTodayBogota() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);

    const get = (type) => parts.find((part) => part.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')} 00:00:00`;
}

function resolvePeriod(periodKey) {
    const key = String(periodKey || '30d').toLowerCase();
    const def = PERIOD_DEFS[key];

    if (!def) {
        return { error: `period inválido. Usa: ${Object.keys(PERIOD_DEFS).join(', ')}` };
    }

    const end = new Date();

    if (def.unit === 'today') {
        return {
            key,
            label: def.label,
            dateStart: getStartOfTodayBogota(),
            dateEnd: formatDateForSQL(end),
        };
    }

    const start = new Date(end);

    if (def.unit === 'day') {
        start.setDate(start.getDate() - def.amount);
    } else if (def.unit === 'month') {
        start.setMonth(start.getMonth() - def.amount);
    } else if (def.unit === 'year') {
        start.setFullYear(start.getFullYear() - def.amount);
    }

    return {
        key,
        label: def.label,
        dateStart: formatDateForSQL(start),
        dateEnd: formatDateForSQL(end),
    };
}

function approvedSalesQuery(businessId, dateStart, dateEnd) {
    return knex('invoice')
        .where('business_id', businessId)
        .andWhere('approved', true)
        .andWhere('created_at', '>=', dateStart)
        .andWhere('created_at', '<=', dateEnd);
}

async function getEarnings(businessId, periodKey) {
    try {
        const period = resolvePeriod(periodKey);
        if (period.error) {
            return { success: false, invalid: true, message: period.error };
        }

        const row = await approvedSalesQuery(businessId, period.dateStart, period.dateEnd)
            .sum({ totalEarned: 'total' })
            .count({ invoiceCount: 'id' })
            .first();

        return {
            success: true,
            data: {
                period: {
                    key: period.key,
                    label: period.label,
                    dateStart: period.dateStart,
                    dateEnd: period.dateEnd,
                },
                totalEarned: Number(row?.totalEarned ?? 0),
                invoiceCount: Number(row?.invoiceCount ?? 0),
            },
        };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function getTopProducts(businessId, periodKey, limit = 10) {
    try {
        const period = resolvePeriod(periodKey);
        if (period.error) {
            return { success: false, invalid: true, message: period.error };
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

        const rows = await knex('invoice_detail')
            .join('invoice', 'invoice_detail.invoice_id', '=', 'invoice.id')
            .join('products', 'invoice_detail.product_id', '=', 'products.id')
            .where('invoice.business_id', businessId)
            .andWhere('invoice.approved', true)
            .andWhere('invoice.created_at', '>=', period.dateStart)
            .andWhere('invoice.created_at', '<=', period.dateEnd)
            .groupBy(
                'products.id',
                'products.name',
                'products.custom_code'
            )
            .select(
                'products.id as productId',
                'products.name as productName',
                'products.custom_code as productCode',
                knex.raw('SUM(invoice_detail.quantity) as quantitySold'),
                knex.raw('SUM(invoice_detail.sub_total) as totalSold')
            )
            .orderBy('quantitySold', 'desc')
            .limit(safeLimit);

        return {
            success: true,
            data: {
                period: {
                    key: period.key,
                    label: period.label,
                    dateStart: period.dateStart,
                    dateEnd: period.dateEnd,
                },
                products: rows.map((row) => ({
                    productId: row.productId,
                    productName: row.productName,
                    productCode: row.productCode,
                    quantitySold: Number(row.quantitySold ?? 0),
                    totalSold: Number(row.totalSold ?? 0),
                })),
            },
        };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function getCustomerStats(businessId, periodKey) {
    try {
        const period = resolvePeriod(periodKey);
        if (period.error) {
            return { success: false, invalid: true, message: period.error };
        }

        const [totalRow, activeRow] = await Promise.all([
            knex('customer')
                .where('business_id', businessId)
                .count({ totalCustomers: 'id' })
                .first(),
            approvedSalesQuery(businessId, period.dateStart, period.dateEnd)
                .countDistinct({ activeCustomers: 'customer_id' })
                .first(),
        ]);

        return {
            success: true,
            data: {
                period: {
                    key: period.key,
                    label: period.label,
                    dateStart: period.dateStart,
                    dateEnd: period.dateEnd,
                },
                totalCustomers: Number(totalRow?.totalCustomers ?? 0),
                activeCustomers: Number(activeRow?.activeCustomers ?? 0),
            },
        };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

function parseSqlDate(dateStr) {
    const [datePart] = String(dateStr).split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDateKey(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function buildDailySeries(dateStart, dateEnd, salesByDate) {
    const start = parseSqlDate(dateStart);
    const end = parseSqlDate(dateEnd);
    const salesMap = new Map(
        salesByDate.map((row) => [row.saleDate, Number(row.quantitySold ?? 0)])
    );

    const series = [];
    const current = new Date(start);

    while (current <= end) {
        const key = formatDateKey(current);
        series.push({
            date: key,
            quantitySold: salesMap.get(key) ?? 0,
        });
        current.setDate(current.getDate() + 1);
    }

    return series;
}

async function findProductBySearch(businessId, search) {
    const trimmed = String(search || '').trim();

    if (trimmed.length < 3) {
        return { error: 'search requerido (mín. 3 caracteres)' };
    }

    let product = await knex('products')
        .where({ business_id: businessId, custom_code: trimmed })
        .select('id', 'name', 'custom_code as productCode')
        .first();

    if (!product) {
        product = await knex('products')
            .where('business_id', businessId)
            .andWhere(function () {
                this.where('name', 'like', `%${trimmed}%`)
                    .orWhere('custom_code', 'like', `%${trimmed}%`);
            })
            .select('id', 'name', 'custom_code as productCode')
            .orderBy('name', 'asc')
            .first();
    }

    if (!product) {
        return { notFound: true };
    }

    return { product };
}

async function findProductById(businessId, productId) {
    if (!Number.isFinite(productId)) {
        return { error: 'productId inválido' };
    }

    const product = await knex('products')
        .where({ business_id: businessId, id: productId })
        .select('id', 'name', 'custom_code as productCode')
        .first();

    if (!product) {
        return { notFound: true };
    }

    return { product };
}

async function getProductAnalysis(businessId, periodKey, options = {}) {
    try {
        const period = resolvePeriod(periodKey);
        if (period.error) {
            return { success: false, invalid: true, message: period.error };
        }

        const productId = Number(options.productId);
        let productLookup;

        if (Number.isFinite(productId) && productId > 0) {
            productLookup = await findProductById(businessId, productId);
        } else {
            productLookup = await findProductBySearch(businessId, options.search);
        }

        if (productLookup.error) {
            return { success: false, invalid: true, message: productLookup.error };
        }
        if (productLookup.notFound) {
            return {
                success: false,
                notFound: true,
                message: 'Producto no encontrado',
            };
        }

        const { product } = productLookup;

        const rows = await knex('invoice_detail')
            .join('invoice', 'invoice_detail.invoice_id', '=', 'invoice.id')
            .where('invoice.business_id', businessId)
            .andWhere('invoice.approved', true)
            .andWhere('invoice_detail.product_id', product.id)
            .andWhere('invoice.created_at', '>=', period.dateStart)
            .andWhere('invoice.created_at', '<=', period.dateEnd)
            .groupByRaw('DATE(invoice.created_at)')
            .select(
                knex.raw('DATE(invoice.created_at) as saleDate'),
                knex.raw('SUM(invoice_detail.quantity) as quantitySold')
            )
            .orderBy('saleDate', 'asc');

        const salesByDate = rows.map((row) => ({
            saleDate: formatDateKey(row.saleDate),
            quantitySold: Number(row.quantitySold ?? 0),
        }));

        const dailySales = buildDailySeries(period.dateStart, period.dateEnd, salesByDate);
        const totalQuantitySold = dailySales.reduce(
            (sum, point) => sum + point.quantitySold,
            0
        );

        return {
            success: true,
            data: {
                period: {
                    key: period.key,
                    label: period.label,
                    dateStart: period.dateStart,
                    dateEnd: period.dateEnd,
                },
                product: {
                    id: product.id,
                    name: product.name,
                    productCode: product.productCode,
                },
                totalQuantitySold,
                dailySales,
            },
        };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

module.exports = {
    PERIOD_DEFS,
    resolvePeriod,
    getEarnings,
    getTopProducts,
    getCustomerStats,
    getProductAnalysis,
};

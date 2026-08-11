const knex = require('../knexfile');


async function getEntries (businessId, page=1, pageSize=10, search='') {
    const offset = (page - 1) * pageSize;

    try {
        // Shared filters only — do not attach select/limit/offset here,
        // or the count clone inherits OFFSET and returns undefined on page > 1.
        const baseQuery = knex('products_entries')
            .join('products', 'products_entries.product_id', '=', 'products.id')
            .where('products_entries.business_id', businessId);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function() {
                words.forEach((word) => {
                    this.where(function() {
                        this.where('products.name', 'like', `%${word}%`)
                            .orWhere('products.custom_code', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'products.custom_code as productCustomCode',
                'products.name as productName',
                'products_entries.id',
                'products_entries.product_id  as productId',
                'products_entries.created_at  as createdAt',
                'products_entries.business_id as businessId',
                'products_entries.quantity',
                'products_entries.packaging_type as PackagingType',
                'products_entries.units_per_packaging as unitsPerPackaging',
                'products_entries.packaging_cost as packagingCost',
                'products_entries.unit_cost    as unitCost',
                'products_entries.total_cost   as totalCost',
                'products_entries.stock_before as stockBefore',
                'products_entries.stock_after  as stockAfter'
            )
            .orderBy('products_entries.created_at', 'desc')
            .limit(pageSize)
            .offset(offset);

        const countQuery = baseQuery
            .clone()
            .count('products_entries.id as total')
            .first();

        const [data, countResult] = await Promise.all([dataQuery, countQuery]);

        const totalRows = Number(countResult?.total ?? 0);
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        return { success: true, data, totalRows, totalPages };
    } catch (error) {
        console.log(error)
        return {success: false, data: null, error}
    }
}


module.exports = {
    getEntries
}

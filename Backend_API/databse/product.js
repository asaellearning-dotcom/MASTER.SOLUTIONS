const knex = require('../knexfile');



async function insertProducts(rows) {

    try {
        const res = await knex.batchInsert('products', rows);
        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }
};

async function getCount(businessId) {

    try {
        const res = await knex('products')
            .where('business_id', businessId)
            .count('custom_code as total');
        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }
};


async function getProducts(businessId, page=1, pageSize=10, search='') {
    const offset = (page - 1) * pageSize;

    try {
        // Shared filters only — do not attach select/limit/offset here,
        // or the count clone inherits OFFSET and returns undefined on page > 1.
        const baseQuery = knex('products')
            .where('business_id', businessId);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function() {
                words.forEach((word) => {
                    this.where(function() {
                        this.where('name', 'like', `%${word}%`)
                            .orWhere('custom_code', 'like', `%${word}%`)
                            .orWhere('bar_code', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'id',
                'custom_code as customCode',
                'business_id as businessId',
                'name',
                'stock',
                'sale_unit as saleUnit',
                'cost',
                'price',
                'bar_code as barCode',
                'description'
            )
            .orderBy('name', 'asc')
            .limit(pageSize)
            .offset(offset);

        const countQuery = baseQuery
            .clone()
            .count('id as total')
            .first();

        const [data, countResult] = await Promise.all([dataQuery, countQuery]);

        const totalRows = Number(countResult?.total ?? 0);
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        return { success: true, data, totalRows, totalPages };
    } catch (error) {
        return {success: false, data: null, error}
    }
};


async function getProductsByCode(businessId, codes=[]) {
    try {
        const res = await knex('products')
            .select(
                'id',
                'custom_code',
                'business_id',
                'name',
                'stock',
                'sale_unit',
                'unit_factor',
                'cost',
                'price',
                'bar_code',
                'description'
            )
            .where('business_id', businessId)
            .whereIn('custom_code', codes);

        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }
};

async function insertProductsAsTransaction(productTransactions) {
    try {
        await knex.transaction(async (trx) => {

            for (const pTransaction of productTransactions) {
                const { product, entry } = pTransaction;
                const [productId] = await trx('products').insert(product);
                entry.product_id = productId;
                await trx('products_entries').insert(entry);
            }
        });

        return {success: true, data: 'new products added'}
    } catch (error) {
        return {success: false, data: null, error}
    }
};


async function insertEntriesTransactions(entriesTransactions) {
    try {
        await knex.transaction(async (trx) => {

            for (const entryTransaction of entriesTransactions) {
                const { productUpdated, entry } = entryTransaction;
                await trx('products_entries').insert(entry);
                await trx('products').where({
                    id : productUpdated.product_id,
                    business_id: productUpdated.business_id,
                    custom_code: productUpdated.custom_code
                })
                .update({
                    stock: productUpdated.stock
                });
            }
        });

        return {success: true, data: 'new products added'}
    } catch (error) {
        return {success: false, data: null,  error}
    }
}










module.exports = {
    insertProducts,
    getProducts,
    getCount,
    getProductsByCode,
    insertProductsAsTransaction,
    insertEntriesTransactions
}
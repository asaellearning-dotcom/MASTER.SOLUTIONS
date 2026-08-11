const knex = require('../knexfile');


async function getSysPaymentMethods() {
    try {
       
        const query = knex('sys_payment_methods');
        const res = await query.select(
            'id',
            'code',
            'name',
            'description',
        );
        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }
};


module.exports = {
    getSysPaymentMethods,
}

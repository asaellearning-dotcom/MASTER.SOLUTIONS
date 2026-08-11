const knex = require('../knexfile');

async function getBusinessById(businessId) {
    try {
        const business = await knex('business')
            .where('id', businessId)
            .select(
                'id',
                'name',
                'phone',
                'address',
                'email',
                'business_number as businessNumber',
                'business_number_type as businessNumberType'
            )
            .first();

        if (!business) {
            return { success: false, data: null, error: 'Business not found' };
        }

        return { success: true, data: business };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function updateBusiness(businessId, payload) {
    try {
        const updated = await knex('business')
            .where('id', businessId)
            .update({
                name: payload.name,
                phone: payload.phone,
                address: payload.address,
                email: payload.email,
                business_number: payload.businessNumber,
                business_number_type: payload.businessNumberType,
            });

        if (!updated) {
            return { success: false, data: null, error: 'Business not found' };
        }

        return getBusinessById(businessId);
    } catch (error) {
        return { success: false, data: null, error };
    }
}

module.exports = {
    getBusinessById,
    updateBusiness,
};

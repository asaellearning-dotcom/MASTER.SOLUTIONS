const knex = require('../knexfile');


async function findCustomer(userEmail, businessNit) {
    console.log(userEmail, businessNit)

    try {
       
        const user = await knex('users')
            .join('business', 'users.business_id', '=', 'business.id')
            .select(
                'users.document_number as documentId',
                'users.full_name as fullName',
                'users.password',
                'users.email',
                'users.id as userId',
                'business.name as businessName' ,
                'business.business_number as businessNumber',
                'business.business_number_type as businessNumberType',
                'business.id as businessId'
            )
            .where('users.email', '=', userEmail)
            .where('business.business_number', '=', businessNit)


        return {success: true, data: user}
    } catch (error) {
        return {success: false, data: null, error}
    }


};

async function findCustomerById(customerId, businessId) {
    try {
       
        const query = knex('customer');
        query
            .where('business_id', businessId)
            .andWhere('id', customerId);

        const res = await query.select(
            'id',
            'document_id as documentId',
            'fullname    as fullName',
            'phone       as phoneNumber',
            'address',
            'email',
            'business_id as businessId',
        );

        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }


};


async function getCustomers(businessId, page = 1, pageSize = 10, search = '') {
    const offset = (page - 1) * pageSize;

    try {
        // Shared filters only — do not attach select/limit/offset here,
        // or the count clone inherits OFFSET and returns undefined on page > 1.
        const baseQuery = knex('customer')
            .where('business_id', businessId);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function () {
                words.forEach((word) => {
                    this.where(function () {
                        this.where('fullname', 'like', `%${word}%`)
                            .orWhere('document_id', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'id',
                'document_id as documentId',
                'fullname    as fullName',
                'phone       as phoneNumber',
                'address',
                'email',
                'business_id as businessId',
            )
            .orderBy('fullname', 'asc')
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
        return { success: false, data: null, error };
    }
};


async function insertCustomer(customer, businessId) {
  
    try {
        const [newId] = await knex('customer').insert({
            document_id: customer.documentId,
            fullname: customer.fullName,
            phone: customer.phoneNumber,
            address: customer.address,
            email: customer.email,
            business_id:  businessId
        });

        console.log(`Record inserted successfully with ID: ${newId}`);
        return {success: true, data: {customerId: newId}};
    } catch (error) {
        return {success: false, data: null, error};
    }
};

module.exports = {
    findCustomer,
    getCustomers,
    insertCustomer,
    findCustomerById,
}

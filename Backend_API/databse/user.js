const knex = require('../knexfile');
const { hashPassword } = require('../password');


async function findUserProfile(userEmail, businessNit) {
    try {
       
        const user = await knex('users')
            .join('business', 'users.business_id', '=', 'business.id')
            .leftJoin('sys_user_roles', 'users.role_id', '=', 'sys_user_roles.id')
            .select(
                'users.document_number as documentId',
                'users.full_name as fullName',
                'users.password',
                'users.email',
                'users.id as userId',
                'users.role_id as roleId',
                'sys_user_roles.code as roleCode',
                'sys_user_roles.name as roleName',
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

async function getUsers(businessId, page = 1, pageSize = 10, search = '') {
    const offset = (page - 1) * pageSize;

    try {
        // Shared filters only — do not attach select/limit/offset here,
        // or the count clone inherits OFFSET and returns undefined on page > 1.
        const baseQuery = knex('users')
            .leftJoin('sys_user_roles', 'users.role_id', '=', 'sys_user_roles.id')
            .where('users.business_id', businessId);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function () {
                words.forEach((word) => {
                    this.where(function () {
                        this.where('users.full_name', 'like', `%${word}%`)
                            .orWhere('users.document_number', 'like', `%${word}%`)
                            .orWhere('users.email', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'users.id',
                'users.document_number as documentNumber',
                'users.full_name as fullName',
                'users.email',
                'users.phone',
                'users.role_id as roleId',
                'sys_user_roles.name as roleName',
                'sys_user_roles.code as roleCode',
                'users.business_id as businessId'
            )
            .orderBy('users.full_name', 'asc')
            .limit(pageSize)
            .offset(offset);

        const countQuery = baseQuery
            .clone()
            .count('users.id as total')
            .first();

        const [data, countResult] = await Promise.all([dataQuery, countQuery]);

        const totalRows = Number(countResult?.total ?? 0);
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        return { success: true, data, totalRows, totalPages };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function getUserRoles() {
    try {
        const data = await knex('sys_user_roles')
            .select('id', 'code', 'name', 'description')
            .orderBy('id', 'asc');

        return { success: true, data };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function insertUser(user, businessId) {
    try {
        const existing = await knex('users')
            .where('business_id', businessId)
            .andWhere(function () {
                this.where('email', user.email)
                    .orWhere('document_number', user.documentNumber);
            })
            .first();

        if (existing) {
            return {
                success: false,
                data: null,
                error: 'Ya existe un usuario con ese correo o documento en la empresa',
            };
        }

        const hashedPassword = await hashPassword(user.password);

        const [newId] = await knex('users').insert({
            document_number: user.documentNumber,
            full_name: user.fullName,
            password: hashedPassword,
            email: user.email,
            business_id: businessId,
            phone: user.phone || null,
            role_id: user.roleId,
            names: '',
            last_names: '',
        });

        return { success: true, data: { userId: newId } };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function getUserById(userId, businessId) {
    try {
        const user = await knex('users')
            .leftJoin('sys_user_roles', 'users.role_id', '=', 'sys_user_roles.id')
            .where('users.id', userId)
            .andWhere('users.business_id', businessId)
            .select(
                'users.id',
                'users.document_number as documentNumber',
                'users.full_name as fullName',
                'users.email',
                'users.phone',
                'users.role_id as roleId',
                'sys_user_roles.name as roleName',
                'sys_user_roles.code as roleCode',
                'users.business_id as businessId'
            )
            .first();

        if (!user) {
            return { success: false, data: null, error: 'Usuario no encontrado' };
        }

        return { success: true, data: user };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function updateUser(userId, businessId, payload) {
    try {
        const existing = await knex('users')
            .where({ id: userId, business_id: businessId })
            .first();

        if (!existing) {
            return { success: false, data: null, error: 'Usuario no encontrado' };
        }

        const duplicate = await knex('users')
            .where('business_id', businessId)
            .andWhere('id', '!=', userId)
            .andWhere(function () {
                this.where('email', payload.email)
                    .orWhere('document_number', payload.documentNumber);
            })
            .first();

        if (duplicate) {
            return {
                success: false,
                data: null,
                error: 'Ya existe otro usuario con ese correo o documento en la empresa',
            };
        }

        const updateData = {
            document_number: payload.documentNumber,
            full_name: payload.fullName,
            email: payload.email,
            phone: payload.phone || null,
            role_id: payload.roleId,
        };

        if (payload.password) {
            updateData.password = await hashPassword(payload.password);
        }

        await knex('users')
            .where({ id: userId, business_id: businessId })
            .update(updateData);

        return getUserById(userId, businessId);
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function updateUserPassword(userId, hashedPassword) {
    try {
        await knex('users')
            .where('id', userId)
            .update({ password: hashedPassword });

        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

module.exports = {
    findUserProfile,
    getUsers,
    getUserRoles,
    getUserById,
    insertUser,
    updateUser,
    updateUserPassword,
}

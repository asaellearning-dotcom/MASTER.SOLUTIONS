const knex = require('../knexfile');

function toDateOnly(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    // Compare dates in Colombia local calendar day
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const get = (type) => parts.find((p) => p.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}

function getTodayBogota() {
    return toDateOnly(new Date());
}

/**
 * Returns the currently valid active license for a business, if any.
 * Valid = is_active and today is within [date_start, date_end].
 */
async function getActiveLicense(businessId) {
    try {
        const today = getTodayBogota();

        const licenses = await knex('licenses')
            .where('business_id', businessId)
            .andWhere('is_active', 1)
            .orderBy('date_end', 'desc');

        const active = licenses.find((license) => {
            const start = toDateOnly(license.date_start);
            const end = toDateOnly(license.date_end);
            return start && end && today >= start && today <= end;
        });

        if (!active) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: active.id,
                createdAt: active.created_at,
                countDays: active.count_days,
                countUsers: active.count_users,
                dateStart: active.date_start,
                dateEnd: active.date_end,
                businessId: active.business_id,
                price: active.price,
                isActive: Boolean(active.is_active),
            },
        };
    } catch (error) {
        return { success: false, data: null, error };
    }
}

async function getBusinessUserCount(businessId) {
    try {
        const result = await knex('users')
            .where('business_id', businessId)
            .count('id as total')
            .first();

        return {
            success: true,
            data: Number(result?.total ?? 0),
        };
    } catch (error) {
        return { success: false, data: 0, error };
    }
}

module.exports = {
    getActiveLicense,
    getBusinessUserCount,
    getTodayBogota,
};

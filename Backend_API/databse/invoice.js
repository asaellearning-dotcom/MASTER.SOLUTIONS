const knex = require('../knexfile');
const { formatDateForSQL } = require('../utils');

async function getEntries (businessId, page=1, pageSize=10) {
    const offset = (page - 1) * pageSize;

    try {
        const res = await knex('products_entries')
            .join('products', 'products_entries.product_id', '=', 'products.id')
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
            .where('products_entries.business_id','=' ,businessId)
            .orderBy('products_entries.created_at', 'desc')
            .limit(pageSize)    // Limit the number of results
            .offset(offset);    // Skip the results of previous pages
        return {success: true, data: res}
    } catch (error) {
        console.log(error)
        return {success: false, data: null, error}
    }
}

async function getCount(businessId) {

    try {
        const res = await knex('invoice')
            .where('business_id', businessId)
            .count('id as count');
        return {success: true, data: res}
    } catch (error) {
        return {success: false, data: null, error}
    }
};

async function insertInvoiceAsTransaction(invoiceTransaction) {
    try {
        await knex.transaction(async (trx) => {
            const { invoice, detail } = invoiceTransaction;
            const [invoiceId] = await trx('invoice').insert(invoice);
            
            for (const item of detail) {
                const imtemRow = {...item, invoice_id: invoiceId};
                await trx('invoice_detail').insert(imtemRow);

                await trx('products')
                    .where({id: imtemRow.product_id, business_id: invoice.business_id})
                    .decrement('stock', imtemRow.quantity);
            }
            
        });

        return {success: true, data: 'Invoice added correctly'}
    } catch (error) {
        return {success: false, data: null, error}
    }
};


async function getInvoiceSummaries(businessId, page=1, pageSize=20, search='') {
    const offset = (page - 1) * pageSize;
    try {
        // Shared filters only — do not attach select/limit/offset here,
        // or the count clone inherits OFFSET and returns undefined on page > 1.
        const baseQuery = knex('invoice')
            .join('business', 'invoice.business_id', '=', 'business.id')
            .join('customer', 'invoice.customer_id', '=', 'customer.id')
            .leftJoin('users', 'invoice.user_id', '=', 'users.id')
            .where('invoice.business_id', businessId);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function() {
                words.forEach((word) => {
                    this.where(function() {
                        this.where('customer.fullname', 'like', `%${word}%`)
                            .orWhere('invoice.public_code', 'like', `%${word}%`)
                            .orWhere('users.full_name', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'invoice.id                 as invoiceId',
                'invoice.public_code        as invoiceNumber',
                'invoice.created_at         as createdAt',
                'invoice.total',
                'customer.fullname          as customerFullName',
                'users.full_name            as cashierFullName',
            )
            .orderBy('invoice.created_at', 'desc')
            .limit(pageSize)
            .offset(offset);

        const countQuery = baseQuery
            .clone()
            .count('invoice.id as total')
            .first();

        const [data, countResult] = await Promise.all([dataQuery, countQuery]);

        const totalRows = Number(countResult?.total ?? 0);
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        return {success: true, data, totalRows, totalPages}
    } catch (error) {
        return {success: false, data: null, error}
    }
};


async function getInvoiceDetail(businessId, invoiceId) {
    try {
        const invoice = await knex('invoice')
            .join('business', 'invoice.business_id', '=', 'business.id')
            .join('customer', 'invoice.customer_id', '=', 'customer.id')
            .join('sys_payment_methods', 'invoice.payment_method', '=', 'sys_payment_methods.id')
            .leftJoin('users', 'invoice.user_id', '=', 'users.id')
            .where('invoice.business_id', businessId)
            .andWhere('invoice.id', invoiceId)
            .select(
                'invoice.id                    as invoiceId',
                'invoice.public_code           as invoiceNumber',
                'invoice.created_at            as createdAt',
                'invoice.total',
                'invoice.is_credit             as isCredit',
                'invoice.remain',
                'invoice.amount_received       as amountReceived',
                'invoice.change_given          as changeGiven',
                'business.name                 as businessName',
                'business.business_number      as businessNumber',
                'business.business_number_type as businessNumberType',
                'customer.id                 as customerId',
                'customer.fullname           as customerFullName',
                'customer.document_id       as customerDocumentId',
                'users.id                      as cashierId',
                'users.full_name               as cashierFullName',
                'sys_payment_methods.id        as paymentMethodId',
                'sys_payment_methods.code      as paymentMethodCode',
                'sys_payment_methods.name      as paymentMethodName',
                'sys_payment_methods.description as paymentMethodDescription',
            )
            .first();

        if (!invoice) {
            return { success: false, data: null, notFound: true };
        }

        const details = await knex('invoice_detail')
            .join('products', 'invoice_detail.product_id', '=', 'products.id')
            .where('invoice_detail.invoice_id', invoiceId)
            .select(
                'invoice_detail.id          as id',
                'invoice_detail.quantity',
                'invoice_detail.sub_total   as subtotal',
                'products.name              as productName',
            );

        const data = {
            createdAt: invoice.createdAt,
            invoiceNumber: invoice.invoiceNumber,
            total: Number(invoice.total),
            business: {
                name: invoice.businessName,
                businessNumber: invoice.businessNumber,
                businessNumberType: invoice.businessNumberType,
            },
            customer: {
                id: invoice.customerId,
                fullName: invoice.customerFullName,
                documentId: invoice.customerDocumentId,
            },
            details: details.map((item) => ({
                id: item.id,
                quantity: Number(item.quantity),
                subtotal: Number(item.subtotal),
                productName: item.productName,
            })),
            paymentMethod: {
                id: invoice.paymentMethodId,
                code: invoice.paymentMethodCode,
                name: invoice.paymentMethodName,
                description: invoice.paymentMethodDescription,
            },
            amountReceived: Number(invoice.amountReceived),
            changeGiven: Number(invoice.changeGiven),
            isCredit: Boolean(invoice.isCredit),
            remain: Number(invoice.remain),
            cashier: invoice.cashierId
                ? {
                    id: invoice.cashierId,
                    fullName: invoice.cashierFullName,
                }
                : null,
        };

        return { success: true, data };
    } catch (error) {
        return { success: false, data: null, error };
    }
};

async function getCreditInvoiceSummaries(businessId, page = 1, pageSize = 20, search = '') {
    const offset = (page - 1) * pageSize;

    try {
        const paymentsAgg = knex('invoice_payments')
            .select(
                'invoice_id',
                knex.raw('COUNT(id) as payment_count'),
                knex.raw('COALESCE(SUM(amount_paid), 0) as amount_paid_sum'),
                knex.raw('MAX(payment_date) as last_payment_at')
            )
            .groupBy('invoice_id')
            .as('payments_agg');

        const baseQuery = knex('invoice')
            .join('customer', 'invoice.customer_id', '=', 'customer.id')
            .leftJoin(paymentsAgg, 'invoice.id', 'payments_agg.invoice_id')
            .where('invoice.business_id', businessId)
            .andWhere('invoice.is_credit', true);

        if (search) {
            const words = search.trim().split(/\s+/);

            baseQuery.andWhere(function () {
                words.forEach((word) => {
                    this.where(function () {
                        this.where('customer.fullname', 'like', `%${word}%`)
                            .orWhere('invoice.public_code', 'like', `%${word}%`);
                    });
                });
            });
        }

        const dataQuery = baseQuery
            .clone()
            .select(
                'invoice.id              as invoiceId',
                'invoice.public_code     as invoiceNumber',
                'customer.fullname      as customerFullName',
                'invoice.status',
                'invoice.total',
                'invoice.remain',
                'payments_agg.payment_count as paymentCount',
                'payments_agg.amount_paid_sum as amountPaidSum',
                'payments_agg.last_payment_at as lastPaymentAt',
            )
            .orderBy('invoice.created_at', 'desc')
            .limit(pageSize)
            .offset(offset);

        const countQuery = baseQuery
            .clone()
            .count('invoice.id as total')
            .first();

        const [rows, countResult] = await Promise.all([dataQuery, countQuery]);

        const data = rows.map((row) => {
            const total = Number(row.total);
            const remain = Number(row.remain);
            const amountPaidFromPayments = Number(row.amountPaidSum ?? 0);

            return {
                invoiceId: row.invoiceId,
                invoiceNumber: row.invoiceNumber,
                customerFullName: row.customerFullName,
                status: row.status,
                total,
                remain,
                amountPaid: amountPaidFromPayments || (total - remain),
                lastPaymentAt: row.lastPaymentAt ?? null,
                paymentCount: Number(row.paymentCount ?? 0),
            };
        });

        const totalRows = Number(countResult?.total ?? 0);
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        return { success: true, data, totalRows, totalPages };
    } catch (error) {
        return { success: false, data: null, error };
    }
};

async function registerCreditPayment(businessId, invoiceId, amountPaid, paymentMethodId) {
    try {
        const result = await knex.transaction(async (trx) => {
            const invoice = await trx('invoice')
                .where({
                    id: invoiceId,
                    business_id: businessId,
                })
                .forUpdate()
                .first();

            if (!invoice) {
                return { notFound: true };
            }

            if (!invoice.is_credit) {
                return { invalid: true, message: 'La factura no es a crédito' };
            }

            if (invoice.status === 'PAGADO' || Number(invoice.remain) <= 0) {
                return { invalid: true, message: 'La factura ya está pagada' };
            }

            const remain = Number(invoice.remain);
            const paid = Number(amountPaid);

            if (!Number.isFinite(paid) || paid <= 0) {
                return { invalid: true, message: 'El monto abonado debe ser mayor a 0' };
            }

            if (paid > remain) {
                return { invalid: true, message: 'El monto abonado no puede superar el saldo pendiente' };
            }

            const newRemain = remain - paid;
            const newStatus = newRemain === 0 ? 'PAGADO' : 'DEUDA';
            const paymentDate = formatDateForSQL(new Date());

            const [paymentId] = await trx('invoice_payments').insert({
                invoice_id: invoiceId,
                amount_paid: paid,
                payment_method_id: paymentMethodId,
                payment_date: paymentDate,
            });

            await trx('invoice')
                .where({ id: invoiceId, business_id: businessId })
                .update({
                    remain: newRemain,
                    status: newStatus,
                });

            return {
                paymentId,
                invoiceId,
                amountPaid: paid,
                paymentDate,
                remain: newRemain,
                status: newStatus,
            };
        });

        if (result.notFound) {
            return { success: false, notFound: true };
        }

        if (result.invalid) {
            return { success: false, invalid: true, message: result.message };
        }

        return { success: true, data: result };
    } catch (error) {
        return { success: false, data: null, error };
    }
};

async function getInvoicePayments(businessId, invoiceId) {
    try {
        const invoice = await knex('invoice')
            .where({
                id: invoiceId,
                business_id: businessId,
            })
            .first('id');

        if (!invoice) {
            return { success: false, notFound: true };
        }

        const rows = await knex('invoice_payments')
            .join(
                'sys_payment_methods',
                'invoice_payments.payment_method_id',
                '=',
                'sys_payment_methods.id'
            )
            .where('invoice_payments.invoice_id', invoiceId)
            .select(
                'invoice_payments.id as id',
                'invoice_payments.payment_date as paymentDate',
                'invoice_payments.amount_paid as amountPaid',
                'sys_payment_methods.id as paymentMethodId',
                'sys_payment_methods.code as paymentMethodCode',
                'sys_payment_methods.name as paymentMethodName',
                'sys_payment_methods.description as paymentMethodDescription',
            )
            .orderBy('invoice_payments.payment_date', 'desc');

        const data = rows.map((row) => ({
            id: row.id,
            paymentDate: row.paymentDate,
            amountPaid: Number(row.amountPaid),
            paymentMethod: {
                id: row.paymentMethodId,
                code: row.paymentMethodCode,
                name: row.paymentMethodName,
                description: row.paymentMethodDescription,
            },
        }));

        return { success: true, data };
    } catch (error) {
        return { success: false, data: null, error };
    }
};

module.exports = {
    getEntries,
    getCount,
    getInvoiceSummaries,
    getCreditInvoiceSummaries,
    getInvoiceDetail,
    getInvoicePayments,
    insertInvoiceAsTransaction,
    registerCreditPayment,
}
const xlsx = require('xlsx');
const { Router } = require('express');
const upload = require('../multerconfig');
const { formatDateForSQL, buildEntryRecord } = require('../utils');

const router = Router();

const db = require('../databse/index')
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');


router.post('/', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {

    try {
        const { user, query, body } = req;
    
        const items = new Map(
            req.body.items.map(item => [item.productCode, item])
        );
        const pcodes = Array.from(items.keys());
        console.log('user = ', user);
        
        const { data: paymentMethods } = await db.sysEntities.getSysPaymentMethods();
        const paymentMethodObj = paymentMethods.find(method => method.id === body.paymentMethod);

        if(!paymentMethodObj) {
            return res.status(400).json({message: 'Metodo de pago incorrecto'})
        }


        const dbResponse = await db.products.getProductsByCode(user.businessId, pcodes);

        if(dbResponse.error) {
            throw new Error('Error getting the business products')
        }

        const products = dbResponse.data;
        

        if (pcodes.length !== products.length) {
            return res.status(400).json({ok: false, errMessage: 'Productos no existentes'})
        }


        let total = 0;
        const invoiceDetail = products.map((product) => {

            const item = items.get(product.custom_code)
            const subtotal = Number(product.price) * item.quantity;
            total += subtotal; 
            return {
                product_id: product.id,
                quantity:  item.quantity,
                unit_price: Number(product.price), 
                sub_total: subtotal,
            }
        });


        const { data: customerResponse, error } = await db.customers.findCustomerById(body.customerId, user.businessId);

        if(error) {
            return res.status(500).json({errMessage: 'Error al confirmar Cliente'});
        }

        if (customerResponse.length === 0 ) {
            return res.status(400).json({message: 'Cliente no registrado'});
        }

        const { data } = await db.invoice.getCount(user.businessId);
        let invoiceCount = data[0].count + 1;
        const today =  new Date();
        // 2. Extraer año, mes y día
        const yyyy = today.getFullYear();
        // Los meses van de 0 a 11, por eso sumamos 1. padStart asegura los 2 dígitos.
        const mm = String(today.getMonth() + 1).padStart(2, '0'); 
        const dd = String(today.getDate()).padStart(2, '0');

        // 3. Unir todo con el prefijo de tu factura
        const invoiceNumber = `FACN${invoiceCount}-${yyyy}${mm}${dd}`;
        
        const invoice = {
            total,
            business_id: user.businessId,
            created_at : formatDateForSQL(today),
            public_code: invoiceNumber,
            is_credit: body.paymentMethod === 4,
            comes_as: body.sentAs.toUpperCase(),
            payment_method: paymentMethodObj.id,
            customer_id: body.customerId,
            user_id: user.userId,

            status: '',
            remain: 0,
            approved: false,

            amount_received: 0,
            change_given: 0,
        };

        if(paymentMethodObj.code === 'CASH') { // EFECTIVO
            invoice.amount_received = body.amountReceived;
            invoice.change_given = body.changeGiven;
        };


        if(invoice.is_credit) {
            invoice.status = 'DEUDA';
            invoice.remain = invoice.total;
        }else {
            invoice.status = 'PAGADO';
            invoice.remain = 0;
           
        };

        invoice.approved = invoice.comes_as === 'SALE';
        await db.invoice.insertInvoiceAsTransaction({invoice, detail: invoiceDetail});

        return res.json({
            ok: true,
            invoice: {
                createdAt: invoice.created_at,
                invoiceNumber: invoice.public_code,
                total: invoice.total,
                business: {
                    name: user.businessName,
                    businessNumber: user.businessNumber,
                    businessNumberType: user.businessNumberType,
                },
                customer: {
                    fullName: customerResponse[0].fullName,
                    documentId: customerResponse[0].documentId,
                    id: customerResponse[0].id,
                },
                details: invoiceDetail.map(item => {
                    return {
                        id: item.id,
                        quantity: item.quantity,
                        subtotal: item.sub_total,
                        productName: products.find(p => p.id === item.product_id).name
                    }
                }),
                paymentMethod: paymentMethodObj,
                amountReceived: invoice.amount_received,
                changeGiven: invoice.change_given,
                isCredit: invoice.is_credit,
                remain: invoice.remain,
                cashier: {
                    id: user.userId,
                    fullName: user.fullName,
                },
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({ok: false}).status(500);
    }
});


router.get('/', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {

    try {

        const { user, query } = req;
        const page      = Number(query.page || 1);
        const pageSize  = Number(query.pageSize || 20);

        if(pageSize > 20) {
            return res.status(400).json({ok: false, message: 'no se retorna mas de 20 items por pagina'})
        }


        const dbResponse = await db.invoice.getInvoiceSummaries(user.businessId, page, pageSize, query.search)

        if(dbResponse.error) {
            
            throw new Error(dbResponse.error)
        };

        return res.status(200).json({ok: true, invoices: dbResponse.data, page, pageSize, totalRows: dbResponse.totalRows, pages: dbResponse.totalPages})
    } catch (error) {
        console.log(error)
        return res.json({ok: false}).status(500);
    }
});


router.get('/detail', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {
    try {
        const { user, query } = req;
        const invoiceId = Number(query.invoiceId);

        if (!invoiceId) {
            return res.status(400).json({ ok: false, message: 'invoiceId es requerido' });
        }

        const dbResponse = await db.invoice.getInvoiceDetail(user.businessId, invoiceId);

        if (dbResponse.notFound) {
            return res.status(404).json({ ok: false, message: 'Factura no encontrada' });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({ ok: true, invoice: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});


router.get('/credit', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {
    try {
        const { user, query } = req;
        const page = Number(query.page || 1);
        const pageSize = Number(query.pageSize || 20);

        if (pageSize > 20) {
            return res.status(400).json({ ok: false, message: 'no se retorna mas de 20 items por pagina' });
        }

        const dbResponse = await db.invoice.getCreditInvoiceSummaries(
            user.businessId,
            page,
            pageSize,
            query.search
        );

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({
            ok: true,
            invoices: dbResponse.data,
            page,
            pageSize,
            totalRows: dbResponse.totalRows,
            pages: dbResponse.totalPages,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});


router.get('/credit/:invoiceId/payments', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {
    try {
        const { user, params } = req;
        const invoiceId = Number(params.invoiceId);

        if (!invoiceId) {
            return res.status(400).json({ ok: false, message: 'invoiceId es requerido' });
        }

        const dbResponse = await db.invoice.getInvoicePayments(user.businessId, invoiceId);

        if (dbResponse.notFound) {
            return res.status(404).json({ ok: false, message: 'Factura no encontrada' });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({
            ok: true,
            payments: dbResponse.data,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});


router.post('/credit/:invoiceId', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {
    try {
        const { user, body, params } = req;
        const invoiceId = Number(params.invoiceId);
        const amountPaid = Number(body.amountPaid);
        const paymentMethodCode = String(body.paymentMethod || '').trim().toUpperCase();

        if (!invoiceId) {
            return res.status(400).json({ ok: false, message: 'invoiceId es requerido' });
        }

        if (!paymentMethodCode) {
            return res.status(400).json({ ok: false, message: 'paymentMethod es requerido' });
        }

        if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
            return res.status(400).json({ ok: false, message: 'amountPaid debe ser un número mayor a 0' });
        }

        const { data: paymentMethods, error: paymentMethodsError } = await db.sysEntities.getSysPaymentMethods();

        if (paymentMethodsError) {
            throw new Error(paymentMethodsError);
        }

        const paymentMethodObj = paymentMethods.find(
            (method) => method.code === paymentMethodCode
        );

        if (!paymentMethodObj) {
            return res.status(400).json({ ok: false, message: 'Método de pago incorrecto' });
        }

        // Credit invoices should not accept CREDIT as an abono method
        if (paymentMethodObj.code === 'CREDIT') {
            return res.status(400).json({ ok: false, message: 'No se puede abonar con método crédito' });
        }

        const dbResponse = await db.invoice.registerCreditPayment(
            user.businessId,
            invoiceId,
            amountPaid,
            paymentMethodObj.id
        );

        if (dbResponse.notFound) {
            return res.status(404).json({ ok: false, message: 'Factura no encontrada' });
        }

        if (dbResponse.invalid) {
            return res.status(400).json({ ok: false, message: dbResponse.message });
        }

        if (dbResponse.error) {
            throw new Error(dbResponse.error);
        }

        return res.status(200).json({
            ok: true,
            payment: {
                id: dbResponse.data.paymentId,
                invoiceId: dbResponse.data.invoiceId,
                amountPaid: dbResponse.data.amountPaid,
                paymentDate: dbResponse.data.paymentDate,
                paymentMethod: paymentMethodObj,
                remain: dbResponse.data.remain,
                status: dbResponse.data.status,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});


module.exports = router;
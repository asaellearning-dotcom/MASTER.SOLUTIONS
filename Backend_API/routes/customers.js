const { Router } = require('express');

const db = require('../databse');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');

const router = Router();

router.post('/', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {

    try {
        const { user, body } = req;
        if(!body) {
           return res.status(400).send('Datos requeridos no estan presentes.');
        };


        const  { data, error } = await db.customers.insertCustomer(body, user.businessId);

        if(error) {
            console.log(error)
            return res.status(500).json({ok: false, message: 'Error guardando un cliente'});
        };



        return res.json({ok: true, customerId: data.customerId }).status(201);
        
    } catch (error) {
        console.log(error)
        return res.json({ok: false}).status(500);
    }
});



router.get('/', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.CASHIER), async (req, res) => {

    try {
        const { user, query } = req;
        const page = Number(query.page || 1);
        const pageSize = Number(query.pageSize || 10);

        if (pageSize > 100) {
            return res.status(400).json({ ok: false, message: 'no se retorna mas de 100 items por pagina' });
        }

        const dbResponse = await db.customers.getCustomers(
            user.businessId,
            Number(page),
            Number(pageSize),
            query.search
        );

        if (dbResponse.error) {
            return res.status(500).json({ ok: false });
        }

        return res.status(200).json({
            ok: true,
            customers: dbResponse.data,
            page,
            pageSize,
            totalRows: dbResponse.totalRows,
            pages: dbResponse.totalPages,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false });
    }
});

module.exports = router;
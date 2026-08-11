const { Router } = require('express');
const db = require('../databse');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');

const router = Router();

router.get('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const dbResponse = await db.business.getBusinessById(req.user.businessId);

        if (dbResponse.error || !dbResponse.data) {
            return res.status(404).json({ ok: false, message: 'Empresa no encontrada' });
        }

        return res.status(200).json({ ok: true, business: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.put('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const { body, user } = req;
        const name = String(body?.name || '').trim();
        const phone = String(body?.phone || '').trim();
        const address = String(body?.address || '').trim();
        const email = String(body?.email || '').trim();
        const businessNumber = String(body?.businessNumber || '').trim();
        const businessNumberType = String(body?.businessNumberType || '').trim().toUpperCase();

        if (!name || !email || !businessNumber || !businessNumberType) {
            return res.status(400).json({
                ok: false,
                message: 'Razón social, NIT/RUT, tipo y correo son requeridos',
            });
        }

        if (!['NIT', 'RUT'].includes(businessNumberType)) {
            return res.status(400).json({
                ok: false,
                message: 'El tipo de documento debe ser NIT o RUT',
            });
        }

        const dbResponse = await db.business.updateBusiness(user.businessId, {
            name,
            phone,
            address,
            email,
            businessNumber,
            businessNumberType,
        });

        if (dbResponse.error || !dbResponse.data) {
            return res.status(500).json({ ok: false, message: 'Error actualizando la empresa' });
        }

        return res.status(200).json({ ok: true, business: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

module.exports = router;

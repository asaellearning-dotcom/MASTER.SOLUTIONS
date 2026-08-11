const { Router } = require('express');
const jwt = require('jsonwebtoken');
const router = Router();

const db = require('../databse');
const {SECRET_KEY} =  require('../constants');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');
const { hashPassword, verifyPassword } = require('../password');

router.post('/login', async (req, res) => {

    try {
        if(!req.body.email || !req.body.businessNumber ) {
            return res.status(400).json({ok: false, error: 'email and business number  required'});
        }

        const result = await db.users.findUserProfile(req.body.email, req.body.businessNumber);
        console.log(result);

        if(result.success && result.data.length === 0) {
            return res.status(400).json({ok: false, message: 'Invalid credentials' });
        }

        const payload = result.data[0];
        const { matched, needsRehash } = await verifyPassword(req.body.password, payload.password);

        if (!matched) {
            return res.status(400).json({ok: false, message: 'Invalid credentials' });
        }

        if (!payload.roleCode) {
            return res.status(403).json({
                ok: false,
                message: 'El usuario no tiene un rol asignado',
            });
        }

        const licenseResponse = await db.licenses.getActiveLicense(payload.businessId);
        if (licenseResponse.error) {
            console.log(licenseResponse.error);
            return res.status(500).json({ ok: false, message: 'Error validando la licencia' });
        }

        if (!licenseResponse.data) {
            return res.status(403).json({
                ok: false,
                message: 'La empresa no tiene una licencia activa',
            });
        }

        // Upgrade legacy plaintext passwords to bcrypt after a successful login
        if (needsRehash) {
            const hashedPassword = await hashPassword(req.body.password);
            await db.users.updateUserPassword(payload.userId, hashedPassword);
        }

        const { password, ...safePayload } = payload;
        const token = jwt.sign(safePayload, SECRET_KEY, { expiresIn: '24h' });

        res.json({
            ok: true,
            token,
            userData: safePayload,
            license: {
                countUsers: licenseResponse.data.countUsers,
                dateStart: licenseResponse.data.dateStart,
                dateEnd: licenseResponse.data.dateEnd,
            },
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ok: false})
    }


});

router.get('/roles', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const dbResponse = await db.users.getUserRoles();

        if (dbResponse.error) {
            return res.status(500).json({ ok: false });
        }

        return res.status(200).json({ ok: true, roles: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.get('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const { user, query } = req;
        const page = Number(query.page || 1);
        const pageSize = Number(query.pageSize || 10);

        if (pageSize > 100) {
            return res.status(400).json({
                ok: false,
                message: 'no se retorna mas de 100 items por pagina',
            });
        }

        const dbResponse = await db.users.getUsers(
            user.businessId,
            Number(page),
            Number(pageSize),
            query.search
        );

        if (dbResponse.error) {
            return res.status(500).json({ ok: false });
        }

        const [licenseResponse, userCountResponse] = await Promise.all([
            db.licenses.getActiveLicense(user.businessId),
            db.licenses.getBusinessUserCount(user.businessId),
        ]);

        return res.status(200).json({
            ok: true,
            users: dbResponse.data,
            page,
            pageSize,
            totalRows: dbResponse.totalRows,
            pages: dbResponse.totalPages,
            licenseUsage: {
                currentUsers: userCountResponse.data ?? 0,
                maxUsers: licenseResponse.data?.countUsers ?? null,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.post('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const { user, body } = req;
        const documentNumber = String(body?.documentNumber || '').trim();
        const fullName = String(body?.fullName || '').trim();
        const email = String(body?.email || '').trim();
        const password = String(body?.password || '').trim();
        const phone = String(body?.phone || '').trim();
        const roleId = Number(body?.roleId);

        if (!documentNumber || !fullName || !email || !password || !Number.isFinite(roleId)) {
            return res.status(400).json({
                ok: false,
                message: 'Documento, nombre, correo, contraseña y rol son requeridos',
            });
        }

        const licenseResponse = await db.licenses.getActiveLicense(user.businessId);
        if (licenseResponse.error) {
            console.log(licenseResponse.error);
            return res.status(500).json({ ok: false, message: 'Error validando la licencia' });
        }

        if (!licenseResponse.data) {
            return res.status(403).json({
                ok: false,
                message: 'La empresa no tiene una licencia activa',
            });
        }

        const userCountResponse = await db.licenses.getBusinessUserCount(user.businessId);
        if (userCountResponse.error) {
            console.log(userCountResponse.error);
            return res.status(500).json({ ok: false, message: 'Error validando cupo de usuarios' });
        }

        if (userCountResponse.data >= Number(licenseResponse.data.countUsers)) {
            return res.status(403).json({
                ok: false,
                message: `La licencia permite máximo ${licenseResponse.data.countUsers} usuarios`,
            });
        }

        const dbResponse = await db.users.insertUser(
            {
                documentNumber,
                fullName,
                email,
                password,
                phone,
                roleId,
            },
            user.businessId
        );

        if (dbResponse.error) {
            const message = typeof dbResponse.error === 'string'
                ? dbResponse.error
                : 'Error guardando el usuario';
            const status = typeof dbResponse.error === 'string' ? 400 : 500;
            return res.status(status).json({ ok: false, message });
        }

        return res.status(201).json({ ok: true, userId: dbResponse.data.userId });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.get('/:userId', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isFinite(userId)) {
            return res.status(400).json({ ok: false, message: 'ID de usuario inválido' });
        }

        const dbResponse = await db.users.getUserById(userId, req.user.businessId);

        if (dbResponse.error || !dbResponse.data) {
            return res.status(404).json({
                ok: false,
                message: typeof dbResponse.error === 'string'
                    ? dbResponse.error
                    : 'Usuario no encontrado',
            });
        }

        return res.status(200).json({ ok: true, user: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.put('/:userId', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { body, user } = req;
        const documentNumber = String(body?.documentNumber || '').trim();
        const fullName = String(body?.fullName || '').trim();
        const email = String(body?.email || '').trim();
        const phone = String(body?.phone || '').trim();
        const password = String(body?.password || '').trim();
        const roleId = Number(body?.roleId);

        if (!Number.isFinite(userId)) {
            return res.status(400).json({ ok: false, message: 'ID de usuario inválido' });
        }

        if (!documentNumber || !fullName || !email || !Number.isFinite(roleId)) {
            return res.status(400).json({
                ok: false,
                message: 'Documento, nombre, correo y rol son requeridos',
            });
        }

        const dbResponse = await db.users.updateUser(userId, user.businessId, {
            documentNumber,
            fullName,
            email,
            phone,
            roleId,
            password: password || null,
        });

        if (dbResponse.error || !dbResponse.data) {
            const message = typeof dbResponse.error === 'string'
                ? dbResponse.error
                : 'Error actualizando el usuario';
            const status = typeof dbResponse.error === 'string' ? 400 : 500;
            return res.status(status).json({ ok: false, message });
        }

        return res.status(200).json({ ok: true, user: dbResponse.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});


module.exports = router;

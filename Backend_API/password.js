const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const isBcryptHash = (value = '') =>
    typeof value === 'string' && /^\$2[aby]\$/.test(value);

async function hashPassword(plainPassword) {
    return bcrypt.hash(String(plainPassword), SALT_ROUNDS);
}

/**
 * Compares a plain password with a stored value.
 * Supports legacy plaintext values and returns whether a rehash is needed.
 */
async function verifyPassword(plainPassword, storedPassword) {
    const plain = String(plainPassword ?? '');
    const stored = String(storedPassword ?? '');

    if (isBcryptHash(stored)) {
        const matched = await bcrypt.compare(plain, stored);
        return { matched, needsRehash: false };
    }

    // Legacy plaintext passwords (pre-hash migration)
    const matched = plain === stored;
    return { matched, needsRehash: matched };
}

module.exports = {
    hashPassword,
    verifyPassword,
    isBcryptHash,
};

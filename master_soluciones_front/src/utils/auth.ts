export const ROLES = {
    ADMIN: 'ADMIN',
    CASHIER: 'CASHIER',
} as const;

export type RoleCode = typeof ROLES[keyof typeof ROLES];

export type BasicUserData = {
    userId: number;
    email: string;
    fullName?: string;
    roleCode?: RoleCode | string;
    roleName?: string;
    businessId?: number;
    businessName?: string;
    businessNumber?: string | number;
    businessNumberType?: string;
};

export function getBasicUserData(): BasicUserData | null {
    try {
        const raw = localStorage.getItem('basicUSerData');
        if (!raw) return null;
        return JSON.parse(raw) as BasicUserData;
    } catch {
        return null;
    }
}

export function getRoleCode(): string | null {
    return getBasicUserData()?.roleCode ?? null;
}

export function hasRole(...allowedRoles: string[]): boolean {
    const roleCode = getRoleCode();
    if (!roleCode) return false;
    return allowedRoles.includes(roleCode);
}

export function isAdmin(): boolean {
    return hasRole(ROLES.ADMIN);
}

export function isCashier(): boolean {
    return hasRole(ROLES.CASHIER);
}

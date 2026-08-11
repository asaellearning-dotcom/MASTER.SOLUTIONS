const COLOMBIA_TIME_ZONE = 'America/Bogota';

const copFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

/**
 * Formats a number as Colombian peso (COP).
 * Example: 15000 → $ 15.000
 */
export function formatCOP(value: number | string | null | undefined): string {
    if (value == null || value === '') return copFormatter.format(0);

    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount)) return copFormatter.format(0);

    return copFormatter.format(amount);
}

/**
 * Formats an ISO date (or Date) for UI display in Colombia time.
 * Example: 2026-08-11T04:45:56.000Z → 10/08/2026 11:45 PM
 */
export function formatDateTime(value: string | Date | null | undefined): string {
    if (value == null || value === '') return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: COLOMBIA_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';

    const day = get('day');
    const month = get('month');
    const year = get('year');
    const hour = get('hour').padStart(2, '0');
    const minute = get('minute');
    const period = get('dayPeriod').replace(/\./g, '').replace(/\s/g, '').toUpperCase();

    return `${day}/${month}/${year} ${hour}:${minute} ${period}`;
}

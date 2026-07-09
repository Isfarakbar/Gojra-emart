const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

const ALLOWED_STATUS_TRANSITIONS = {
    Placed: ['Confirmed', 'Cancelled'],
    Confirmed: ['Packing', 'Cancelled'],
    Packing: ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: [],
};

const getKarachiClock = (now = Date.now()) => new Date(now + KARACHI_OFFSET_MS);
const toDateString = date => date.toISOString().slice(0, 10);

const validateDeliveryDate = (value, daysAhead, now = Date.now()) => {
    const requested = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requested)) return null;

    const todayClock = getKarachiClock(now);
    const today = toDateString(todayClock);
    const lastDate = new Date(`${today}T00:00:00.000Z`);
    lastDate.setUTCDate(lastDate.getUTCDate() + Math.max(Number(daysAhead) || 1, 1) - 1);

    if (requested < today || requested > toDateString(lastDate)) return null;
    return requested;
};

const isStatusTransitionAllowed = (currentStatus, nextStatus) =>
    (ALLOWED_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);

module.exports = {
    getKarachiClock,
    validateDeliveryDate,
    isStatusTransitionAllowed,
};

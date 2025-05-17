// --- Order Statuses ---
export const ORDER_STATUS_PENDING = 'pending';
export const ORDER_STATUS_CONFIRMED = 'confirmed';
export const ORDER_STATUS_PREPARING = 'preparing';
export const ORDER_STATUS_READY = 'ready'; // For pickup or out for delivery
export const ORDER_STATUS_SERVED = 'served'; // For dine-in
export const ORDER_STATUS_COMPLETED = 'completed'; // Generic completion
export const ORDER_STATUS_CANCELLED = 'cancelled';


export const ORDER_STATUS_ENUM = [
    ORDER_STATUS_PENDING,
    ORDER_STATUS_CONFIRMED,
    ORDER_STATUS_PREPARING,
    ORDER_STATUS_READY,
    ORDER_STATUS_SERVED,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_CANCELLED,
];

// Statuses considered "active" or "in-progress"
export const ACTIVE_ORDER_STATUSES = [
    ORDER_STATUS_PENDING,
    ORDER_STATUS_CONFIRMED,
    ORDER_STATUS_PREPARING,
    ORDER_STATUS_READY,
    ORDER_STATUS_SERVED,
];

// Statuses considered "inactive" or "terminal"
export const INACTIVE_ORDER_STATUSES = [
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_CANCELLED,
];


// --- Order Item Statuses ---
export const ITEM_STATUS_PENDING = 'pending';
export const ITEM_STATUS_PREPARING = 'preparing';
export const ITEM_STATUS_READY = 'ready';
export const ITEM_STATUS_SERVED = 'served';
export const ITEM_STATUS_CANCELLED = 'cancelled';

export const ITEM_STATUS_ENUM = [
    ITEM_STATUS_PENDING,
    ITEM_STATUS_PREPARING,
    ITEM_STATUS_READY,
    ITEM_STATUS_SERVED,
    ITEM_STATUS_CANCELLED,
];


// --- Payment Statuses ---
export const PAYMENT_STATUS_UNPAID = 'unpaid';
export const PAYMENT_STATUS_PARTIALLY_PAID = 'partially_paid';
export const PAYMENT_STATUS_PAID = 'paid';
export const PAYMENT_STATUS_REFUNDED = 'refunded';
export const PAYMENT_STATUS_FAILED = 'failed';

export const PAYMENT_STATUS_ENUM = [
    PAYMENT_STATUS_UNPAID,
    PAYMENT_STATUS_PAID,
    PAYMENT_STATUS_REFUNDED,
];


// --- Payment Methods ---
export const PAYMENT_METHOD_CASH = 'cash';
export const PAYMENT_METHOD_CREDIT_CARD = 'credit_card';
export const PAYMENT_METHOD_DEBIT_CARD = 'debit_card';
export const PAYMENT_METHOD_MOBILE_WALLET = 'mobile_wallet';
export const PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer';
export const PAYMENT_METHOD_VOUCHER = 'voucher';
export const PAYMENT_METHOD_ONLINE_PAYMENT = 'online_payment';

export const PAYMENT_METHOD_ENUM = [
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CREDIT_CARD,
    PAYMENT_METHOD_DEBIT_CARD,
    PAYMENT_METHOD_MOBILE_WALLET,
    PAYMENT_METHOD_BANK_TRANSFER,
    PAYMENT_METHOD_VOUCHER,
    PAYMENT_METHOD_ONLINE_PAYMENT,
];


// --- Order Types ---
export const ORDER_TYPE_DINE_IN = 'dine_in';
export const ORDER_TYPE_TAKEAWAY = 'takeaway';
export const ORDER_TYPE_DELIVERY = 'delivery';

export const ORDER_TYPE_ENUM = [
    ORDER_TYPE_DINE_IN,
    ORDER_TYPE_TAKEAWAY,
    ORDER_TYPE_DELIVERY,
];

// --- Branch Statuses (from previous branch model) ---
export const BRANCH_STATUS_ACTIVE = 'active';
export const BRANCH_STATUS_INACTIVE = 'inactive';
export const BRANCH_STATUS_UNDER_MAINTENANCE = 'under_maintenance';
export const BRANCH_STATUS_OPENING_SOON = 'opening_soon';
export const BRANCH_STATUS_CLOSED_PERMANENTLY = 'closed_permanently';

export const BRANCH_STATUS_ENUM = [
    BRANCH_STATUS_ACTIVE,
    BRANCH_STATUS_INACTIVE,
    BRANCH_STATUS_UNDER_MAINTENANCE,
    BRANCH_STATUS_OPENING_SOON,
    BRANCH_STATUS_CLOSED_PERMANENTLY,
];

// --- Day of the Week (from previous branch model) ---
export const DAY_SUNDAY = 'sunday';
export const DAY_MONDAY = 'monday';
export const DAY_TUESDAY = 'tuesday';
export const DAY_WEDNESDAY = 'wednesday';
export const DAY_THURSDAY = 'thursday';
export const DAY_FRIDAY = 'friday';
export const DAY_SATURDAY = 'saturday';

export const DAY_OF_WEEK_ENUM = [
    DAY_SUNDAY,
    DAY_MONDAY,
    DAY_TUESDAY,
    DAY_WEDNESDAY,
    DAY_THURSDAY,
    DAY_FRIDAY,
    DAY_SATURDAY,
];

// Numerical mapping for Day of the Week (if your DB uses numbers 0-6)
export const DAY_OF_WEEK_NUMERIC_MAP = {
    [DAY_SUNDAY]: 0,
    [DAY_MONDAY]: 1,
    [DAY_TUESDAY]: 2,
    [DAY_WEDNESDAY]: 3,
    [DAY_THURSDAY]: 4,
    [DAY_FRIDAY]: 5,
    [DAY_SATURDAY]: 6,
};
export const NUMERIC_DAY_OF_WEEK_ENUM = [0, 1, 2, 3, 4, 5, 6];


// --- Discount Types (from previous discount model) ---
export const DISCOUNT_TYPE_PERCENTAGE = 'percentage';
export const DISCOUNT_TYPE_FIXED_AMOUNT_OFF = 'fixed_amount_off';
export const DISCOUNT_TYPE_FIXED_PRICE = 'fixed_price';
export const DISCOUNT_TYPE_FREE_SHIPPING = 'free_shipping';

export const DISCOUNT_TYPE_ENUM = [
    DISCOUNT_TYPE_PERCENTAGE,
    DISCOUNT_TYPE_FIXED_AMOUNT_OFF,
    DISCOUNT_TYPE_FIXED_PRICE,
    DISCOUNT_TYPE_FREE_SHIPPING,
];

// You can continue to add other enum constants here as your application grows.
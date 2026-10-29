export const ORDER_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["UNSELECTED", "UPI", "COUNTER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** PENDING = not paid, CLAIMED = customer says they paid by UPI (staff must check), PAID = confirmed by staff. */
export const PAYMENT_STATUSES = ["PENDING", "CLAIMED", "PAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SERVICE_TYPES = ["WAITER", "WATER", "BILL"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export type StoredOrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
};

export type StoredOrder = {
  id: number;
  table_number: number;
  status: OrderStatus;
  total: number;
  note: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  /** UTC, "YYYY-MM-DD HH:MM:SS" */
  created_at: string;
  items: StoredOrderItem[];
};

export type ServiceRequest = {
  id: number;
  table_number: number;
  type: ServiceType;
  status: "OPEN" | "DONE";
  created_at: string;
};

export type UpiConfig = { id: string; name: string };

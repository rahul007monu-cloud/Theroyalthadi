import type { OrderStatus, PaymentMethod, PaymentStatus, ServiceRequest, ServiceType, StoredOrder } from "@/lib/types";

export type NewOrderItem = { menuItemId: number; name: string; unitPrice: number; quantity: number };
export type NewOrder = { tableNumber: number; note: string; items: NewOrderItem[] };
export type OrderChanges = { status?: OrderStatus; paymentMethod?: PaymentMethod; paymentStatus?: PaymentStatus };

export interface Store {
  createOrder(order: NewOrder): Promise<{ id: number; total: number }>;
  listOrders(limit?: number): Promise<StoredOrder[]>;
  updateOrder(id: number, changes: OrderChanges): Promise<boolean>;
  /** Customer-side payment update: never changes a PAID order. */
  recordPaymentChoice(id: number, method: PaymentMethod, claimedPaid: boolean): Promise<boolean>;
  createServiceRequest(tableNumber: number, type: ServiceType): Promise<{ request: ServiceRequest; duplicate: boolean }>;
  listOpenServiceRequests(): Promise<ServiceRequest[]>;
  resolveServiceRequest(id: number): Promise<boolean>;
  /** Cheap change marker for polling. Stores that cannot provide one return null. */
  getVersion?(): Promise<number | null>;
}

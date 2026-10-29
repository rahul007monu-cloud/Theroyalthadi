import type { StoredOrder } from "@/lib/types";

const methodLabel: Record<StoredOrder["payment_method"], string> = {
  UNSELECTED: "Payment not chosen",
  UPI: "UPI",
  COUNTER: "Cash / Counter"
};

export function PaymentBadge({ order }: { order: StoredOrder }) {
  if (order.payment_status === "PAID") return <span className="pay-badge pay-badge--paid">Paid ✓</span>;
  if (order.payment_status === "CLAIMED") return <span className="pay-badge pay-badge--claimed">UPI · customer says paid</span>;
  return <span className="pay-badge">{methodLabel[order.payment_method]} · unpaid</span>;
}

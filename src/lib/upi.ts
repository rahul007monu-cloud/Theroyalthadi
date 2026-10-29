import type { UpiConfig } from "@/lib/types";

/** Standard UPI deep link (opens GPay / PhonePe / Paytm / BHIM with the amount filled in). */
export function buildUpiLink(upi: UpiConfig, amount: number, note: string) {
  const params = new URLSearchParams({
    pa: upi.id,
    pn: upi.name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note.slice(0, 50)
  });
  return `upi://pay?${params.toString()}`;
}

/** Reads the cafe UPI ID from server environment variables. Returns null until it is configured. */
export function readUpiConfig(env: Record<string, string | undefined>): UpiConfig | null {
  const id = env.UPI_ID?.trim();
  if (!id || !/^[\w.\-]{2,256}@[a-zA-Z][\w.\-]{1,64}$/.test(id)) return null;
  return { id, name: env.UPI_PAYEE_NAME?.trim() || "The Royal Thadi" };
}

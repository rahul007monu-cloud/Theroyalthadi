import QRCode from "qrcode";
import { buildUpiLink, readUpiConfig } from "@/lib/upi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** UPI payment QR for an amount. The UPI ID comes only from server env (UPI_ID), never from the request. */
export async function GET(request: Request) {
  const upi = readUpiConfig(process.env);
  if (!upi) return Response.json({ error: "UPI payment is not configured yet." }, { status: 404 });

  const url = new URL(request.url);
  const amount = Number(url.searchParams.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return Response.json({ error: "Invalid amount." }, { status: 400 });
  }
  const note = (url.searchParams.get("note") ?? "The Royal Thadi").slice(0, 50);

  const png = await QRCode.toBuffer(buildUpiLink(upi, Math.round(amount * 100) / 100, note), {
    width: 520,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#17100A", light: "#FFFFFF" }
  });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}

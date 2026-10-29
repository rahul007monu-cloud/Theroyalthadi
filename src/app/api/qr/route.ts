import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tableNumber = Number(url.searchParams.get("table"));

  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 50) {
    return Response.json({ error: "Table number must be between 1 and 50." }, { status: 400 });
  }

  const orderingOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? url.origin;
  const orderingUrl = `${orderingOrigin}/?table=${tableNumber}`;
  const png = await QRCode.toBuffer(orderingUrl, {
    width: 480,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#17100A", light: "#F7EEDB" }
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="royal-thadi-table-${String(tableNumber).padStart(2, "0")}.png"`,
      "Cache-Control": "public, max-age=3600"
    }
  });
}

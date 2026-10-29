import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "@/lib/db";

export const MAX_TABLES = 50;

export function parseTableNumber(value: unknown) {
  const tableNumber = Number(value);
  return Number.isInteger(tableNumber) && tableNumber >= 1 && tableNumber <= MAX_TABLES ? tableNumber : null;
}

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json({ error: "Ordering is temporarily unavailable. Please call a staff member." }, { status: 503 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}

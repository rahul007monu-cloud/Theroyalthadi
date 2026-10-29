import { RoyalExperience } from "@/components/royal-experience";
import { parseTableNumber } from "@/lib/api";

export default async function Home({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const params = await searchParams;
  const tableNumber = parseTableNumber(params.table);

  // Without a valid table QR the menu is browse-only, so no order is ever sent to the wrong table.
  return <RoyalExperience table={tableNumber ? String(tableNumber).padStart(2, "0") : null} />;
}

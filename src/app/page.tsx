import { RoyalExperience } from "@/components/royal-experience";
import { parseTableNumber } from "@/lib/api";
import { readUpiConfig } from "@/lib/upi";

export default async function Home({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const params = await searchParams;
  const tableNumber = parseTableNumber(params.table);

  // A table QR pre-selects the table; anyone can still pick or change their table on the page.
  return <RoyalExperience initialTable={tableNumber} upi={readUpiConfig(process.env)} />;
}

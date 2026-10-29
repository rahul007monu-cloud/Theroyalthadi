import { RoyalExperience } from "@/components/royal-experience";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const params = await searchParams;
  const requestedTable = Number(params.table);
  const table = Number.isInteger(requestedTable) && requestedTable >= 1 && requestedTable <= 50
    ? String(requestedTable).padStart(2, "0")
    : "07";

  return <RoyalExperience initialTable={table} />;
}

import { IntakeBasics } from "@/components/intake/intake-basics";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <IntakeBasics error={error} />;
}

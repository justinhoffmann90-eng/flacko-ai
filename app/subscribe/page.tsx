import { redirect } from "next/navigation";

export default function SubscribePage({
  searchParams,
}: {
  searchParams: { reason?: string; email?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.reason) params.set("reason", searchParams.reason);
  if (searchParams.email) params.set("email", searchParams.email);
  const query = params.toString();
  redirect(`/signup${query ? `?${query}` : ""}`);
}

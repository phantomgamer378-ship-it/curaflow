import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <DashboardScreen role="patient" segments={slug} />;
}

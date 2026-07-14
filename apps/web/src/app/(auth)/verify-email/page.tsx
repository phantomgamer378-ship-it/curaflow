import { AuthPage } from "@/components/auth/auth-page";
export default async function Page(props: { searchParams: Promise<{ token?: string }> }) {
  const params = await props.searchParams;
  return <AuthPage mode="verify-email" resetToken={params.token} />;
}

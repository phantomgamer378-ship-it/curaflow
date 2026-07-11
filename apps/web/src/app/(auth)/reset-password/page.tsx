import { AuthPage } from "@/components/auth/auth-page";

type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: { searchParams: AuthSearchParams }) {
  const params = await searchParams;
  return (
    <AuthPage
      mode="reset-password"
      resetToken={firstParam(params.code) || firstParam(params.token) || ""}
    />
  );
}

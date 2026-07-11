import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const isServer = typeof window === "undefined";
    
    let token = "";
    if (isServer) {
      // In Server Components, get the token from next/headers
      const { cookies } = await import("next/headers");
      token = (await cookies()).get("authToken")?.value || "";
    } else {
      // In Client Components, get the token via js-cookie
      token = Cookies.get("authToken") || "";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      // If unauthorized, we might want to trigger a logout, but for now just return the error
      return { ok: false, error: result?.error || `HTTP ${response.status}` };
    }

    return result || { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
}

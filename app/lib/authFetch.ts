export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const role = localStorage.getItem("userRole");
  localStorage.clear();
  window.location.href = role === "CHILD" ? "/auth/child/login" : "/auth/parent/login";
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) redirectToLogin();
  return res;
}

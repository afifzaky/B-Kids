const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Single-flight: jika ada beberapa request yang 401 bersamaan,
// hanya satu refresh yang dikirim ke backend (backend pakai token rotation).
let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function notifyQueue(success: boolean): void {
  refreshQueue.forEach((resolve) => resolve(success));
  refreshQueue = [];
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise<boolean>((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      notifyQueue(false);
      return false;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      notifyQueue(false);
      return false;
    }

    const data = await res.json();
    if (data.success && data.data?.accessToken && data.data?.refreshToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      notifyQueue(true);
      return true;
    }

    notifyQueue(false);
    return false;
  } catch {
    notifyQueue(false);
    return false;
  } finally {
    isRefreshing = false;
  }
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("__auth-expired-toast")) return;

  const role = localStorage.getItem("userRole");
  localStorage.clear();

  const toast = document.createElement("div");
  toast.id = "__auth-expired-toast";
  toast.style.cssText = [
    "position:fixed",
    "top:24px",
    "left:50%",
    "transform:translateX(-50%) translateY(-16px)",
    "z-index:99999",
    "background:#dc2626",
    "color:#fff",
    "padding:14px 20px",
    "border-radius:14px",
    "font-family:Poppins,sans-serif",
    "box-shadow:0 8px 32px rgba(0,0,0,0.25)",
    "min-width:280px",
    "display:flex",
    "align-items:center",
    "gap:12px",
    "opacity:0",
    "transition:transform 0.3s ease,opacity 0.3s ease",
  ].join(";");

  toast.innerHTML =
    '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="flex-shrink:0">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' +
    "</svg>" +
    '<div><p style="margin:0;font-weight:700;font-size:14px">Sesi Kadaluarsa</p>' +
    '<p style="margin:4px 0 0;font-size:12px;opacity:0.9">Silakan login kembali...</p></div>';

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(-50%) translateY(0)";
    toast.style.opacity = "1";
  });

  const loginPath = role === "CHILD" ? "/auth/child/login" : "/auth/parent/login";
  setTimeout(() => { window.location.href = loginPath; }, 2000);
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status !== 401) return res;

  // Coba refresh token sebelum menyerah
  const refreshed = await attemptRefresh();
  if (refreshed) {
    const newToken = localStorage.getItem("accessToken");
    const retryOptions: RequestInit = {
      ...options,
      headers: {
        ...(options.headers as Record<string, string> ?? {}),
        Authorization: `Bearer ${newToken}`,
      },
    };
    const retryRes = await fetch(url, retryOptions);
    if (retryRes.status !== 401) return retryRes;
  }

  redirectToLogin();
  return res;
}

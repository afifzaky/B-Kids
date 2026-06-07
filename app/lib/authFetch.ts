export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("__auth-expired-toast")) return; // prevent double trigger

  const role = localStorage.getItem("userRole");
  localStorage.clear();

  // Build toast element
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
  if (res.status === 401) redirectToLogin();
  return res;
}

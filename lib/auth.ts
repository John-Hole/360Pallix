export const ADMIN_COOKIE_NAME = "pallix_admin_auth";
export const ADMIN_COOKIE_VALUE = "authenticated_360pallix";

/**
 * Checks whether the incoming request is authorized:
 * 1. Checks if the local authentication cookie is present.
 * 2. Checks if the x-admin-auth header is present.
 * 3. Fallback: Checks if ADMIN_PASSWORD matches header or payload.
 */
export function isAuthorized(req: Request, bodyPassword?: string): boolean {
  // 1. Check Cookie
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes(`${ADMIN_COOKIE_NAME}=${ADMIN_COOKIE_VALUE}`)) {
    return true;
  }

  // 2. Check Auth Header
  const headerAuth = req.headers.get("x-admin-auth");
  if (headerAuth === "1" || headerAuth === ADMIN_COOKIE_VALUE) {
    return true;
  }

  // 3. Fallback to password check
  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
  const headerPw = req.headers.get("x-admin-password");
  const providedPw = bodyPassword || headerPw || "";
  if (providedPw && providedPw === expectedPw) {
    return true;
  }

  return false;
}

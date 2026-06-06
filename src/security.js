export const ROLE_PERMISSIONS = Object.freeze({
  manager: ["dashboard", "rooms", "students", "requests", "parking", "reports"],
  student: ["profile", "room", "student-parking", "support"],
});

export const SECURITY_LIMITATIONS = Object.freeze([
  "Bản demo chạy frontend tĩnh nên không có backend xác thực thật.",
  "Mật khẩu mẫu đang nằm trong localStorage để phục vụ thuyết trình, không dùng cho production.",
  "localStorage có thể bị người dùng trên cùng trình duyệt đọc/sửa, vì vậy không lưu dữ liệu thật.",
]);

export const defaultRouteForRole = (role) => ROLE_PERMISSIONS[role]?.[0] ?? "dashboard";

export const canAccessRoute = (user, route) => {
  if (!user?.role || !route) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(route) ?? false;
};

export const sanitizeText = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const sanitizePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload ?? {}).map(([key, value]) => [key, typeof value === "string" ? sanitizeText(value) : value]),
  );

export const assertAuthenticated = (user) => {
  if (!user) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
};

export const assertRole = (user, role) => {
  assertAuthenticated(user);
  if (user.role !== role) throw new Error("Bạn không có quyền thực hiện thao tác này.");
};

export const assertManager = (user) => assertRole(user, "manager");
export const assertStudent = (user) => assertRole(user, "student");

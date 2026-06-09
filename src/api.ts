import type { AuthUser, Branch, UserAccount, Order, OrderItem, InventoryItem, Shift, SalesSummary, HQAnalytics, MenuItem } from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000") + "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, (err as { message?: string }).message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiLogin = (email: string, password: string) =>
  apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Public customer ordering

export const publicGetBranches = () =>
  apiFetch<Branch[]>("/public/branches");

export const publicGetMenu = (branchId?: string) =>
  apiFetch<MenuItem[]>(`/public/menu${branchId ? `?branchId=${branchId}` : ""}`);

export const publicCreateOrder = (
  data: {
    branchId: string;
    tableNumber: number;
    items: OrderItem[];
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    notes?: string;
  },
) => apiFetch<Order>("/public/orders", { method: "POST", body: JSON.stringify(data) });

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminGetBranches = (token: string) =>
  apiFetch<Branch[]>("/admin/branches", {}, token);

export const adminCreateBranch = (token: string, data: { name: string; location: string }) =>
  apiFetch<Branch>("/admin/branches", { method: "POST", body: JSON.stringify(data) }, token);

export const adminGetUsers = (token: string) =>
  apiFetch<UserAccount[]>("/admin/users", {}, token);

export const adminCreateUser = (
  token: string,
  data: { email: string; password: string; name: string; role: number; branchId?: string | null },
) => apiFetch<UserAccount>("/admin/users", { method: "POST", body: JSON.stringify(data) }, token);

export const adminUpdateUser = (
  token: string,
  id: string,
  data: Partial<{ email: string; password: string; name: string; role: number; branchId: string | null }>,
) => apiFetch<UserAccount>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);

export const adminDeleteUser = (token: string, id: string) =>
  apiFetch<void>(`/admin/users/${id}`, { method: "DELETE" }, token);

export const adminDeleteBranch = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/admin/branches/${id}`, { method: "DELETE" }, token);

// ── HQ ───────────────────────────────────────────────────────────────────────

export const hqGetBranches = (token: string) =>
  apiFetch<Branch[]>("/hq/branches", {}, token);

export const hqGetOrders = (token: string, branchId?: string) =>
  apiFetch<Order[]>(`/hq/orders${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`, {}, token);

export const hqGetInventory = (token: string, branchId?: string) =>
  apiFetch<InventoryItem[]>(`/hq/inventory${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`, {}, token);

export const hqGetShifts = (token: string, branchId?: string) =>
  apiFetch<Shift[]>(`/hq/shifts${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`, {}, token);

// ── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = (token: string) =>
  apiFetch<Order[]>("/orders", {}, token);

export const createOrder = (
  token: string,
  data: { tableNumber: number; items: OrderItem[]; totalAmount: number; customerName?: string },
) => apiFetch<Order>("/orders", { method: "POST", body: JSON.stringify(data) }, token);

export const updateOrderStatus = (token: string, id: string, status: string) =>
  apiFetch<Order>(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token);

export const deleteOrder = (token: string, id: string) =>
  apiFetch<void>(`/orders/${id}`, { method: "DELETE" }, token);

// ── Inventory ─────────────────────────────────────────────────────────────────

export const getInventory = (token: string) =>
  apiFetch<InventoryItem[]>("/inventory", {}, token);

export const createInventoryItem = (
  token: string,
  data: { itemName: string; quantity: number; status?: string },
) => apiFetch<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }, token);

export const updateInventoryItem = (
  token: string,
  id: string,
  data: { itemName?: string; quantity?: number; status?: string },
) => apiFetch<InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);

export const deleteInventoryItem = (token: string, id: string) =>
  apiFetch<void>(`/inventory/${id}`, { method: "DELETE" }, token);

// ── Shifts ───────────────────────────────────────────────────────────────────

export const getShifts = (token: string) =>
  apiFetch<Shift[]>("/shifts", {}, token);

export const createShift = (
  token: string,
  data: { userId: string; startTime: string; endTime: string },
) => apiFetch<Shift>("/shifts", { method: "POST", body: JSON.stringify(data) }, token);

export const deleteShift = (token: string, id: string) =>
  apiFetch<void>(`/shifts/${id}`, { method: "DELETE" }, token);

// ── Sales ─────────────────────────────────────────────────────────────────────

export const getSalesSummary = (token: string) =>
  apiFetch<SalesSummary>("/sales/summary", {}, token);

export const hqGetSalesSummary = (token: string, branchId?: string) =>
  apiFetch<SalesSummary[]>(`/sales/by-branch${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`, {}, token);

export const hqGetAnalytics = (token: string) =>
  apiFetch<HQAnalytics>("/sales/analytics", {}, token);

// ── Menu ──────────────────────────────────────────────────────────────────────

export const getMenuItems = (token: string) =>
  apiFetch<MenuItem[]>("/menu/manage", {}, token);

export const createMenuItem = (
  token: string,
  data: Omit<MenuItem, "id" | "branchId" | "createdAt" | "updatedAt">,
) => apiFetch<MenuItem>("/menu", { method: "POST", body: JSON.stringify(data) }, token);

export const updateMenuItem = (token: string, id: string, data: Partial<MenuItem>) =>
  apiFetch<MenuItem>(`/menu/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);

export const deleteMenuItem = (token: string, id: string) =>
  apiFetch<void>(`/menu/${id}`, { method: "DELETE" }, token);

// ── Customer ──────────────────────────────────────────────────────────────────

export const getMyOrders = (token: string) =>
  apiFetch<Order[]>("/orders/my", {}, token);

// ── Public helpers ────────────────────────────────────────────────────────────

export const checkCustomerName = (name: string, withEmail = false) =>
  apiFetch<{ exists: boolean; email?: string | null }>(
    `/public/check-name?name=${encodeURIComponent(name)}${withEmail ? "&withEmail=true" : ""}`,
  );

export const getAvailableTables = (branchId: string) =>
  apiFetch<{ occupiedTables: number[] }>(`/public/tables?branchId=${encodeURIComponent(branchId)}`);

// ── Reservations ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string | null;
  partySize: number;
  tableNumber: number;
  date: string;
  notes: string | null;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: "Pending" | "Seated" | "Cancelled" | "Paid";
  orderId?: string;
  branchId: string;
  branch?: { name: string };
  createdAt: string;
  updatedAt: string;
}

export const createReservation = (data: {
  customerName: string;
  customerEmail?: string;
  partySize: number;
  tableNumber: number;
  date: string;
  notes?: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  branchId: string;
}) => apiFetch<Reservation>("/reservations", { method: "POST", body: JSON.stringify(data) });

export const getReservations = (token: string, branchId?: string) =>
  apiFetch<Reservation[]>(`/reservations${branchId ? `?branchId=${branchId}` : ""}`, {}, token);

export const getMyReservations = (token: string) =>
  apiFetch<Reservation[]>("/reservations/my", {}, token);

export const seatReservation = (token: string, id: string) =>
  apiFetch<Reservation>(`/reservations/${id}/seat`, { method: "PUT" }, token);

export const cancelReservation = (token: string, id: string) =>
  apiFetch<Reservation>(`/reservations/${id}/cancel`, { method: "PUT" }, token);

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  orderId: string;
  customerName: string;
  rating: number;
  comment: string | null;
  branchId: string;
  branch?: { name: string };
  createdAt: string;
}

export interface ReviewStats {
  average: number;
  count: number;
}

export const getPublicReviews = () =>
  apiFetch<Review[]>("/reviews/public");

export const getReviewStats = () =>
  apiFetch<ReviewStats>("/reviews/stats");

export const submitReview = (token: string, data: { orderId: string; rating: number; comment?: string }) =>
  apiFetch<Review>("/reviews", { method: "POST", body: JSON.stringify(data) }, token);

// ── Staff helpers ─────────────────────────────────────────────────────────────

export interface BranchStaffMember {
  id: string;
  name: string;
  role: number;
  email: string;
}

export const getBranchStaff = (token: string) =>
  apiFetch<BranchStaffMember[]>("/shifts/branch-staff", {}, token);

export type Role = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const RoleLabels: Record<Role, string> = {
  0: "Open Area",
  1: "HQ Manager",
  2: "Branch Manager",
  3: "Chef",
  4: "Cashier",
  5: "Waiter",
  6: "Customer",
  7: "Admin",
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; orders: number; inventoryItems: number };
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branch?: { id: string; name: string; location: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  branchId: string;
  tableNumber: number;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Preparing" | "Served" | "Paid";
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  itemName: string;
  quantity: number;
  status: "Normal" | "LowStock";
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  user: { id: string; name: string; email: string; role: Role };
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  branchId: string;
  branchName: string;
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingOrders: number;
  preparingOrders?: number;
  servedOrders?: number;
  averageOrderValue: number;
}

export interface HQAnalytics {
  branchSummaries: SalesSummary[];
  totalRevenue: number;
  totalOrders: number;
  totalPaid: number;
  topBranch: SalesSummary;
  statusBreakdown: { name: string; value: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ClipboardList,
  CheckCircle2, Minus, Plus, ReceiptText,
  ShoppingCart, Trash2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "./contexts/AuthContext";
import { ToastContainer, toast } from "./components/Toast";
import { AnimatedKpiCard } from "./components/AnimatedKpiCard";
import {
  adminGetBranches, adminCreateBranch, adminDeleteBranch, adminGetUsers, adminCreateUser,
  adminUpdateUser, adminDeleteUser,
  publicGetBranches, publicCreateOrder,
  hqGetBranches, hqGetOrders, hqGetInventory, hqGetShifts,
  getOrders, createOrder, updateOrderStatus, deleteOrder,
  getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem,
  getShifts, createShift, deleteShift,
  getSalesSummary, hqGetSalesSummary, hqGetAnalytics,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  getMyOrders,
  getBranchStaff,
  getReservations, seatReservation, cancelReservation,
} from "./api";
import type { BranchStaffMember, Reservation } from "./api";
import { RoleLabels } from "./types";
import type { Branch, InventoryItem, Order, Role, Shift, UserAccount, SalesSummary, HQAnalytics, MenuItem } from "./types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ReservationPage from "./pages/ReservationPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import OrderPage from "./pages/OrderPage";
import AuthPage from "./pages/AuthPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import StaffPortal from "./pages/StaffPortal";

// ── Shared helpers ────────────────────────────────────────────────────────────

type HQTab = "Overview" | "Orders" | "Inventory" | "Shifts" | "Sales";

const PRICED_MENU_ITEMS = [
  { name: "Bone Marrow & Sourdough",     price: 8.95,  category: "Starters", description: "Roasted bone marrow, parsley salad, sea salt sourdough toast." },
  { name: "Burrata & Heritage Tomatoes", price: 7.50,  category: "Starters", description: "Creamy burrata, heirloom tomatoes, aged balsamic, basil oil." },
  { name: "Black Pudding Scotch Egg",    price: 7.95,  category: "Starters", description: "Free-range egg, Stornoway black pudding, mustard aioli." },
  { name: "28-Day Aged Ribeye (300g)",   price: 34.95, category: "Steaks",   description: "Dry-aged British ribeye, herb butter, triple-cooked chips." },
  { name: "Flat Iron Steak (250g)",      price: 24.95, category: "Steaks",   description: "Bavette cut, chimichurri, watercress, shoestring fries." },
  { name: "Rump & Egg (200g)",           price: 21.95, category: "Steaks",   description: "Grass-fed rump, fried hen's egg, beer-battered onion rings." },
  { name: "Tomahawk (1kg, for 2)",       price: 85.00, category: "Steaks",   description: "45-day dry-aged tomahawk, bone-in, sharing sides included." },
  { name: "Triple-Cooked Chips",         price: 4.95,  category: "Sides",    description: "Goose fat chips, flaky sea salt." },
  { name: "Cauliflower Cheese",          price: 5.50,  category: "Sides",    description: "Aged cheddar, gruyère, toasted breadcrumbs." },
  { name: "Sticky Toffee Pudding",       price: 7.95,  category: "Desserts", description: "Medjool date sponge, salted caramel toffee sauce, clotted cream." },
  { name: "Dark Chocolate Fondant",      price: 8.50,  category: "Desserts", description: "Valrhona chocolate, salted caramel centre, honeycomb ice cream." },
  { name: "House Red",                   price: 6.50,  category: "Drinks",   description: "Malbec, Mendoza, Argentina." },
  { name: "Classic Negroni",             price: 9.50,  category: "Drinks",   description: "Tanqueray gin, Campari, sweet vermouth, orange zest." },
];

const MENU_ITEMS = [
  "Bone Marrow & Sourdough", "Burrata & Heritage Tomatoes", "Potted Beef & Pickles",
  "Smoked Salmon Rillettes", "Black Pudding Scotch Egg",
  "28-Day Aged Ribeye (300g)", "Chateaubriand (500g, for 2)", "Flat Iron Steak (250g)",
  "Tomahawk (1kg, for 2)", "Rump & Egg (200g)",
  "Triple-Cooked Chips", "Cauliflower Cheese", "Tenderstem Broccoli", "Creamed Spinach",
  "Sticky Toffee Pudding", "Eton Mess Cheesecake", "Dark Chocolate Fondant",
  "House Red", "Aperol Spritz", "Classic Negroni", "Soft Drinks",
];
const getMenuPrice = (name: string) => PRICED_MENU_ITEMS.find((item) => item.name === name)?.price ?? 0;
const DEFAULT_MENU_ITEM = { name: "28-Day Aged Ribeye (300g)", price: 34.95 };

const FALLBACK_PUBLIC_BRANCHES: Pick<Branch, "id" | "name" | "location">[] = [
  { id: "manchester", name: "Steakz Manchester", location: "Manchester, UK" },
  { id: "london",     name: "Steakz London",     location: "London, UK"     },
  { id: "edinburgh",  name: "Steakz Edinburgh",  location: "Edinburgh, UK"  },
  { id: "birmingham", name: "Steakz Birmingham", location: "Birmingham, UK" },
  { id: "bristol",    name: "Steakz Bristol",    location: "Bristol, UK"    },
];

function Spinner() {
  return <p style={{ color: "#b3b3b3", padding: "24px 0", gridColumn: "1 / -1" }}>Loading…</p>;
}

function ApiErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      color: "#ff6b6b", padding: "10px 14px", borderRadius: 8,
      background: "rgba(224,17,95,0.12)", border: "1px solid rgba(224,17,95,0.3)",
      gridColumn: "1 / -1",
    }}>
      {message}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p style={{ color: "#b3b3b3", fontStyle: "italic" }}>{label}</p>;
}

function formatCurrency(value: number) {
  return `£${value.toFixed(2)}`;
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function BranchBanner({ label, sublabel, branch }: { label: string; sublabel: string; branch?: string | null }) {
  return (
    <div className="branch-banner">
      <div className="branch-banner-left">
        <span>{label}</span>
        {branch && <span className="branch-badge">📍 {branch}</span>}
      </div>
      <strong>{sublabel}</strong>
    </div>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="card">
      <h2>{title}</h2>
      {items.map((item) => <p key={item}>{item}</p>)}
    </article>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/order" element={
          isAuthenticated && user?.role !== 6
            ? <Navigate to="/" replace />
            : <OrderPage />
        } />
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={user?.role === 6 ? "/my-orders" : "/staff"} replace />
            : <AuthPage />
        } />
        <Route path="/my-orders" element={
          isAuthenticated && user?.role === 6
            ? <MyOrdersPage />
            : <Navigate to="/login" replace />
        } />
        <Route path="/staff" element={
          isAuthenticated && user?.role !== 6
            ? <StaffPortal />
            : <Navigate to="/login" replace />
        } />
        <Route path="/reserve" element={
          isAuthenticated && user?.role !== 6
            ? <Navigate to="/" replace />
            : <ReservationPage />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

// ── Dashboard router ──────────────────────────────────────────────────────────

export function DashboardRouter({ role }: { role: number }) {
  switch (role) {
    case 7: return <AdminDashboard />;
    case 1: return <HQDashboard />;
    case 2: return <ManagerDashboard />;
    case 3: return <ChefDashboard />;
    case 4: return <CashierDashboard />;
    case 5: return <WaiterDashboard roleLabel="WAITER DASHBOARD" />;
    default: return (
      <div style={{ padding: 40, color: "#fff", textAlign: "center" }}>
        <p style={{ color: "#888" }}>No dashboard available for this role.</p>
      </div>
    );
  }
}

// ── Admin Dashboard (role 7) ──────────────────────────────────────────────────

function AdminDashboard() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Branch form
  const [branchName, setBranchName] = useState("");
  const [branchLocation, setBranchLocation] = useState("");

  // User create form
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uRole, setURole] = useState(5);
  const [uBranchId, setUBranchId] = useState("");

  // Inline user edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState(0);
  const [editBranchId, setEditBranchId] = useState("");

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [b, u] = await Promise.all([adminGetBranches(token), adminGetUsers(token)]);
      setBranches(b);
      setUsers(u);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await adminCreateBranch(token, { name: branchName, location: branchLocation });
      setBranchName(""); setBranchLocation("");
      toast("Branch created successfully", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to add branch"; setError(msg); toast(msg, "error"); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await adminCreateUser(token, {
        email: uEmail, password: uPassword, name: uName,
        role: uRole, branchId: uBranchId || undefined,
      });
      setUName(""); setUEmail(""); setUPassword(""); setURole(5); setUBranchId("");
      toast("User account created", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to create user"; setError(msg); toast(msg, "error"); }
  };

  const startEdit = (u: UserAccount) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditBranchId(u.branchId ?? "");
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    try {
      await adminUpdateUser(token, editingId, { role: editRole, branchId: editBranchId || null });
      setEditingId(null);
      toast("User updated successfully", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to update user"; setError(msg); toast(msg, "error"); }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete ${name}? This will remove all associated staff, orders, inventory and menu items. This cannot be undone.`)) return;
    try {
      await adminDeleteBranch(token, id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast(`Branch "${name}" deleted`, "warning");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to delete branch"; setError(msg); toast(msg, "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this user? This cannot be undone.")) return;
    try {
      await adminDeleteUser(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast("User deleted", "warning");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to delete user"; setError(msg); toast(msg, "error"); }
  };

  if (loading) return <Spinner />;

  const totalUsers    = users.length;
  const totalBranches = branches.length;
  const staffUsers    = users.filter((u) => u.role !== 6 && u.role !== 7);
  const customerUsers = users.filter((u) => u.role === 6);
  const totalOrders   = branches.reduce((sum, b) => sum + (b._count?.orders ?? 0), 0);

  const roleGroups: Record<string, number> = {};
  users.forEach((u) => {
    const label = RoleLabels[u.role as keyof typeof RoleLabels] ?? `Role ${u.role}`;
    roleGroups[label] = (roleGroups[label] ?? 0) + 1;
  });

  return (
    <section className="dashboard-grid">
      <BranchBanner label="ADMIN DASHBOARD" sublabel="System administration — full access" branch="Global" />
      {error && <ApiErrorBanner message={error} />}

      {/* ── System KPI Cards ── */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <AnimatedKpiCard label="Total Branches" value={totalBranches} sub="Active UK locations" highlight />
        <AnimatedKpiCard label="Total Staff"    value={staffUsers.length} sub="Across all branches" />
        <AnimatedKpiCard label="Customers"      value={customerUsers.length} sub="Registered accounts" />
        <AnimatedKpiCard label="Total Users"    value={totalUsers} sub="All roles combined" />
        <AnimatedKpiCard label="Total Orders"   value={totalOrders} sub="All branches, all time" />
      </div>

      {/* ── Role breakdown ── */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBottom: "1rem" }}>👥 Users by Role</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {Object.entries(roleGroups).map(([label, count]) => (
            <div key={label} style={{
              background: "rgba(224,16,95,0.08)", border: "1px solid rgba(224,16,95,0.2)",
              borderRadius: 10, padding: "0.5rem 1rem", fontSize: "0.85rem"
            }}>
              <strong style={{ color: "#fff" }}>{count}</strong>
              <span style={{ color: "#888", marginLeft: "0.4rem" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Branch overview ── */}
      <section className="card wide-card">
        <div className="card-title-row">
          <h2>🏪 Branches</h2>
          <span style={{ color: "#888", fontSize: "0.82rem" }}>{totalBranches} locations</span>
        </div>
        {branches.length === 0 ? <EmptyState label="No branches yet." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Branch</th><th>Location</th><th>Staff</th><th>Orders</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td><strong style={{ color: "#fff" }}>{b.name}</strong></td>
                    <td style={{ color: "#888" }}>{b.location}</td>
                    <td>{b._count?.users ?? 0}</td>
                    <td>{b._count?.orders ?? 0}</td>
                    <td><span style={{ background: "rgba(39,174,96,0.15)", color: "#27ae60", padding: "0.2rem 0.6rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 }}>Active</span></td>
                    <td>
                      <button
                        className="danger-button"
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }}
                        onClick={() => handleDeleteBranch(b.id, b.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Add branch form ── */}
      <form className="card form-grid" onSubmit={handleAddBranch}>
        <h2>➕ Add New Branch</h2>
        <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch name (e.g. Leeds)" required />
        <input value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} placeholder="Location (e.g. Leeds, UK)" required />
        <button className="primary-button" type="submit"><Plus size={14} /> Create Branch</button>
      </form>

      {/* ── Create user form ── */}
      <form className="card wide-card form-grid" onSubmit={handleCreateUser}>
        <h2>➕ Create New User</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Full name" required />
          <input value={uEmail} onChange={(e) => setUEmail(e.target.value)} placeholder="Email address" type="email" required />
          <input value={uPassword} onChange={(e) => setUPassword(e.target.value)} placeholder="Password" type="password" required />
          <select value={uRole} onChange={(e) => setURole(Number(e.target.value))}>
            {(Object.entries(RoleLabels) as [string, string][]).map(([r, label]) => (
              <option key={r} value={r}>{label}</option>
            ))}
          </select>
          <select value={uBranchId} onChange={(e) => setUBranchId(e.target.value)}>
            <option value="">— No branch (global) —</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button className="primary-button" type="submit"><Plus size={14} /> Create User</button>
      </form>

      {/* ── All users table ── */}
      <section className="card wide-card">
        <div className="card-title-row">
          <h2>👤 All Users</h2>
          <span style={{ color: "#888", fontSize: "0.82rem" }}>{totalUsers} total</span>
        </div>
        {users.length === 0 ? <EmptyState label="No users found." /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong style={{ color: "#fff" }}>{u.name}</strong></td>
                    <td style={{ color: "#888", fontSize: "0.82rem" }}>{u.email}</td>
                    <td>
                      {editingId === u.id ? (
                        <select value={editRole} onChange={(e) => setEditRole(Number(e.target.value))}>
                          {(Object.entries(RoleLabels) as [string, string][]).map(([r, label]) => (
                            <option key={r} value={r}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`branch-badge role-badge-${u.role}`}>{RoleLabels[u.role as keyof typeof RoleLabels] ?? `Role ${u.role}`}</span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <select value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)}>
                          <option value="">— Global —</option>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: "#888", fontSize: "0.82rem" }}>
                          {branches.find((b) => b.id === u.branchId)?.name ?? "Global"}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {editingId === u.id ? (
                          <>
                            <button className="primary-button" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }} onClick={saveEdit}>Save</button>
                            <button className="secondary-button" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }} onClick={() => setEditingId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="secondary-button" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }} onClick={() => startEdit(u)}>Edit</button>
                            <button className="danger-button" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }} onClick={() => handleDelete(u.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </section>
  );
}

// ── HQ Dashboard (role 1) — read-only ─────────────────────────────────────────

function HQDashboard() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<SalesSummary[]>([]);
  const [analytics, setAnalytics] = useState<HQAnalytics | null>(null);
  const [tab, setTab] = useState<HQTab>("Overview");
  const [branchFilter, setBranchFilter] = useState("");
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    hqGetBranches(token)
      .then(setBranches)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setBranchesLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || branchesLoading) return;
    const bid = branchFilter || undefined;
    setTabLoading(true);
    const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Failed");
    const done = () => setTabLoading(false);

    if (tab === "Overview") {
      Promise.all([hqGetOrders(token, bid), hqGetInventory(token, bid), hqGetAnalytics(token)])
        .then(([o, i, a]) => { setOrders(o); setInventory(i); setAnalytics(a); })
        .catch(fail).finally(done);
    } else if (tab === "Orders") {
      hqGetOrders(token, bid).then(setOrders).catch(fail).finally(done);
    } else if (tab === "Inventory") {
      hqGetInventory(token, bid).then(setInventory).catch(fail).finally(done);
    } else if (tab === "Shifts") {
      hqGetShifts(token, bid).then(setShifts).catch(fail).finally(done);
    } else if (tab === "Sales") {
      Promise.all([hqGetSalesSummary(token, bid), hqGetAnalytics(token)])
        .then(([s, a]) => { setSales(s); setAnalytics(a); })
        .catch(fail).finally(done);
    } else {
      hqGetSalesSummary(token, bid).then(setSales).catch(fail).finally(done);
    }
  }, [token, tab, branchFilter, branchesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (branchesLoading) return <Spinner />;

  const visibleBranches = branchFilter ? branches.filter((b) => b.id === branchFilter) : branches;

  return (
    <section className="dashboard-grid">
      <BranchBanner label="HQ DASHBOARD" sublabel="All branches — read only" branch="HQ — All Branches" />
      <header className="page-header">
        <p className="eyebrow">Role 1 — Read only</p>
        <h1>HQ Overview</h1>
      </header>
      {error && <ApiErrorBanner message={error} />}

      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="segmented">
          {(["Overview", "Orders", "Inventory", "Shifts", "Sales"] as HQTab[]).map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {tabLoading && <span style={{ color: "#b3b3b3", fontSize: "0.85rem" }}>Loading…</span>}
      </div>

      {tab === "Overview" && analytics && (
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* KPI Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <AnimatedKpiCard
              label="Total Revenue"
              value={Math.round(analytics.totalRevenue * 100)}
              prefix="£"
              decimals={2}
              sub="All time, all branches"
            />
            <AnimatedKpiCard
              label="Total Orders"
              value={analytics.totalOrders}
              sub="Across all branches"
            />
            <AnimatedKpiCard
              label="Paid Orders"
              value={analytics.totalPaid}
              sub={`${analytics.totalOrders > 0 ? Math.round((analytics.totalPaid / analytics.totalOrders) * 100) : 0}% completion rate`}
            />
            <div className="kpi-card kpi-highlight">
              <span className="kpi-label">🏆 Top Branch</span>
              <span className="kpi-value">{analytics.topBranch?.branchName ?? "—"}</span>
              <span className="kpi-sub">{formatCurrency(analytics.topBranch?.totalRevenue ?? 0)} revenue</span>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="card">
              <h2 style={{ marginBottom: "1.5rem" }}>💷 Revenue by Branch</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.branchSummaries} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="branchName" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `£${v}`} tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                  />
                  <Bar dataKey="totalRevenue" fill="#e0105f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: "1.5rem" }}>📊 Order Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.statusBreakdown.map((_, index) => (
                      <Cell key={index} fill={["#e67e22","#f39c12","#2ecc71","#27ae60"][index % 4]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: "#aaa", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="card wide-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📈 Monthly Revenue (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.monthlyRevenue} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `£${v}`} tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                />
                <Bar dataKey="revenue" fill="#3498db" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-branch table */}
          <div className="card wide-card">
            <h2 style={{ marginBottom: "1rem" }}>🏪 Branch Breakdown</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Total Orders</th>
                    <th>Pending</th>
                    <th>Preparing</th>
                    <th>Served</th>
                    <th>Paid</th>
                    <th>Revenue</th>
                    <th>Avg Order</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.branchSummaries.map((b) => (
                    <tr key={b.branchId}>
                      <td><strong>{b.branchName}</strong></td>
                      <td>{b.totalOrders}</td>
                      <td style={{ color: "#e67e22" }}>{b.pendingOrders}</td>
                      <td style={{ color: "#f39c12" }}>{b.preparingOrders ?? 0}</td>
                      <td style={{ color: "#2ecc71" }}>{b.servedOrders ?? 0}</td>
                      <td style={{ color: "#27ae60" }}>{b.paidOrders}</td>
                      <td><strong style={{ color: "#e0105f" }}>{formatCurrency(b.totalRevenue)}</strong></td>
                      <td>{formatCurrency(b.averageOrderValue)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", borderTop: "2px solid #333" }}>
                    <td>TOTAL</td>
                    <td>{analytics.totalOrders}</td>
                    <td colSpan={3} />
                    <td style={{ color: "#27ae60" }}>{analytics.totalPaid}</td>
                    <td><strong style={{ color: "#e0105f" }}>{formatCurrency(analytics.totalRevenue)}</strong></td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {tab === "Overview" && !analytics && !tabLoading && (
        <EmptyState label="No analytics data yet. Orders will appear here once they are placed." />
      )}

      {tab === "Orders" && (
        <section className="card wide-card">
          <div className="card-title-row">
            <h2>Orders</h2>
            <span style={{ color: "#b3b3b3", fontSize: "0.82rem" }}>read-only view</span>
          </div>
          {orders.length === 0
            ? <EmptyState label="No orders found." />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Customer</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Branch</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.customerName ?? "—"}</td>
                        <td>{o.tableNumber}</td>
                        <td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</td>
                        <td>{formatCurrency(o.totalAmount)}</td>
                        <td>{o.status}</td>
                        <td>{branches.find((b) => b.id === o.branchId)?.name ?? o.branchId}</td>
                        <td>{o.notes ? <span style={{ color: "#f39c12", fontSize: "0.82rem" }}>⚠️ {o.notes}</span> : <span style={{ color: "#555" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      )}

      {tab === "Inventory" && (
        <section className="card wide-card">
          <div className="card-title-row">
            <h2>Inventory</h2>
            <span style={{ color: "#b3b3b3", fontSize: "0.82rem" }}>read-only view</span>
          </div>
          {inventory.length === 0
            ? <EmptyState label="No inventory items found." />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Item</th><th>Quantity</th><th>Status</th><th>Branch</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td style={{ color: item.status === "LowStock" ? "#ff6b6b" : "#55d6aa" }}>
                          {item.status === "LowStock" ? "Low Stock" : "Normal"}
                        </td>
                        <td>{branches.find((b) => b.id === item.branchId)?.name ?? item.branchId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      )}

      {tab === "Shifts" && (
        <section className="card wide-card">
          <div className="card-title-row">
            <h2>Shifts</h2>
            <span style={{ color: "#b3b3b3", fontSize: "0.82rem" }}>read-only view</span>
          </div>
          {shifts.length === 0
            ? <EmptyState label="No shifts found." />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Staff</th><th>Role</th><th>Branch</th><th>Start</th><th>End</th></tr>
                  </thead>
                  <tbody>
                    {shifts.map((s) => (
                      <tr key={s.id}>
                        <td>{s.user.name}</td>
                        <td>{RoleLabels[s.user.role]}</td>
                        <td>{branches.find((b) => b.id === s.branchId)?.name ?? s.branchId}</td>
                        <td>{new Date(s.startTime).toLocaleString()}</td>
                        <td>{new Date(s.endTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      )}

      {tab === "Sales" && (
        <section className="card wide-card">
          <div className="card-title-row">
            <h2>Sales Summary</h2>
            <span style={{ color: "#b3b3b3", fontSize: "0.82rem" }}>read-only view</span>
          </div>
          {sales.length === 0
            ? <EmptyState label="No sales data found." />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Branch</th><th>Total Orders</th><th>Paid Orders</th><th>Pending</th><th>Total Revenue</th><th>Avg Order Value</th></tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.branchId}>
                        <td>{s.branchName}</td>
                        <td>{s.totalOrders}</td>
                        <td>{s.paidOrders}</td>
                        <td>{s.pendingOrders}</td>
                        <td>{formatCurrency(s.totalRevenue)}</td>
                        <td>{formatCurrency(s.averageOrderValue)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", borderTop: "1px solid #333" }}>
                      <td>TOTAL</td>
                      <td>{sales.reduce((acc, s) => acc + s.totalOrders, 0)}</td>
                      <td>{sales.reduce((acc, s) => acc + s.paidOrders, 0)}</td>
                      <td>{sales.reduce((acc, s) => acc + s.pendingOrders, 0)}</td>
                      <td>{formatCurrency(sales.reduce((acc, s) => acc + s.totalRevenue, 0))}</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      )}
    </section>
  );
}

// ── Branch Manager Dashboard (role 2) ─────────────────────────────────────────

function ManagerDashboard() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"Analytics" | "Sales" | "Operations" | "Menu" | "Reservations">("Analytics");
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState(1);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);

  const [shiftUserId, setShiftUserId] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [branchStaff, setBranchStaff] = useState<BranchStaffMember[]>([]);

  const [salesData, setSalesData] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [menuPrice, setMenuPrice] = useState(0);
  const [menuDesc, setMenuDesc] = useState("");

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [o, inv, sh] = await Promise.all([getOrders(token), getInventory(token), getShifts(token)]);
      setOrders(o); setInventory(inv); setShifts(sh);
      getBranchStaff(token).then(setBranchStaff).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createInventoryItem(token, { itemName: invName, quantity: invQty });
      setInvName(""); setInvQty(1);
      toast("Inventory item added", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!token) return;
    try {
      await deleteInventoryItem(token, id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createShift(token, { userId: shiftUserId, startTime: shiftStart, endTime: shiftEnd });
      setShiftUserId(""); setShiftStart(""); setShiftEnd("");
      toast("Shift created successfully", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleDeleteShift = async (id: string) => {
    if (!token) return;
    try {
      await deleteShift(token, id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createMenuItem(token, { name: menuName, category: menuCategory, price: menuPrice, description: menuDesc, available: true });
      setMenuName(""); setMenuCategory(""); setMenuPrice(0); setMenuDesc("");
      toast("Menu item added", "success");
      getMenuItems(token).then(setMenuItems).catch(() => undefined);
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to add menu item"; setError(msg); toast(msg, "error"); }
  };

  const handleToggleAvailable = async (id: string, available: boolean) => {
    if (!token) return;
    try {
      await updateMenuItem(token, id, { available });
      setMenuItems((prev) => prev.map((m) => m.id === id ? { ...m, available } : m));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!token) return;
    try {
      await deleteMenuItem(token, id);
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      toast("Menu item removed", "warning");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleCancelReservation = async (id: string) => {
    if (!token) return;
    if (!confirm("Cancel this reservation?")) return;
    try {
      await cancelReservation(token, id);
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "Cancelled" as const } : r));
      toast("Reservation cancelled", "warning");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to cancel", "error");
    }
  };

  const handleManagerStatusOverride = async (id: string, status: string) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, status);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order["status"] } : o));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  useEffect(() => {
    if (viewMode !== "Operations" || !token) return;
    getMenuItems(token)
      .then(setAllMenuItems)
      .catch(() => {});
  }, [viewMode, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) return;
    if (viewMode === "Sales") {
      setSalesLoading(true);
      getSalesSummary(token)
        .then(setSalesData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load sales"))
        .finally(() => setSalesLoading(false));
    } else if (viewMode === "Menu") {
      setMenuLoading(true);
      getMenuItems(token)
        .then(setMenuItems)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load menu"))
        .finally(() => setMenuLoading(false));
    } else if (viewMode === "Reservations") {
      getReservations(token, user?.branchId ?? undefined)
        .then(setReservations)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load reservations"));
    }
  }, [viewMode, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner />;

  const openOrders = orders.filter((o) => o.status !== "Paid").length;
  const lowStock = inventory.filter((i) => i.status === "LowStock").length;

  return (
    <section className="dashboard-grid">
      <BranchBanner label="BRANCH MANAGER DASHBOARD" sublabel="Branch operations" branch={user?.branchName} />
      {inventory.filter((i) => i.status === "LowStock").length > 0 && (
        <div className="low-stock-banner wide-card">
          <span className="low-stock-icon">⚠️</span>
          <div>
            <strong>Low Stock Alert</strong>
            <p>
              {inventory.filter((i) => i.status === "LowStock").map((i) => i.itemName).join(", ")} —
              quantities are running low. Please restock soon.
            </p>
          </div>
        </div>
      )}
      {error && <ApiErrorBanner message={error} />}
      <div className="segmented" style={{ gridColumn: "1 / -1" }}>
        {(["Analytics", "Sales", "Operations", "Menu", "Reservations"] as const).map((m) => (
          <button key={m} className={viewMode === m ? "active" : ""} onClick={() => setViewMode(m)}>{m}</button>
        ))}
      </div>
      <MetricCard title="Open Orders" value={String(openOrders)} />
      <MetricCard title="Low Stock Alerts" value={String(lowStock)} />
      <MetricCard title="Scheduled Shifts" value={String(shifts.length)} />

      {viewMode === "Sales" && (
        salesLoading ? <Spinner /> : salesData ? (
          <>
            <MetricCard title="Total Orders" value={String(salesData.totalOrders)} />
            <MetricCard title="Paid Orders" value={String(salesData.paidOrders)} />
            <MetricCard title="Pending Orders" value={String(salesData.pendingOrders)} />
            <MetricCard title="Total Revenue" value={formatCurrency(salesData.totalRevenue)} />
            <MetricCard title="Avg Order Value" value={formatCurrency(salesData.averageOrderValue)} />
          </>
        ) : <EmptyState label="No sales data available." />
      )}

      {viewMode === "Menu" && (
        <>
          <form className="card form-grid" onSubmit={handleAddMenuItem}>
            <h2>Add Menu Item</h2>
            <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Item name" required />
            <input value={menuCategory} onChange={(e) => setMenuCategory(e.target.value)} placeholder="Category (e.g. Steaks)" required />
            <input
              type="number" value={menuPrice} min={0} step={0.01}
              onChange={(e) => setMenuPrice(parseFloat(e.target.value) || 0)}
              placeholder="Price £" required
            />
            <input value={menuDesc} onChange={(e) => setMenuDesc(e.target.value)} placeholder="Description" />
            <button className="primary-button" type="submit"><Plus size={14} /> Add Item</button>
          </form>

          <section className="card wide-card">
            <h2>Menu Items</h2>
            {menuLoading ? <Spinner /> : menuItems.length === 0
              ? <EmptyState label="No menu items found." />
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <button
                              className={item.available ? "primary-button" : "secondary-button"}
                              type="button"
                              onClick={() => handleToggleAvailable(item.id, !item.available)}
                            >
                              {item.available ? "Yes" : "No"}
                            </button>
                          </td>
                          <td>
                            {item.branchId !== null && (
                              <button className="danger-button" type="button" onClick={() => handleDeleteMenuItem(item.id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </section>
        </>
      )}

      {viewMode === "Analytics" && (
        <section className="card wide-card">
          <h2>Orders</h2>
          {orders.length === 0
            ? <EmptyState label="No orders yet." />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Customer</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.customerName ?? "—"}</td>
                        <td>{o.tableNumber}</td>
                        <td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</td>
                        <td>{formatCurrency(o.totalAmount)}</td>
                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => handleManagerStatusOverride(o.id, e.target.value)}
                            className="status-select"
                            style={{
                              background: o.status === "Paid"      ? "rgba(39,174,96,0.2)"   :
                                          o.status === "Served"    ? "rgba(46,204,113,0.2)"  :
                                          o.status === "Preparing" ? "rgba(243,156,18,0.2)"  :
                                          "rgba(230,126,34,0.2)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff",
                              borderRadius: 6,
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.82rem",
                            }}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Preparing">🍳 Preparing</option>
                            <option value="Served">🎉 Served</option>
                            <option value="Paid">✅ Paid</option>
                          </select>
                        </td>
                        <td>{o.notes ? <span style={{ color: "#f39c12", fontSize: "0.82rem" }}>⚠️ {o.notes}</span> : <span style={{ color: "#555" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      )}

      {viewMode === "Operations" && (
        <>
          <form className="card form-grid" onSubmit={handleAddInventory}>
            <h2>Add Inventory Item</h2>
            <select
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              required
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: invName ? "#fff" : "#666", fontSize: "0.9rem", width: "100%" }}
            >
              <option value="">Select menu item…</option>
              {allMenuItems.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}{!item.available ? " (unavailable — add to restock)" : ""}
                </option>
              ))}
            </select>
            <input type="number" value={invQty} min={0} onChange={(e) => setInvQty(Number(e.target.value))} placeholder="Quantity" required />
            <button className="primary-button" type="submit"><Plus size={14} /> Add Item</button>
          </form>

          <section className="card wide-card">
            <h2>Inventory</h2>
            {inventory.length === 0
              ? <EmptyState label="No inventory items." />
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Item</th><th>Quantity</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td style={{ color: item.status === "LowStock" ? "#ff6b6b" : "#55d6aa" }}>
                            {item.status === "LowStock" ? "Low Stock" : "Normal"}
                          </td>
                          <td>
                            <button className="danger-button" onClick={() => handleDeleteInventory(item.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </section>

          <form className="card form-grid" onSubmit={handleCreateShift}>
            <h2>Create Shift</h2>
            <label>
              Staff Member
              <select
                value={shiftUserId}
                onChange={(e) => setShiftUserId(e.target.value)}
                required
              >
                <option value="">— Select staff member —</option>
                {branchStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({RoleLabels[s.role as keyof typeof RoleLabels] ?? `Role ${s.role}`})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start
              <input type="datetime-local" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} required />
            </label>
            <label>
              End
              <input type="datetime-local" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} required />
            </label>
            <button className="primary-button" type="submit"><Plus size={14} /> Create Shift</button>
          </form>

          <section className="card wide-card">
            <h2>Shifts</h2>
            {shifts.length === 0
              ? <EmptyState label="No shifts scheduled." />
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Staff</th><th>Role</th><th>Start</th><th>End</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {shifts.map((s) => (
                        <tr key={s.id}>
                          <td>{s.user.name}</td>
                          <td>{RoleLabels[s.user.role]}</td>
                          <td>{new Date(s.startTime).toLocaleString()}</td>
                          <td>{new Date(s.endTime).toLocaleString()}</td>
                          <td>
                            <button className="danger-button" onClick={() => handleDeleteShift(s.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </section>
        </>
      )}
      {viewMode === "Reservations" && (
        <section className="card wide-card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-title-row">
            <h2>🗓️ Reservations</h2>
            <span style={{ color: "#888", fontSize: "0.82rem" }}>{reservations.filter((r) => r.status !== "Cancelled").length} active</span>
          </div>
          {reservations.length === 0 ? (
            <p style={{ color: "#888", padding: "1rem 0" }}>No reservations yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Table</th>
                    <th>Party</th>
                    <th>Pre-Order Total</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} style={{ opacity: r.status === "Cancelled" ? 0.4 : 1 }}>
                      <td><strong style={{ color: "#fff" }}>{r.customerName}</strong></td>
                      <td style={{ color: "#ccc", fontSize: "0.82rem" }}>
                        {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" at "}
                        {new Date(r.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>{r.tableNumber}</td>
                      <td>{r.partySize}</td>
                      <td style={{ color: "#e0105f", fontWeight: 700 }}>£{Number(r.totalAmount).toFixed(2)}</td>
                      <td style={{ color: "#f39c12", fontSize: "0.82rem" }}>{r.notes || "—"}</td>
                      <td>
                        <span className={`order-status-badge status-${r.status.toLowerCase()}`}>
                          {r.status === "Pending" ? "⏳ Pending" : r.status === "Seated" ? "🪑 Seated" : "❌ Cancelled"}
                        </span>
                      </td>
                      <td>
                        {r.status === "Pending" && (
                          <button className="danger-button" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }} onClick={() => handleCancelReservation(r.id)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

// ── Chef Dashboard (role 3) ───────────────────────────────────────────────────

function ChefDashboard() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qtyEdits, setQtyEdits] = useState<Record<string, number>>({});

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [o, inv, sh] = await Promise.all([getOrders(token), getInventory(token), getShifts(token)]);
      setOrders(o); setInventory(inv); setShifts(sh);
      const edits: Record<string, number> = {};
      inv.forEach((i) => { edits[i.id] = i.quantity; });
      setQtyEdits(edits);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, status);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order["status"] } : o));
      toast("Order marked as Preparing", "success");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleUpdateQty = async (id: string) => {
    if (!token) return;
    try {
      await updateInventoryItem(token, id, { quantity: qtyEdits[id] });
      setInventory((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qtyEdits[id] } : i));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  if (loading) return <Spinner />;

  const activeOrders = orders.filter((o) => o.status !== "Paid");
  const myShifts = shifts.filter((s) => s.userId === user?.id);

  return (
    <section className="dashboard-grid">
      <BranchBanner label="CHEF DASHBOARD" sublabel="Kitchen & inventory operations" branch={user?.branchName} />
      {inventory.filter((i) => i.status === "LowStock").length > 0 && (
        <div className="low-stock-banner wide-card">
          <span className="low-stock-icon">⚠️</span>
          <div>
            <strong>Low Stock Alert</strong>
            <p>
              {inventory.filter((i) => i.status === "LowStock").map((i) => i.itemName).join(", ")} —
              quantities are running low. Please restock soon.
            </p>
          </div>
        </div>
      )}
      {error && <ApiErrorBanner message={error} />}

      <section className="card wide-card">
        <h2><ClipboardList size={20} /> Kitchen Orders</h2>
        {activeOrders.length === 0
          ? <EmptyState label="No active orders." />
          : (
            <div className="order-grid">
              {activeOrders.map((order) => (
                <article className="order-ticket" key={order.id}>
                  <div className="ticket-header">
                    <strong>Table {order.tableNumber}</strong>
                    {order.customerName && <span className="ticket-customer">👤 {order.customerName}</span>}
                  </div>
                  <span className={`order-status-badge status-${order.status.toLowerCase()}`}>
                    {order.status === "Pending"   ? "⏳ Pending"   :
                     order.status === "Preparing" ? "🍳 Preparing" :
                     order.status === "Served"    ? "🎉 Served"    : "✅ Paid"}
                  </span>
                  <span className="ticket-time">
                    {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {order.items.map((item) => <p key={item.name}>{item.quantity}× {item.name}</p>)}
                  {order.notes && (
                    <div className="ticket-allergy">
                      ⚠️ <strong>Allergies/Notes:</strong> {order.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {order.status === "Pending" && (
                      <button
                        className="secondary-button"
                        onClick={() => handleStatusUpdate(order.id, "Preparing")}
                      >
                        🍳 Start Preparing
                      </button>
                    )}
                    {order.status === "Preparing" && (
                      <div className="status-action-info">
                        ✅ In kitchen — awaiting waiter to serve
                      </div>
                    )}
                    {order.status === "Served" && (
                      <div className="status-action-info muted">
                        💳 Served — awaiting payment
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )
        }
      </section>

      <section className="card">
        <h2>Inventory</h2>
        {inventory.length === 0
          ? <EmptyState label="No inventory items." />
          : inventory.map((item) => (
            <div
              key={item.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 80px auto", gap: 8, marginBottom: 10, alignItems: "center" }}
            >
              <span style={{ color: item.status === "LowStock" ? "#ff6b6b" : "#ffffff" }}>
                {item.itemName}
                {item.status === "LowStock" && (
                  <span style={{ marginLeft: 6, fontSize: "0.72rem", color: "#ff6b6b" }}>LOW</span>
                )}
              </span>
              <input
                type="number"
                value={qtyEdits[item.id] ?? item.quantity}
                onChange={(e) => setQtyEdits((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                min={0}
              />
              <button className="secondary-button" onClick={() => handleUpdateQty(item.id)}>Update</button>
            </div>
          ))
        }
      </section>

      <section className="card">
        <h2>My Shifts</h2>
        {myShifts.length === 0
          ? <EmptyState label="No shifts scheduled for you." />
          : myShifts.map((s) => (
            <p key={s.id}>
              {new Date(s.startTime).toLocaleString()} — {new Date(s.endTime).toLocaleString()}
            </p>
          ))
        }
      </section>
    </section>
  );
}

// ── Waiter / Cashier Dashboard (roles 4 & 5) ─────────────────────────────────

interface DraftItem { name: string; quantity: number; price: number; }

function WaiterDashboard({ roleLabel = "WAITER DASHBOARD" }: { roleLabel?: string }) {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tableNumber, setTableNumber] = useState(1);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"Orders" | "Reservations">("Orders");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([
    { name: DEFAULT_MENU_ITEM.name, quantity: 1, price: DEFAULT_MENU_ITEM.price },
  ]);
  const totalAmount = draftItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [o, sh] = await Promise.all([getOrders(token), getShifts(token)]);
      setOrders(o); setShifts(sh);
      getReservations(token, user?.branchId ?? undefined)
        .then((data) => setReservations(data.filter((r) => r.status === "Pending")))
        .catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeat = async (id: string) => {
    if (!token) return;
    try {
      await seatReservation(token, id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      refresh();
      toast("Customer seated — order sent to kitchen!", "success");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to seat reservation", "error");
    }
  };

  const addItem = () => setDraftItems((prev) => [
    ...prev,
    { name: DEFAULT_MENU_ITEM.name, quantity: 1, price: DEFAULT_MENU_ITEM.price },
  ]);
  const removeItem = (idx: number) => setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof DraftItem, value: string | number) =>
    setDraftItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === "name" && typeof value === "string") {
        return { ...item, name: value, price: getMenuPrice(value) };
      }
      return { ...item, [field]: value };
    }));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createOrder(token, {
        tableNumber,
        items: draftItems,
        totalAmount,
        customerName: `Waiter Order — Table ${tableNumber}`,
      });
      setDraftItems([{ name: DEFAULT_MENU_ITEM.name, quantity: 1, price: DEFAULT_MENU_ITEM.price }]);
      setTableNumber(1);
      toast("Order sent to kitchen", "success");
      refresh();
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed to place order"; setError(msg); toast(msg, "error"); }
  };

  const handleMarkServed = async (id: string) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, "Served");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "Served" } : o));
      toast("Order marked as Served", "success");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleCancelOrder = async (id: string) => {
    if (!token || !confirm("Cancel this order?")) return;
    try {
      await deleteOrder(token, id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  if (loading) return <Spinner />;

  const activeOrders = orders.filter((o) => o.status !== "Paid");
  const myShifts = shifts.filter((s) => s.userId === user?.id);

  return (
    <section className="dashboard-grid">
      <BranchBanner label={roleLabel} sublabel="Front-of-house operations" branch={user?.branchName} />
      {error && <ApiErrorBanner message={error} />}

      <div className="segmented" style={{ gridColumn: "1 / -1" }}>
        {(["Orders", "Reservations"] as const).map((t) => (
          <button key={t} className={activeTab === t ? "active" : ""} onClick={() => setActiveTab(t)}>
            {t}
            {t === "Reservations" && reservations.length > 0 && (
              <span style={{ background: "#e0105f", color: "#fff", borderRadius: "50%", padding: "0 6px", fontSize: "0.7rem", marginLeft: "0.4rem" }}>
                {reservations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "Reservations" && (
        <section className="card wide-card" style={{ gridColumn: "1 / -1" }}>
          <h2>🗓️ Upcoming Reservations</h2>
          {reservations.length === 0 ? (
            <p style={{ color: "#888", padding: "1rem 0" }}>No pending reservations.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {reservations.map((r) => (
                <div key={r.id} className="order-ticket">
                  <div className="ticket-header">
                    <strong>Table {r.tableNumber} — Party of {r.partySize}</strong>
                    <span className="order-status-badge status-pending">⏳ Pending</span>
                  </div>
                  <span className="ticket-time">
                    {new Date(r.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {new Date(r.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <p style={{ color: "#888", fontSize: "0.82rem", margin: "0.25rem 0" }}>👤 {r.customerName}</p>
                  {r.notes && <div className="ticket-allergy">⚠️ <strong>Notes:</strong> {r.notes}</div>}
                  <div style={{ marginTop: "0.5rem" }}>
                    <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.35rem" }}>Pre-ordered:</p>
                    {r.items.map((item, i) => (
                      <p key={i} style={{ color: "#ccc", fontSize: "0.82rem", margin: "0.1rem 0" }}>{item.quantity}× {item.name} — £{(item.price * item.quantity).toFixed(2)}</p>
                    ))}
                    <p style={{ color: "#e0105f", fontWeight: 700, marginTop: "0.4rem" }}>Total: £{Number(r.totalAmount).toFixed(2)}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button className="primary-button" onClick={() => handleSeat(r.id)}>
                      🪑 Seat Customer & Send to Kitchen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "Orders" && (
      <>
      {/* ── Order entry ── */}
      <form className="card wide-card form-grid" onSubmit={handlePlaceOrder}>
        <div className="card-title-row">
          <h2>New Order</h2>
          <button type="button" className="secondary-button" onClick={addItem}>
            <Plus size={14} /> Add item
          </button>
        </div>
        <label>
          Table number
          <input
            type="number"
            value={tableNumber}
            min={1}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            required
          />
        </label>
        {draftItems.map((item, idx) => (
          <div
            key={idx}
            style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px auto", gap: 8, alignItems: "center" }}
          >
            <select value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)}>
              {MENU_ITEMS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <input
              type="number" min={1} value={item.quantity} placeholder="Qty"
              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
            />
            <input
              type="number" min={0} step={0.01} value={item.price} placeholder="Price £"
              onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
            />
            {draftItems.length > 1 && (
              <button type="button" className="danger-button" onClick={() => removeItem(idx)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <p style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>
          Total: <strong style={{ color: "#ffffff" }}>£{totalAmount.toFixed(2)}</strong>
        </p>
        <div style={{
          background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.2)",
          borderRadius: 8, padding: "0.6rem 1rem", fontSize: "0.82rem", color: "#3498db",
        }}>
          ℹ️ This order will be labelled as a <strong>Waiter Order</strong> and sent to the kitchen.
        </div>
        <button className="primary-button" type="submit">Place Order</button>
      </form>

      {/* ── Active orders ── */}
      <section className="card wide-card">
        <h2>Active Orders</h2>
        {activeOrders.length === 0
          ? <EmptyState label="No active orders." />
          : (
            <div className="order-grid">
              {activeOrders.map((o) => (
                <article className="order-ticket" key={o.id}>
                  <div className="ticket-header">
                    <strong>Table {o.tableNumber}</strong>
                    {o.customerName && <span className="ticket-customer">👤 {o.customerName}</span>}
                  </div>
                  <span className={`order-status-badge status-${o.status.toLowerCase()}`}>
                    {o.status === "Pending"   ? "⏳ Pending"   :
                     o.status === "Preparing" ? "🍳 Preparing" :
                     o.status === "Served"    ? "🎉 Served"    : "✅ Paid"}
                  </span>
                  <span className="ticket-time">
                    {new Date(o.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {o.items.map((item) => <p key={item.name}>{item.quantity}× {item.name}</p>)}
                  {o.notes && (
                    <div className="ticket-allergy">
                      ⚠️ <strong>Allergies/Notes:</strong> {o.notes}
                    </div>
                  )}
                  <p>{formatCurrency(o.totalAmount)}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {o.status === "Pending" && (
                      <div className="status-action-info">
                        ⏳ Waiting for kitchen
                      </div>
                    )}
                    {o.status === "Preparing" && (
                      <button className="primary-button" onClick={() => handleMarkServed(o.id)}>
                        🛎️ Mark Served
                      </button>
                    )}
                    {o.status === "Served" && (
                      <div className="status-action-info muted">
                        💳 Served — awaiting cashier
                      </div>
                    )}
                    {o.status === "Pending" && (
                      <button className="danger-button" onClick={() => handleCancelOrder(o.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )
        }
      </section>

      {/* ── Shifts ── */}
      <section className="card">
        <h2>My Shifts</h2>
        {myShifts.length === 0
          ? <EmptyState label="No shifts scheduled for you." />
          : myShifts.map((s) => (
            <p key={s.id}>
              {new Date(s.startTime).toLocaleString()} — {new Date(s.endTime).toLocaleString()}
            </p>
          ))
        }
        <p style={{ color: "#b3b3b3", marginTop: 12 }}>Branch orders tonight: {orders.length}</p>
      </section>
      </>
      )}
    </section>
  );
}

// ── Cashier Dashboard (role 4) ────────────────────────────────────────────────

function CashierDashboard() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptView, setReceiptView] = useState<"success" | "view">("success");
  const [cashierTab, setCashierTab] = useState<"Orders" | "History">("Orders");
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [paidReservations, setPaidReservations] = useState<Reservation[]>([]);

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [o, sh] = await Promise.all([getOrders(token), getShifts(token)]);
      setOrders(o); setShifts(sh);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cashierTab !== "History" || !token) return;
    getOrders(token)
      .then((all) => setPaidOrders(all.filter((o) => o.status === "Paid")))
      .catch(() => {});
    getReservations(token, user?.branchId ?? undefined)
      .then((all) => setPaidReservations(all.filter((r) => r.status === "Seated")))
      .catch(() => {});
  }, [cashierTab, token, user?.branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePDFReceipt = (order: Order) => {
    const vat = order.totalAmount * 0.2;
    const subtotal = order.totalAmount - vat;
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Steakz Receipt #${order.id.slice(-8).toUpperCase()}</title>
  <style>
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111;max-width:420px;margin:0 auto;padding:32px 24px}
    .header{text-align:center;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px}
    .header h1{font-size:2rem;margin:0 0 4px;letter-spacing:4px}
    .header p{margin:2px 0;font-size:0.85rem;color:#555}
    .section-label{font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:#777;margin:16px 0 6px}
    .customer{font-size:0.9rem;margin-bottom:16px}
    .items{width:100%;border-collapse:collapse;margin:8px 0}
    .items th{text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;color:#777;border-bottom:1px solid #ccc;padding:4px 0}
    .items td{padding:6px 0;font-size:0.9rem;border-bottom:1px solid #eee}
    .items td:last-child{text-align:right}
    .totals{margin-top:12px}
    .totals .row{display:flex;justify-content:space-between;font-size:0.9rem;padding:3px 0}
    .totals .row.total{font-size:1.1rem;font-weight:700;border-top:2px solid #111;padding-top:8px;margin-top:4px}
    .footer{text-align:center;margin-top:24px;font-size:0.78rem;color:#888;border-top:1px solid #ccc;padding-top:16px}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div class="header">
    <h1>STEAKZ</h1>
    <p>Premium British Steakhouse</p>
    <p>hello@steakz.co.uk</p>
    <p style="margin-top:8px;font-size:0.8rem;color:#aaa">Receipt #${order.id.slice(-8).toUpperCase()}</p>
    <p style="font-size:0.8rem;color:#aaa">${new Date(order.createdAt).toLocaleString("en-GB")}</p>
  </div>
  <div class="section-label">Customer</div>
  <div class="customer">
    <div><strong>${order.customerName ?? "Guest"}</strong></div>
    <div style="color:#777;font-size:0.82rem">Table ${order.tableNumber > 0 ? order.tableNumber : "—"}</div>
  </div>
  <div class="section-label">Order</div>
  <table class="items">
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Line</th></tr></thead>
    <tbody>${order.items.map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>£${item.price.toFixed(2)}</td><td>£${(item.quantity * item.price).toFixed(2)}</td></tr>`).join("")}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal (ex. VAT)</span><span>£${subtotal.toFixed(2)}</span></div>
    <div class="row"><span>VAT (20%)</span><span>£${vat.toFixed(2)}</span></div>
    <div class="row total"><span>TOTAL</span><span>£${order.totalAmount.toFixed(2)}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for dining at Steakz.</p>
    <p>steakz.co.uk · hello@steakz.co.uk</p>
    <p>VAT No. GB 000 0000 00</p>
  </div>
</body>
</html>`;
    const win = window.open("", "_blank", "width=520,height=720");
    if (win) { win.document.write(receiptHtml); win.document.close(); setTimeout(() => win.print(), 500); }
  };

  const handleMarkPaid = async (id: string) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, "Paid");
      const paidOrder = orders.find((o) => o.id === id);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "Paid" } : o));
      if (paidOrder) {
        setReceiptOrder({ ...paidOrder, status: "Paid" });
        setReceiptView("success");
        setShowReceiptModal(true);
      }
      toast("Payment collected — receipt ready", "success");
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Failed"; setError(msg); toast(msg, "error"); }
  };

  const handleCancelOrder = async (id: string) => {
    if (!token || !confirm("Cancel this order?")) return;
    try {
      await deleteOrder(token, id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  if (loading) return <Spinner />;

  const activeOrders = orders.filter((o) => o.status !== "Paid");
  const myShifts = shifts.filter((s) => s.userId === user?.id);
  const today = new Date().toDateString();
  const todayRevenue = orders
    .filter((o) => o.status === "Paid" && new Date(o.createdAt).toDateString() === today)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <section className="dashboard-grid">
      <BranchBanner label="CASHIER DASHBOARD" sublabel="Payments & receipts" branch={user?.branchName} />
      {error && <ApiErrorBanner message={error} />}
      <AnimatedKpiCard label="Today's Revenue" value={Math.round(todayRevenue * 100)} prefix="£" decimals={2} sub="Paid orders today" highlight />
      <AnimatedKpiCard label="Active Orders" value={activeOrders.length} sub="Awaiting payment" />

      <div className="segmented" style={{ gridColumn: "1 / -1" }}>
        {(["Orders", "History"] as const).map((t) => (
          <button key={t} className={cashierTab === t ? "active" : ""} onClick={() => setCashierTab(t)}>{t}</button>
        ))}
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem" }}>
        <span style={{ fontSize: "1.75rem" }}>💳</span>
        <div>
          <strong style={{ color: "#fff", display: "block", marginBottom: "0.2rem" }}>Payment Processing</strong>
          <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>
            Mark served orders as paid below. A receipt will be generated for each completed transaction.
          </p>
        </div>
      </div>

      {cashierTab === "Orders" && (
        <>
          <section className="card wide-card">
            <h2>Active Orders</h2>
            {activeOrders.length === 0
              ? <EmptyState label="No active orders." />
              : (
                <div className="order-grid">
                  {activeOrders.map((o) => (
                    <article className="order-ticket" key={o.id}>
                      <div className="ticket-header">
                        <strong>Table {o.tableNumber}</strong>
                        {o.customerName && <span className="ticket-customer">👤 {o.customerName}</span>}
                      </div>
                      <span className={`order-status-badge status-${o.status.toLowerCase()}`}>
                        {o.status === "Pending"   ? "⏳ Pending"   :
                         o.status === "Preparing" ? "🍳 Preparing" :
                         o.status === "Served"    ? "🎉 Served"    : "✅ Paid"}
                      </span>
                      <span className="ticket-time">
                        {new Date(o.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {o.items.map((item) => <p key={item.name}>{item.quantity}× {item.name}</p>)}
                      {o.notes && (
                        <div className="ticket-allergy">
                          ⚠️ <strong>Allergies/Notes:</strong> {o.notes}
                        </div>
                      )}
                      <p>{formatCurrency(o.totalAmount)}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {o.status === "Pending" && (
                          <div className="status-action-info">⏳ Waiting for kitchen</div>
                        )}
                        {o.status === "Preparing" && (
                          <div className="status-action-info">🍳 Being prepared</div>
                        )}
                        {o.status === "Served" && (
                          <button className="primary-button" onClick={() => handleMarkPaid(o.id)}>
                            💳 Collect Payment
                          </button>
                        )}
                        {o.status === "Pending" && (
                          <button className="danger-button" onClick={() => handleCancelOrder(o.id)}>Cancel</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )
            }
          </section>

          <section className="card">
            <h2>My Shifts</h2>
            {myShifts.length === 0
              ? <EmptyState label="No shifts scheduled." />
              : myShifts.map((s) => (
                <p key={s.id}>{new Date(s.startTime).toLocaleString()} — {new Date(s.endTime).toLocaleString()}</p>
              ))
            }
          </section>
        </>
      )}

      {cashierTab === "History" && (
        <section className="card wide-card" style={{ gridColumn: "1 / -1" }}>
          <h2>💳 Payment History</h2>

          <h3 style={{ color: "#e0105f", fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase", margin: "1rem 0 0.75rem" }}>
            Paid Orders
          </h3>
          {paidOrders.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.875rem" }}>No paid orders yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Customer</th><th>Table</th><th>Items</th><th>Total</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {paidOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.customerName || "—"}</td>
                      <td>{o.tableNumber}</td>
                      <td style={{ color: "#888", fontSize: "0.82rem" }}>
                        {Array.isArray(o.items)
                          ? (o.items as { name: string; quantity: number }[]).map((i) => `${i.quantity}× ${i.name}`).join(", ")
                          : "—"}
                      </td>
                      <td style={{ color: "#27ae60", fontWeight: 700 }}>£{Number(o.totalAmount).toFixed(2)}</td>
                      <td style={{ color: "#888", fontSize: "0.82rem" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" "}
                        {new Date(o.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ color: "#e0105f", fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase", margin: "1.5rem 0 0.75rem" }}>
            Reservation History
          </h3>
          {paidReservations.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.875rem" }}>No reservation orders yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Customer</th><th>Table</th><th>Party Size</th><th>Pre-Order Total</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {paidReservations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.customerName}</td>
                      <td>{r.tableNumber}</td>
                      <td>{r.partySize}</td>
                      <td style={{ color: "#27ae60", fontWeight: 700 }}>£{Number(r.totalAmount).toFixed(2)}</td>
                      <td style={{ color: "#888", fontSize: "0.82rem" }}>
                        {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showReceiptModal && receiptOrder && (
        <>
          <div className="modal-backdrop" onClick={() => setShowReceiptModal(false)} />
          <div className="receipt-modal">
            <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕</button>

            {receiptView === "success" && (
              <div className="receipt-success-view">
                <div className="receipt-success-icon">✅</div>
                <h2>Payment Collected</h2>
                <p>Order <strong>#{receiptOrder.id.slice(-6).toUpperCase()}</strong> has been marked as paid.</p>
                {receiptOrder.customerName && (
                  <p style={{ color: "#888", fontSize: "0.875rem" }}>Customer: <strong style={{ color: "#fff" }}>{receiptOrder.customerName}</strong></p>
                )}
                <p style={{ color: "#e0105f", fontSize: "1.2rem", fontWeight: 700, margin: "0.5rem 0 1.5rem" }}>
                  £{receiptOrder.totalAmount.toFixed(2)} paid
                </p>
                <div className="receipt-modal-actions">
                  <button className="secondary-button" onClick={() => setReceiptView("view")}>👁️ View Receipt</button>
                  <button className="primary-button" onClick={() => generatePDFReceipt(receiptOrder)}>⬇️ Download Receipt</button>
                </div>
              </div>
            )}

            {receiptView === "view" && (
              <div className="receipt-preview-view">
                <button className="back-link" onClick={() => setReceiptView("success")}>← Back</button>
                <div className="receipt-preview-inner">
                  <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", letterSpacing: "4px", color: "#fff" }}>STEAKZ</h2>
                    <p style={{ color: "#888", fontSize: "0.8rem" }}>Premium British Steakhouse</p>
                    <p style={{ color: "#666", fontSize: "0.75rem" }}>Receipt #{receiptOrder.id.slice(-6).toUpperCase()}</p>
                    <p style={{ color: "#666", fontSize: "0.75rem" }}>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions)}</p>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ color: "#888", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "0.4rem" }}>Customer</p>
                    <p style={{ color: "#fff", fontWeight: 600 }}>{receiptOrder.customerName ?? "Walk-in Guest"}</p>
                    <p style={{ color: "#888", fontSize: "0.82rem" }}>Table {receiptOrder.tableNumber > 0 ? receiptOrder.tableNumber : "—"}</p>
                  </div>
                  <p style={{ color: "#888", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "0.75rem" }}>Items</p>
                  {receiptOrder.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #2a2a2a", fontSize: "0.875rem" }}>
                      <span style={{ color: "#ccc" }}>{item.name} × {item.quantity}</span>
                      <span style={{ color: "#fff", fontWeight: 600 }}>£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#888", marginBottom: "0.35rem" }}>
                      <span>Subtotal (ex. VAT)</span><span>£{(receiptOrder.totalAmount / 1.2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#888", marginBottom: "0.75rem" }}>
                      <span>VAT (20%)</span><span>£{(receiptOrder.totalAmount - receiptOrder.totalAmount / 1.2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                      <span>TOTAL PAID</span><span style={{ color: "#e0105f" }}>£{receiptOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #2a2a2a", color: "#555", fontSize: "0.75rem" }}>
                    <p>Thank you for dining at Steakz</p>
                    <p>hello@steakz.co.uk | VAT No. GB 000 0000 00</p>
                  </div>
                </div>
                <button className="primary-button" style={{ width: "100%", marginTop: "1rem" }} onClick={() => generatePDFReceipt(receiptOrder)}>
                  ⬇️ Download Receipt
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { publicGetBranches, publicGetMenu, checkCustomerName, createReservation } from "../api";
import { toast } from "../components/Toast";
import type { Branch, MenuItem } from "../types";
import confetti from "canvas-confetti";

const TIMES = ["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00"];

export default function ReservationPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [tableNumber, setTableNumber] = useState(0);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cart, setCart] = useState<{ name: string; quantity: number; price: number }[]>([]);

  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<"password" | "register" | null>(null);
  const [promptPassword, setPromptPassword] = useState("");
  const [promptError, setPromptError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => { publicGetBranches().then(setBranches).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    publicGetMenu(selectedBranchId).then(setMenuItems).catch(() => {});
  }, [selectedBranchId]);

  useEffect(() => { if (user?.name) setCustomerName(user.name); }, [user]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) return prev.map((i) => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { name: item.name, quantity: 1, price: Number(item.price) }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.name !== name);
      return prev.map((i) => i.name === name ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const submitReservation = async () => {
    if (!selectedBranchId || !date || !time || !tableNumber || cart.length === 0) {
      setError("Please fill in all fields and add at least one item.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      await createReservation({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        partySize,
        tableNumber,
        date: dateTime,
        notes: notes.trim() || undefined,
        items: cart,
        totalAmount,
        branchId: selectedBranchId,
      });
      setSuccess(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#e0105f","#fff","#ff6b9d"] });
      toast("Reservation confirmed! See you soon 🎉", "success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError("Please enter your name."); return; }
    if (isAuthenticated && user?.role === 6) { await submitReservation(); return; }
    setLoading(true);
    try {
      const { exists } = await checkCustomerName(customerName.trim());
      if (exists) { setPromptType("password"); setShowPrompt(true); }
      else { setPromptType("register"); setShowPrompt(true); }
    } catch { setError("Could not verify account."); }
    finally { setLoading(false); }
  };

  const handlePasswordVerify = async () => {
    setPromptError("");
    if (!promptPassword.trim()) { setPromptError("Please enter your password."); return; }
    try {
      const data = await checkCustomerName(customerName.trim(), true);
      if (!data.email) { setPromptError("Account not found."); return; }
      await login(data.email, promptPassword);
      setShowPrompt(false);
      setPromptPassword("");
      await submitReservation();
    } catch { setPromptError("Incorrect password. Please try again."); }
  };

  const today = new Date().toISOString().split("T")[0];

  if (success) return (
    <div className="reservation-page">
      <div className="reservation-success">
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h1>Reservation Confirmed!</h1>
        <p>We look forward to seeing you at <strong>{selectedBranch?.name}</strong>.</p>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>
          {new Date(`${date}T${time}`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at {time} · Table {tableNumber} · Party of {partySize}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
          <button className="btn-primary-lg" onClick={() => navigate("/my-orders")}>View My Reservations</button>
          <button className="btn-outline-lg" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reservation-page">
      {/* Hero */}
      <div className="menu-hero">
        <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80" alt="Reserve" className="menu-hero-bg" />
        <div className="menu-hero-overlay" />
        <div className="menu-hero-content">
          <p className="hero-eyebrow">✦ Dine with Us ✦</p>
          <h1 className="gradient-text">Reserve a Table</h1>
          <p>Choose your branch, pick a time, pre-select your food</p>
        </div>
      </div>

      <button className="back-link" style={{ maxWidth: 1200, margin: "0 auto", display: "block", padding: "1rem 2rem 0" }} onClick={() => navigate("/")}>← Back to home</button>

      <form className="reservation-layout section-inner" onSubmit={handleSubmit}>

        {/* LEFT — Details + Menu */}
        <div className="reservation-main">

          {/* Branch picker */}
          <div className="card">
            <h2>📍 Choose Branch</h2>
            <div className="branch-options" style={{ marginTop: "1rem" }}>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={selectedBranchId === b.id ? "branch-option selected" : "branch-option"}
                  onClick={() => setSelectedBranchId(b.id)}
                >
                  <strong>{b.name}</strong>
                  <span>{b.location}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date, time, party size */}
          {selectedBranchId && (
            <div className="card">
              <h2>📅 Date & Time</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", color: "#ccc", fontSize: "0.875rem" }}>
                  Date
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", color: "#ccc", fontSize: "0.875rem" }}>
                  Time
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                  >
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", color: "#ccc", fontSize: "0.875rem" }}>
                  Party Size
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </label>
              </div>

              {/* Table picker */}
              <div style={{ marginTop: "1.25rem" }}>
                <p style={{ color: "#ccc", fontSize: "0.875rem", marginBottom: "0.6rem", fontWeight: 600 }}>Select Table</p>
                <div className="table-picker">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTableNumber(t)}
                      className={`table-btn${tableNumber === t ? " selected" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {tableNumber > 0 && <p style={{ color: "#27ae60", fontSize: "0.78rem", marginTop: "0.4rem" }}>✓ Table {tableNumber} selected</p>}
              </div>
            </div>
          )}

          {/* Menu pre-order */}
          {selectedBranchId && menuItems.length > 0 && (
            <div className="card">
              <h2>🍽️ Pre-Order Your Food</h2>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0.5rem 0 1.25rem" }}>
                Select what you'd like — your order goes straight to the kitchen when you arrive.
              </p>
              {[...new Set(menuItems.map((i) => i.category))].sort().map((cat) => (
                <div key={cat} style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ color: "#e0105f", fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.75rem" }}>{cat}</h3>
                  <div className="menu-grid">
                    {menuItems.filter((i) => i.category === cat).map((item) => {
                      const inCart = cart.find((c) => c.name === item.name);
                      return (
                        <article key={item.name} className="menu-card" style={{ padding: "1rem" }}>
                          <span style={{ color: "#888", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>{item.category}</span>
                          <h3 style={{ color: "#fff", margin: "0.25rem 0 0.35rem", fontSize: "0.95rem" }}>{item.name}</h3>
                          <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 0.75rem", lineHeight: 1.5 }}>{item.description}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ color: "#e0105f" }}>£{Number(item.price).toFixed(2)}</strong>
                            {inCart ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button type="button" className="secondary-button" style={{ padding: "0.2rem 0.6rem", fontSize: "1rem" }} onClick={() => removeFromCart(item.name)}>−</button>
                                <span style={{ color: "#fff", minWidth: 20, textAlign: "center" }}>{inCart.quantity}</span>
                                <button type="button" className="secondary-button" style={{ padding: "0.2rem 0.6rem", fontSize: "1rem" }} onClick={() => addToCart(item)}>+</button>
                              </div>
                            ) : (
                              <button type="button" className="secondary-button" style={{ padding: "0.3rem 0.8rem", fontSize: "0.82rem" }} onClick={() => addToCart(item)}>+ Add</button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Summary + Guest details */}
        <aside className="cart-panel">
          <div className="card cart-card">
            <h2>🗓️ Your Reservation</h2>

            {selectedBranch && (
              <div style={{ background: "#111", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#ccc", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <div><span style={{ color: "#888" }}>Branch: </span><strong style={{ color: "#fff" }}>{selectedBranch.name}</strong></div>
                {date && <div><span style={{ color: "#888" }}>Date: </span><strong style={{ color: "#fff" }}>{new Date(`${date}T${time}`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {time}</strong></div>}
                {partySize && <div><span style={{ color: "#888" }}>Guests: </span><strong style={{ color: "#fff" }}>{partySize}</strong></div>}
                {tableNumber > 0 && <div><span style={{ color: "#888" }}>Table: </span><strong style={{ color: "#fff" }}>{tableNumber}</strong></div>}
              </div>
            )}

            {cart.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {cart.map((item) => (
                  <div key={item.name} className="cart-row">
                    <span style={{ color: "#ccc", fontSize: "0.875rem" }}>{item.name}</span>
                    <span style={{ color: "#888", fontSize: "0.82rem" }}>×{item.quantity}</span>
                    <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600 }}>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", paddingTop: "0.6rem", marginTop: "0.3rem" }}>
                  <span style={{ color: "#888" }}>Total</span>
                  <strong style={{ color: "#e0105f", fontSize: "1.1rem" }}>£{totalAmount.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: "#555", fontStyle: "italic", fontSize: "0.875rem" }}>No items selected yet.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "#ccc", fontSize: "0.875rem" }}>
                Your Name
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  required
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                />
                {isAuthenticated && user?.role === 6 && (
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>Using your account name</span>
                )}
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "#ccc", fontSize: "0.875rem" }}>
                Email (optional)
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="for confirmation"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "#ccc", fontSize: "0.875rem" }}>
                Allergies / Notes
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any dietary requirements?"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                />
              </label>
            </div>

            {error && (
              <div style={{ background: "rgba(224,16,95,0.1)", border: "1px solid rgba(224,16,95,0.3)", borderRadius: 8, padding: "0.75rem 1rem", color: "#ff6b9d", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading || !selectedBranchId || !date || tableNumber === 0 || cart.length === 0}
              style={{ width: "100%", padding: "0.9rem", fontSize: "1rem", marginTop: "0.5rem" }}
            >
              {loading ? "Processing…" : "Confirm Reservation"}
            </button>
            <p style={{ color: "#555", fontSize: "0.75rem", textAlign: "center" }}>
              You must have a Steakz account to reserve a table
            </p>
          </div>
        </aside>

      </form>

      {/* Account prompt modal */}
      {showPrompt && (
        <>
          <div className="modal-backdrop" onClick={() => { setShowPrompt(false); setPromptPassword(""); setPromptError(""); }} />
          <div className="receipt-modal">
            <button className="modal-close" onClick={() => { setShowPrompt(false); setPromptPassword(""); setPromptError(""); }}>✕</button>

            {promptType === "password" && (
              <div className="receipt-success-view">
                <div className="receipt-success-icon">🔐</div>
                <h2>Verify Your Identity</h2>
                <p>We found an account for <strong style={{ color: "#fff" }}>{customerName}</strong>.</p>
                <p>Please enter your password to confirm the reservation.</p>
                {promptError && <div className="auth-error" style={{ margin: "0.75rem 0" }}>{promptError}</div>}
                <div style={{ margin: "1rem 0" }}>
                  <input
                    type="password"
                    value={promptPassword}
                    onChange={(e) => setPromptPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => { if (e.key === "Enter") handlePasswordVerify(); }}
                    style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.75rem 1rem", color: "#fff", fontSize: "0.95rem" }}
                  />
                </div>
                <div className="receipt-modal-actions">
                  <button className="primary-button" onClick={handlePasswordVerify}>Confirm & Reserve</button>
                </div>
              </div>
            )}

            {promptType === "register" && (
              <div className="receipt-success-view">
                <div className="receipt-success-icon">👤</div>
                <h2>Account Required</h2>
                <p>You need a Steakz account to make a reservation.</p>
                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0 1.5rem" }}>
                  Create a free account in seconds — your reservations will be tracked in My Orders.
                </p>
                <div className="receipt-modal-actions">
                  <button className="primary-button" onClick={() => { setShowPrompt(false); navigate("/login"); }}>Register Now</button>
                  <button className="secondary-button" onClick={() => { setShowPrompt(false); navigate("/login"); }}>I have an account</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

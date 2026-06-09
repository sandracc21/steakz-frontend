import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyOrders, getMyReservations, submitReview, publicGetBranches } from "../api";
import type { Reservation } from "../api";
import type { Branch } from "../types";
import { toast } from "../components/Toast";
import type { Order, OrderItem } from "../types";

const STEPS = ["Pending", "Preparing", "Served", "Paid"];
const STATUS_COLOURS: Record<string, string> = {
  Pending:   "#e67e22",
  Preparing: "#f39c12",
  Served:    "#2ecc71",
  Paid:      "#27ae60",
};
const STATUS_ICONS: Record<string, string> = {
  Pending:   "⏳",
  Preparing: "👨‍🍳",
  Served:    "🎉",
  Paid:      "✅",
};

export default function MyOrdersPage() {
  const { token, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (user?.role !== 6) { navigate("/staff"); return; }

    getMyReservations(token!).then(setReservations).catch(() => {});
    publicGetBranches().then(setBranches).catch(() => {});

    const fetchOrders = () =>
      getMyOrders(token!)
        .then(setOrders)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load orders"))
        .finally(() => setLoading(false));

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitReview = async () => {
    if (!token || !reviewingOrderId) return;
    setReviewLoading(true);
    setReviewError("");
    try {
      await submitReview(token, {
        orderId: reviewingOrderId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewedOrderIds((prev) => new Set([...prev, reviewingOrderId]));
      setReviewingOrderId(null);
      setReviewComment("");
      setReviewRating(5);
      toast("Thank you for your review! ⭐", "success");
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== "Paid");
  const pastOrders   = orders.filter((o) => o.status === "Paid");

  return (
    <div className="my-orders-page">
      {/* Personal hero */}
      <div className="orders-hero">
        <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80" alt="Restaurant" className="orders-hero-bg" />
        <div className="orders-hero-overlay" />
        <div className="orders-hero-content">
          <p className="hero-eyebrow">Welcome back</p>
          <h1>Hola, {user?.name?.split(" ")[0] ?? "there"} 👋</h1>
          <p>Track your orders and order history below</p>
        </div>
      </div>

      <div className="section-inner orders-content">
        {/* Tip banner */}
        <div className="orders-tip-banner">
          <span>💡</span>
          <span>
            Orders are matched to your account name <strong>{user?.name}</strong>.
            Always use this name when ordering.
          </span>
          <button className="btn-sm-outline" onClick={() => navigate("/order")}>
            + New Order
          </button>
        </div>

        {loading && <div className="page-loading">Loading your orders…</div>}
        {error && <div className="auth-error">{error}</div>}

        {/* Reservations */}
        {reservations.filter((r) => r.status !== "Seated").length > 0 && (
          <div className="orders-section">
            <h2 className="orders-section-title">🗓️ My Reservations</h2>
            <div className="orders-list">
              {reservations.filter((r) => r.status !== "Seated").map((r) => (
                <div key={r.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <h3>{r.branch?.name ?? "Steakz"} — Table {r.tableNumber}</h3>
                      <p className="order-date">
                        {new Date(r.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at {new Date(r.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · Party of {r.partySize}
                      </p>
                    </div>
                    <span className="status-badge" style={{
                      background: r.status === "Pending"   ? "#e67e22" :
                                  r.status === "Paid"      ? "#27ae60" :
                                  r.status === "Cancelled" ? "#555"    : "#555"
                    }}>
                      {r.status === "Pending"   ? "⏳ Confirmed — Awaiting arrival" :
                       r.status === "Paid"      ? "✅ Completed" :
                       "❌ Cancelled"}
                    </span>
                  </div>
                  <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.5rem" }}>
                    {r.items.slice(0, 2).map((i) => i.name).join(", ")}{r.items.length > 2 ? ` + ${r.items.length - 2} more` : ""}
                  </p>
                  <div className="order-card-footer">
                    <span style={{ color: "#888", fontSize: "0.8rem" }}>Pre-order total</span>
                    <strong>£{Number(r.totalAmount).toFixed(2)}</strong>
                  </div>
                  {r.status === "Paid" && r.orderId && (
                    <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.75rem" }}>
                      {reviewedOrderIds.has(r.orderId) ? (
                        <p style={{ color: "#27ae60", fontSize: "0.82rem", margin: 0 }}>⭐ Review submitted — thank you!</p>
                      ) : (
                        <button
                          className="secondary-button"
                          style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
                          onClick={() => { setReviewingOrderId(r.orderId!); setReviewRating(5); setReviewComment(""); }}
                        >
                          ⭐ Leave a Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active orders */}
        {!loading && activeOrders.length > 0 && (
          <div className="orders-section">
            <h2 className="orders-section-title">🔴 Active Orders</h2>
            <div className="orders-list">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  branchName={branches.find((b) => b.id === order.branchId)?.name}
                  onClick={() => setSelectedOrder(order)}
                  onReview={(id) => { setReviewingOrderId(id); setReviewRating(5); setReviewComment(""); }}
                  hasReviewed={reviewedOrderIds.has(order.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past orders */}
        {!loading && pastOrders.length > 0 && (
          <div className="orders-section">
            <h2 className="orders-section-title">Order History</h2>
            <div className="orders-list">
              {pastOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  branchName={branches.find((b) => b.id === order.branchId)?.name}
                  onClick={() => setSelectedOrder(order)}
                  onReview={(id) => { setReviewingOrderId(id); setReviewRating(5); setReviewComment(""); }}
                  hasReviewed={reviewedOrderIds.has(order.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h2>No orders yet, {user?.name?.split(" ")[0]}</h2>
            <p>Place your first order and track it right here in real time.</p>
            <button className="btn-primary-lg" onClick={() => navigate("/order")}>
              Order Now
            </button>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewingOrderId && (
        <>
          <div className="modal-backdrop" onClick={() => setReviewingOrderId(null)} />
          <div className="receipt-modal">
            <button className="modal-close" onClick={() => setReviewingOrderId(null)}>✕</button>
            <div className="receipt-success-view">
              <div className="receipt-success-icon">⭐</div>
              <h2>Leave a Review</h2>
              <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                How was your experience? Your review helps other diners.
              </p>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "2.5rem",
                      cursor: "pointer",
                      color: star <= reviewRating ? "#f1c40f" : "#333",
                      transition: "color 0.15s, transform 0.15s",
                      transform: star <= reviewRating ? "scale(1.1)" : "scale(1)",
                      padding: "0 0.1rem",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p style={{ color: "#888", fontSize: "0.82rem", marginBottom: "1rem" }}>
                {reviewRating === 1 ? "Poor" : reviewRating === 2 ? "Fair" : reviewRating === 3 ? "Good" : reviewRating === 4 ? "Very Good" : "Excellent!"}
              </p>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about your experience (optional)..."
                rows={3}
                style={{
                  width: "100%",
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  color: "#fff",
                  fontSize: "0.9rem",
                  resize: "vertical",
                  fontFamily: "inherit",
                  marginBottom: "1rem",
                  boxSizing: "border-box",
                }}
              />

              {reviewError && (
                <div className="auth-error" style={{ marginBottom: "1rem" }}>{reviewError}</div>
              )}

              <div className="receipt-modal-actions">
                <button
                  className="primary-button"
                  onClick={handleSubmitReview}
                  disabled={reviewLoading}
                  style={{ minWidth: 160 }}
                >
                  {reviewLoading ? "Submitting…" : "Submit Review"}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setReviewingOrderId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Side panel — order detail */}
      {selectedOrder && (
        <>
          <div className="side-panel-backdrop" onClick={() => setSelectedOrder(null)} />
          <div className="side-panel">
            <button className="side-panel-close" onClick={() => setSelectedOrder(null)}>✕</button>
            <div className="side-panel-body" style={{ paddingTop: "2rem" }}>
              <span className="side-panel-category">Order Details</span>
              <h2>#{selectedOrder.id.slice(-6).toUpperCase()}</h2>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>
                {new Date(selectedOrder.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              {branches.find((b) => b.id === selectedOrder.branchId) && (
                <p style={{ color: "#c0a060", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                  📍 {branches.find((b) => b.id === selectedOrder.branchId)!.name}
                </p>
              )}

              {/* Progress timeline */}
              <div className="order-timeline">
                {STEPS.map((step, i) => {
                  const stepIdx = STEPS.indexOf(selectedOrder.status);
                  const done = i <= stepIdx;
                  return (
                    <div key={step} className={`timeline-step${done ? " done" : ""}`}>
                      <div className="timeline-dot">{done ? "✓" : i + 1}</div>
                      <span>{step}</span>
                      {i < STEPS.length - 1 && (
                        <div className={`timeline-line${done && i < stepIdx ? " done" : ""}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Items */}
              <h3 style={{ color: "#fff", margin: "1.5rem 0 0.75rem" }}>Items</h3>
              {(selectedOrder.items as OrderItem[]).map((item, i) => (
                <div className="order-item-row" key={i}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="order-card-footer" style={{ marginTop: "1rem" }}>
                <span>Total</span>
                <strong>£{Number(selectedOrder.totalAmount).toFixed(2)}</strong>
              </div>

              {selectedOrder.status === "Served" && (
                <div className="order-ready-banner">
                  🎉 Your order is ready! Please collect at the counter.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OrderCard({
  order, branchName, onClick, onReview, hasReviewed,
}: {
  order: Order;
  branchName?: string;
  onClick: () => void;
  onReview?: (id: string) => void;
  hasReviewed?: boolean;
}) {
  const items = order.items as OrderItem[];
  return (
    <div className="order-card clickable" onClick={onClick}>
      <div className="order-card-header">
        <div>
          <h3>Order #{order.id.slice(-6).toUpperCase()}</h3>
          <p className="order-date">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })}
            {branchName && <span style={{ marginLeft: "0.5rem", color: "#c0a060" }}>· 📍 {branchName}</span>}
          </p>
        </div>
        <span
          className={`status-badge${
            order.status === "Pending"   ? " status-badge-pending" :
            order.status === "Preparing" ? " status-badge-preparing" :
            order.status === "Served"    ? " status-badge-live" : ""
          }`}
          style={{ background: STATUS_COLOURS[order.status] ?? "#666" }}
        >
          {STATUS_ICONS[order.status]} {order.status}
        </span>
      </div>
      <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.5rem" }}>
        {items.slice(0, 2).map((i) => i.name).join(", ")}
        {items.length > 2 ? ` + ${items.length - 2} more` : ""}
      </p>
      <div className="order-card-footer">
        <span style={{ color: "#888", fontSize: "0.8rem" }}>Tap for details</span>
        <strong>£{Number(order.totalAmount).toFixed(2)}</strong>
      </div>
      {order.status === "Paid" && onReview && (
        <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.75rem" }}>
          {hasReviewed ? (
            <p style={{ color: "#27ae60", fontSize: "0.82rem", margin: 0 }}>⭐ Review submitted — thank you!</p>
          ) : (
            <button
              className="secondary-button"
              style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
              onClick={(e) => { e.stopPropagation(); onReview(order.id); }}
            >
              ⭐ Leave a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

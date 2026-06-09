import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, Minus, Plus, ReceiptText, ShoppingCart } from "lucide-react";
import confetti from "canvas-confetti";
import { publicGetBranches, publicCreateOrder, publicGetMenu, checkCustomerName, getAvailableTables } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/Toast";
import type { Branch, MenuItem } from "../types";

interface DraftItem { name: string; quantity: number; price: number; }

const DISH_IMAGES: Record<string, string> = {
  // STARTERS
  "Bone Marrow & Sourdough":     "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80",
  "Burrata & Heritage Tomatoes": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&q=80",
  "Potted Beef & Pickles":       "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
  "Smoked Salmon Rillettes":     "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
  "Black Pudding Scotch Egg":    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80",
  // STEAKS
  "28-Day Aged Ribeye (300g)":   "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
  "Chateaubriand (500g, for 2)": "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80",
  "Flat Iron Steak (250g)":      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80",
  "Tomahawk (1kg, for 2)":       "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80",
  "Rump & Egg (200g)":           "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "Mayfair Wagyu Sirloin":       "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
  // SIDES
  "Triple-Cooked Chips":         "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
  "Cauliflower Cheese":          "https://images.unsplash.com/photo-1568600891597-8c977a19be83?w=400&q=80",
  "Tenderstem Broccoli":         "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80",
  "Creamed Spinach":             "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
  // DESSERTS
  "Sticky Toffee Pudding":       "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80",
  "Eton Mess Cheesecake":        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
  "Dark Chocolate Fondant":      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80",
  // DRINKS
  "House Red":                   "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
  "Aperol Spritz":               "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
  "Classic Negroni":             "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80",
  "Soft Drinks":                 "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&q=80",
};
const DEFAULT_DISH_IMG = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80";

const BRANCH_IMAGES: Record<string, string> = {
  "Manchester": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  "London":     "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80",
  "Edinburgh":  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  "Birmingham": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80",
  "Bristol":    "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400&q=80",
};
const DEFAULT_BRANCH_IMG = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80";

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

const FALLBACK_BRANCHES: Pick<Branch, "id" | "name" | "location">[] = [
  { id: "manchester", name: "Steakz Manchester", location: "Manchester, UK" },
  { id: "london",     name: "Steakz London",     location: "London, UK"     },
  { id: "edinburgh",  name: "Steakz Edinburgh",  location: "Edinburgh, UK"  },
  { id: "birmingham", name: "Steakz Birmingham", location: "Birmingham, UK" },
  { id: "bristol",    name: "Steakz Bristol",    location: "Bristol, UK"    },
];

function formatCurrency(value: number) {
  return `£${value.toFixed(2)}`;
}

export default function OrderPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const isStaff = isAuthenticated && user?.role !== 6;

  const [branches, setBranches] = useState(FALLBACK_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState(FALLBACK_BRANCHES[0].id);
  const [menuItems, setMenuItems] = useState<{ name: string; price: number; category: string; description: string; available: boolean }[]>(
    PRICED_MENU_ITEMS.map((i) => ({ ...i, available: true }))
  );
  const [cart, setCart] = useState<DraftItem[]>([]);
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Table picker
  const [tableNumber, setTableNumber] = useState<number>(0);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);

  // Account prompt modal
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [promptType, setPromptType] = useState<"password" | "register" | null>(null);
  const [promptPassword, setPromptPassword] = useState("");
  const [promptError, setPromptError] = useState("");

  useEffect(() => {
    publicGetBranches()
      .then((data) => {
        if (data.length > 0) {
          setBranches(data);
          setSelectedBranchId(data[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    publicGetMenu(selectedBranchId !== FALLBACK_BRANCHES[0].id ? selectedBranchId : undefined)
      .then((data: MenuItem[]) => {
        if (data.length > 0) {
          setMenuItems(data.map((item) => ({
            name: item.name,
            price: Number(item.price),
            category: item.category,
            description: item.description,
            available: item.available,
          })));
        }
      })
      .catch(() => undefined);
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    getAvailableTables(selectedBranchId)
      .then((data) => setOccupiedTables(data.occupiedTables))
      .catch(() => undefined);
  }, [selectedBranchId]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) ?? branches[0];
  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (menuItem: { name: string; price: number; category: string; description: string }) => {
    setOrderMessage(null);
    setCart((current) => {
      const existing = current.find((item) => item.name === menuItem.name);
      if (existing) {
        return current.map((item) =>
          item.name === menuItem.name ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { name: menuItem.name, quantity: 1, price: menuItem.price }];
    });
  };

  const changeCartQuantity = (name: string, change: number) => {
    setCart((current) =>
      current
        .map((item) => item.name === name ? { ...item, quantity: item.quantity + change } : item)
        .filter((item) => item.quantity > 0),
    );
  };

  const submitOrder = async () => {
    setPlacingOrder(true);
    try {
      await publicCreateOrder({
        branchId: selectedBranch!.id,
        tableNumber,
        items: cart,
        totalAmount,
        customerName: customerName.trim(),
        customerPhone,
        notes,
      });
      setOrderMessage(`Order placed at ${selectedBranch!.name}! Table ${tableNumber}. Total ${formatCurrency(totalAmount)}.`);
      setCart([]);
      setCustomerPhone("");
      setNotes("");
      setTableNumber(0);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#e0105f", "#fff", "#ff6b9d", "#c00d52", "#ffb3d1"],
      });
      toast("Order placed successfully! 🎉", "success");
      // Refresh occupied tables
      getAvailableTables(selectedBranchId).then((d) => setOccupiedTables(d.occupiedTables)).catch(() => undefined);
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setOrderError(null);
    setOrderMessage(null);

    if (!selectedBranch || cart.length === 0) {
      setOrderError("Choose a branch and add at least one item.");
      return;
    }
    if (!customerName.trim()) {
      setOrderError("Please enter your name to place an order.");
      return;
    }
    if (!tableNumber || tableNumber < 1) {
      setOrderError("Please select a table.");
      return;
    }

    // If already logged in as a customer, place order directly
    if (isAuthenticated && user?.role === 6) {
      await submitOrder();
      return;
    }

    // Not logged in — check if name matches a registered account
    setPlacingOrder(true);
    try {
      const { exists } = await checkCustomerName(customerName.trim());
      if (exists) {
        setPromptType("password");
        setShowAccountPrompt(true);
      } else {
        setPromptType("register");
        setShowAccountPrompt(true);
      }
    } catch {
      setOrderError("Could not verify account. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePasswordVerify = async () => {
    setPromptError("");
    if (!promptPassword.trim()) { setPromptError("Please enter your password."); return; }
    try {
      const data = await checkCustomerName(customerName.trim(), true);
      if (!data.email) { setPromptError("Account not found."); return; }
      await login(data.email, promptPassword);
      setShowAccountPrompt(false);
      setPromptPassword("");
      await submitOrder();
    } catch {
      setPromptError("Incorrect password. Please try again.");
    }
  };

  const menuCategories = [...new Set(menuItems.map((i) => i.category))].sort();

  return (
    <div className="order-page">
      {/* Hero */}
      <div className="menu-hero">
        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80" alt="Order" className="menu-hero-bg" />
        <div className="menu-hero-overlay" />
        <div className="menu-hero-content">
          <p className="hero-eyebrow">✦ Order Online ✦</p>
          <h1>Place an Order</h1>
          <p>Pick your branch, build your cart, and order for collection</p>
        </div>
      </div>
      <button className="back-link" style={{ maxWidth: 1200, margin: "0 auto", display: "block", padding: "0 2rem" }} onClick={() => navigate("/")}>← Back to home</button>

      {isStaff && (
        <div style={{
          background: "rgba(224,16,95,0.08)", border: "1px solid rgba(224,16,95,0.2)",
          borderRadius: 12, padding: "1rem 1.5rem", margin: "1rem auto",
          maxWidth: 1200, color: "#ccc", fontSize: "0.9rem", textAlign: "center"
        }}>
          👀 You are viewing the menu as staff — ordering is available to customers only.
        </div>
      )}

      <section className="ordering-layout section-inner" id="order" style={{ paddingTop: "1.5rem" }}>
        <div className="ordering-main">
          <div className="card branch-picker">
            <div className="card-title-row">
              <div>
                <p className="eyebrow">Choose branch</p>
                <h2>Order location</h2>
              </div>
              <MapPin size={22} />
            </div>
            <div className="branch-options">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className={selectedBranchId === branch.id ? "branch-option selected" : "branch-option"}
                  onClick={() => setSelectedBranchId(branch.id)}
                  style={{
                    backgroundImage: `url(${BRANCH_IMAGES[branch.location.split(",")[0].trim()] ?? DEFAULT_BRANCH_IMG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "90px",
                  }}
                >
                  <div style={{
                    position: "absolute", inset: 0,
                    background: selectedBranchId === branch.id
                      ? "rgba(224,16,95,0.65)"
                      : "rgba(10,5,5,0.72)",
                    transition: "background 0.3s",
                  }} />
                  <div style={{ position: "relative", zIndex: 1, textAlign: "left" }}>
                    <strong style={{ display: "block", fontSize: "1rem", color: "#fff" }}>{branch.name}</strong>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>{branch.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <section className="menu-section">
            <div className="section-heading">
              <p className="eyebrow">Menu</p>
              <h2>{selectedBranch?.name ?? "Select a branch"}</h2>
            </div>
            {menuCategories.map((cat) => (
              <div key={cat} style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#e0105f", fontSize: "1rem", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "1rem" }}>
                  {cat}
                </h3>
                <div className="menu-grid">
                  {menuItems.filter((i) => i.category === cat).map((item) => (
                    <article className="menu-card order-menu-card" key={item.name} style={{ opacity: item.available ? 1 : 0.7 }}>
                      <div className="order-dish-img" style={{ position: "relative" }}>
                        <img src={DISH_IMAGES[item.name] ?? DEFAULT_DISH_IMG} alt={item.name} loading="lazy" />
                        {!item.available && (
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            background: "rgba(0,0,0,0.75)", color: "#ff6b6b",
                            borderRadius: 6, padding: "0.2rem 0.5rem",
                            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1px",
                          }}>
                            UNAVAILABLE
                          </div>
                        )}
                      </div>
                      <span>{item.category}</span>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div>
                        <strong>{formatCurrency(item.price)}</strong>
                        {!isStaff && (
                          <button
                            className="secondary-button"
                            type="button"
                            disabled={!item.available}
                            style={{ opacity: item.available ? 1 : 0.4, cursor: item.available ? "pointer" : "not-allowed" }}
                            onClick={() => item.available && addToCart(item)}
                          >
                            {item.available ? <><Plus size={14} /> Add</> : "Unavailable"}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {!isStaff && (
        <aside className="cart-panel">
          <form className="card cart-card" onSubmit={handlePlaceOrder}>
            <div className="card-title-row">
              <div>
                <p className="eyebrow">Cart</p>
                <h2><ShoppingCart size={20} /> {itemCount} items</h2>
              </div>
              <ReceiptText size={22} />
            </div>
            {cart.length === 0
              ? <p style={{ color: "#b3b3b3", fontStyle: "italic" }}>Your cart is empty.</p>
              : cart.map((item) => (
                <div className="cart-row" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatCurrency(item.price)} each</span>
                  </div>
                  <div className="quantity-stepper">
                    <button type="button" onClick={() => changeCartQuantity(item.name, -1)} aria-label={`Remove one ${item.name}`}>
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => changeCartQuantity(item.name, 1)} aria-label={`Add one ${item.name}`}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong>{formatCurrency(item.quantity * item.price)}</strong>
                </div>
              ))
            }
            <div className="cart-total">
              <span>Total</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>

            {/* Table picker */}
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", color: "#ccc", fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                Select Table
              </label>
              <div className="table-picker">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => {
                  const occupied = occupiedTables.includes(t);
                  const selected = tableNumber === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={occupied}
                      onClick={() => setTableNumber(t)}
                      className={`table-btn${selected ? " selected" : ""}${occupied ? " occupied" : ""}`}
                      title={occupied ? `Table ${t} is currently occupied` : `Table ${t}`}
                    >
                      {t}
                      {occupied && <span className="table-occupied-dot" />}
                    </button>
                  );
                })}
              </div>
              {tableNumber > 0 && !occupiedTables.includes(tableNumber) && (
                <p style={{ color: "#27ae60", fontSize: "0.78rem", marginTop: "0.4rem" }}>✓ Table {tableNumber} is available</p>
              )}
              {tableNumber === 0 && (
                <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.4rem" }}>Please select a table to continue</p>
              )}
            </div>

            <label>
              Name
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" required />
              {user && (
                <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                  Using your account name — your orders will appear in My Orders
                </span>
              )}
            </label>
            <label>
              Phone
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+44..." required />
            </label>
            <label>
              Notes
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies or special requests" />
            </label>
            {orderError && (
              <div className={`order-error-banner${orderError.includes("active order") ? " active-order-warning" : ""}`}>
                {orderError.includes("active order") ? "🍽️ " : "⚠️ "}
                {orderError}
                {orderError.includes("active order") && (
                  <button
                    style={{ marginLeft: "0.75rem", background: "none", border: "1px solid rgba(224,16,95,0.4)", color: "#e0105f", borderRadius: 6, padding: "0.2rem 0.6rem", cursor: "pointer", fontSize: "0.8rem" }}
                    onClick={() => navigate("/my-orders")}
                  >
                    View My Orders →
                  </button>
                )}
              </div>
            )}
            {orderMessage && (
              <div className="success-banner">
                <CheckCircle2 size={18} /> {orderMessage}
              </div>
            )}
            <button className="primary-button" type="submit" disabled={placingOrder || cart.length === 0}>
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </aside>
        )}
      </section>

      {/* Account prompt modal */}
      {showAccountPrompt && (
        <>
          <div className="modal-backdrop" onClick={() => { setShowAccountPrompt(false); setPromptPassword(""); setPromptError(""); }} />
          <div className="receipt-modal">
            <button className="modal-close" onClick={() => { setShowAccountPrompt(false); setPromptPassword(""); setPromptError(""); }}>✕</button>

            {promptType === "password" && (
              <div className="receipt-success-view">
                <div className="receipt-success-icon">🔐</div>
                <h2>Verify Your Identity</h2>
                <p>We found an account for <strong style={{ color: "#fff" }}>{customerName}</strong>.</p>
                <p>Please enter your password to place the order.</p>
                {promptError && <div className="auth-error" style={{ margin: "0.75rem 0" }}>{promptError}</div>}
                <div style={{ margin: "1rem 0" }}>
                  <input
                    type="password"
                    value={promptPassword}
                    onChange={(e) => setPromptPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.75rem 1rem", color: "#fff", fontSize: "0.95rem" }}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePasswordVerify(); }}
                  />
                </div>
                <div className="receipt-modal-actions">
                  <button className="primary-button" onClick={handlePasswordVerify}>
                    Confirm & Place Order
                  </button>
                </div>
                <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#666" }}>
                  Not you? <span style={{ color: "#e0105f", cursor: "pointer" }} onClick={() => { setShowAccountPrompt(false); setCustomerName(""); }}>Change name</span>
                </p>
              </div>
            )}

            {promptType === "register" && (
              <div className="receipt-success-view">
                <div className="receipt-success-icon">👤</div>
                <h2>Account Not Recognised</h2>
                <p>You need a Steakz account to place an order.</p>
                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0 1.5rem" }}>
                  Create a free account in seconds — your orders will be tracked and visible in My Orders.
                </p>
                <div className="receipt-modal-actions">
                  <button className="primary-button" onClick={() => { setShowAccountPrompt(false); navigate("/login"); }}>
                    Register Now
                  </button>
                  <button className="secondary-button" onClick={() => { setShowAccountPrompt(false); navigate("/login"); }}>
                    I already have an account
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

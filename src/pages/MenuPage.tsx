import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicGetMenu, getReviewStats } from "../api";
import type { ReviewStats } from "../api";
import { useAuth } from "../contexts/AuthContext";
import type { MenuItem } from "../types";

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
const DEFAULT_IMG = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80";

const CATEGORY_IMAGES: Record<string, string> = {
  Starters: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80",
  Steaks:   "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  Sides:    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80",
  Desserts: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
  Drinks:   "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
  Specials: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
};

const FALLBACK_MENU: MenuItem[] = [
  { id:"1",  name:"Bone Marrow & Sourdough",     description:"Roasted bone marrow, parsley salad, sourdough toast.",         category:"Starters", price:8.95,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"2",  name:"Burrata & Heritage Tomatoes", description:"Creamy burrata, heirloom tomatoes, aged balsamic.",            category:"Starters", price:7.50,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"3",  name:"Black Pudding Scotch Egg",    description:"Free-range egg, Stornoway black pudding, mustard aioli.",      category:"Starters", price:7.95,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"4",  name:"28-Day Aged Ribeye (300g)",   description:"Dry-aged British ribeye, herb butter, triple-cooked chips.",   category:"Steaks",   price:34.95, available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"5",  name:"Flat Iron Steak (250g)",      description:"Bavette cut, chimichurri, watercress, shoestring fries.",      category:"Steaks",   price:24.95, available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"6",  name:"Tomahawk (1kg, for 2)",       description:"45-day dry-aged tomahawk, sharing sides included.",            category:"Steaks",   price:85.00, available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"7",  name:"Triple-Cooked Chips",         description:"Goose fat chips, flaky sea salt.",                             category:"Sides",    price:4.95,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"8",  name:"Cauliflower Cheese",          description:"Aged cheddar, gruyère, toasted breadcrumbs.",                  category:"Sides",    price:5.50,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"9",  name:"Sticky Toffee Pudding",       description:"Medjool date sponge, salted caramel sauce, clotted cream.",   category:"Desserts", price:7.95,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"10", name:"Dark Chocolate Fondant",      description:"Valrhona chocolate, salted caramel centre, honeycomb ice cream.", category:"Desserts", price:8.50, available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"11", name:"House Red",                   description:"Malbec, Mendoza, Argentina.",                                  category:"Drinks",   price:6.50,  available:true, branchId:null, createdAt:"", updatedAt:"" },
  { id:"12", name:"Classic Negroni",             description:"Tanqueray gin, Campari, sweet vermouth, orange zest.",         category:"Drinks",   price:9.50,  available:true, branchId:null, createdAt:"", updatedAt:"" },
];

const CATEGORY_ORDER = ["Starters", "Steaks", "Sides", "Desserts", "Drinks", "Specials"];

export default function MenuPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isStaff = isAuthenticated && user?.role !== 6;
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_MENU);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("Tapas");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    publicGetMenu()
      .then((data) => { if (data.length > 0) setItems(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    getReviewStats().then(setReviewStats).catch(() => {});
  }, []);

  const categories = CATEGORY_ORDER.filter((c) => items.some((i) => i.category === c));
  const filtered = items.filter((i) => i.category === activeCategory);

  return (
    <div className="menu-page">
      {/* Hero */}
      <div className="menu-hero">
        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80" alt="Menu hero" className="menu-hero-bg" />
        <div className="menu-hero-overlay" />
        <div className="menu-hero-content">
          <p className="hero-eyebrow">✦ Fresh Daily ✦</p>
          <h1 className="gradient-text">Our Menu</h1>
          <p>Premium British steakhouse, freshly prepared every day</p>
          {reviewStats && reviewStats.count > 0 && (
            <div className="menu-hero-rating">
              <span style={{ color: "#f1c40f" }}>{"★".repeat(Math.round(reviewStats.average))}</span>
              <strong>{reviewStats.average}</strong>
              <span>from {reviewStats.count} {reviewStats.count === 1 ? "review" : "reviews"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="menu-layout">
        {/* Sticky category sidebar */}
        <aside className="menu-sidebar">
          <h3>Categories</h3>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`menu-cat-btn${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat}</span>
              <span className="cat-count">{items.filter((i) => i.category === cat && i.available).length}</span>
            </button>
          ))}
          <div className="sidebar-cta">
            {isStaff ? (
              <button className="btn-primary-full" onClick={() => navigate("/")}>
                ← Back to Home
              </button>
            ) : (
              <>
                <p>Ready to order?</p>
                <button className="btn-primary-full" onClick={() => navigate("/order")}>
                  Order Now
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="menu-main">
          {loading ? (
            <div className="page-loading">Loading menu…</div>
          ) : (
            <>
              <div
                className="menu-category-header"
                style={CATEGORY_IMAGES[activeCategory] ? { backgroundImage: `linear-gradient(rgba(18,18,18,0.7),rgba(18,18,18,0.95)), url(${CATEGORY_IMAGES[activeCategory]})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 12, padding: "1.5rem" } : undefined}
              >
                <h2>{activeCategory}</h2>
                <span>{filtered.length} dishes</span>
              </div>
              <div className="menu-cards-grid">
                {filtered.map((item) => (
                  <div
                    className="menu-dish-card"
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ opacity: item.available ? 1 : 0.7 }}
                  >
                    <div className="menu-dish-img" style={{ position: "relative" }}>
                      <img
                        src={DISH_IMAGES[item.name] ?? DEFAULT_IMG}
                        alt={item.name}
                        loading="lazy"
                      />
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
                    <div className="menu-dish-body">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="menu-dish-footer">
                        <span className="price-tag">{Number(item.price).toFixed(2)}</span>
                        {!isStaff && (
                          <button
                            className="btn-sm-outline"
                            disabled={!item.available}
                            style={{ opacity: item.available ? 1 : 0.4, cursor: item.available ? "pointer" : "not-allowed" }}
                            onClick={(e) => { e.stopPropagation(); if (item.available) navigate("/order"); }}
                          >
                            {item.available ? "Order →" : "Unavailable"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Slide-out detail panel */}
      {selectedItem && (
        <>
          <div className="side-panel-backdrop" onClick={() => setSelectedItem(null)} />
          <div className="side-panel">
            <button className="side-panel-close" onClick={() => setSelectedItem(null)}>✕</button>
            <img
              src={DISH_IMAGES[selectedItem.name] ?? DEFAULT_IMG}
              alt={selectedItem.name}
              className="side-panel-img"
            />
            <div className="side-panel-body">
              <span className="side-panel-category">{selectedItem.category}</span>
              <h2>{selectedItem.name}</h2>
              <p>{selectedItem.description}</p>
              <div className="side-panel-price">£{Number(selectedItem.price).toFixed(2)}</div>
              {isStaff ? (
                <button className="btn-primary-full" onClick={() => navigate("/")}>
                  ← Back to Home
                </button>
              ) : (
                <button className="btn-primary-full" onClick={() => navigate("/order")}>
                  Order This Dish
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

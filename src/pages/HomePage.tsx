import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getPublicReviews, getReviewStats } from "../api";
import type { Review, ReviewStats } from "../api";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) el.classList.add("revealed"); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const FEATURED_DISHES = [
  { name: "28-Day Aged Ribeye",    desc: "Dry-aged British ribeye, herb butter, triple-cooked chips", price: "£34.95", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80" },
  { name: "Tomahawk (for 2)",      desc: "45-day dry-aged, bone-in, all sharing sides included",      price: "£85.00", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80" },
  { name: "Sticky Toffee Pudding", desc: "Medjool date sponge, salted caramel, clotted cream",        price: "£7.95",  img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80" },
];

const FALLBACK_TESTIMONIALS = [
  { name: "James H.",   city: "Manchester", stars: 5, text: "The dry-aged ribeye is simply the best steak I've had in the UK. Absolutely world class." },
  { name: "Priya S.",   city: "London",     stars: 5, text: "Came for a birthday dinner at the London branch. The Tomahawk for two was breathtaking." },
  { name: "Callum M.",  city: "Edinburgh",  stars: 5, text: "Stunning atmosphere and even better food. The Sticky Toffee Pudding alone is worth the trip." },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
  "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
  "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isStaff = isAuthenticated && user?.role !== 6;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const featuredRef = useReveal();
  const featuresRef = useReveal();
  const galleryRef  = useReveal();
  const testimonialsRef = useReveal();
  const locationsRef = useReveal();

  useEffect(() => {
    getPublicReviews().then(setReviews).catch(() => {});
    getReviewStats().then(setReviewStats).catch(() => {});
  }, []);

  return (
    <div className="home-page">

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <img className="hero-bg" src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80" alt="Steakz restaurant" />
        <div className="hero-content">
          <p className="hero-eyebrow">✦ Premium British Steakhouse ✦</p>
          <h1 className="hero-title gradient-text">Steakz</h1>
          <p className="hero-subtitle">The Finest Cuts. Five Iconic Locations.</p>
          <p className="hero-desc">Hand-selected, dry-aged British beef. Expertly crafted in five locations across the UK.</p>
          <div className="hero-cta">
            <button className="btn-primary-lg" onClick={() => navigate("/menu")}>View Menu</button>
            {!isStaff && <button className="btn-outline-lg" onClick={() => navigate("/order")}>Order Now</button>}
            {!isStaff && <button className="btn-outline-lg" onClick={() => navigate("/reserve")} style={{ borderColor: "rgba(255,255,255,0.5)" }}>Reserve a Table</button>}
          </div>
          <div className="hero-stats">
            <div><strong>5</strong><span>Locations</span></div>
            <div className="stat-divider" />
            <div><strong>28+</strong><span>Menu Items</span></div>
            <div className="stat-divider" />
            <div><strong>10yr</strong><span>Excellence</span></div>
          </div>
        </div>
        <div className="hero-scroll-hint">scroll ↓</div>
      </section>

      {/* Featured Dishes */}
      <section className="featured-section">
        <div className="section-inner reveal-section" ref={featuredRef}>
          <p className="section-eyebrow">Chef's Selection</p>
          <h2 className="section-title gradient-text-gold">Signature Dishes</h2>
          <div className="featured-grid">
            {FEATURED_DISHES.map((dish) => (
              <div className="featured-card" key={dish.name}>
                <div className="featured-card-img">
                  <img src={dish.img} alt={dish.name} loading="lazy" />
                  <div className="featured-card-overlay">
                    {!isStaff && <button className="btn-sm-outline" onClick={() => navigate("/order")}>Add to Order →</button>}
                  </div>
                </div>
                <div className="featured-card-body">
                  <h3>{dish.name}</h3>
                  <p>{dish.desc}</p>
                  <div className="featured-card-footer">
                    <span className="price-tag">{dish.price.replace("£","")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <button className="btn-primary-lg" onClick={() => navigate("/menu")}>View Full Menu</button>
          </div>
        </div>
      </section>

      {/* Split — Our Story */}
      <section className="split-section">
        <div className="split-img">
          <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80" alt="Steak" loading="lazy" />
        </div>
        <div className="split-content">
          <p className="section-eyebrow">Our Story</p>
          <h2>Rooted in Craft</h2>
          <p>Steakz was founded on a simple belief — that great beef, treated with respect, needs very little else. Every cut is dry-aged in-house, every sauce made from scratch.</p>
          <p>From the Northern Quarter in Manchester to the heart of London, each branch brings the same obsessive standard of quality to its neighbourhood.</p>
          <button className="btn-outline-lg" onClick={() => navigate("/menu")}>Explore the Menu</button>
        </div>
      </section>

      {/* Why Steakz */}
      <section className="features-section">
        <div className="section-inner reveal-section" ref={featuresRef}>
          <p className="section-eyebrow">Why Choose Us</p>
          <h2 className="section-title gradient-text-gold">The Steakz Standard</h2>
          <div className="features-grid">
            {[
              { icon: "🥩", title: "Dry-Aged In-House",   text: "Every cut aged a minimum of 28 days in our dedicated dry-age chambers" },
              { icon: "👨‍🍳", title: "Expert Chefs",       text: "Trained in Michelin-starred kitchens with decades of combined experience" },
              { icon: "📍", title: "5 UK Locations",      text: "Manchester, London, Edinburgh, Birmingham and Bristol" },
              { icon: "🍷", title: "Curated Wine List",   text: "Over 40 labels chosen specifically to complement our menu" },
              { icon: "🌿", title: "British Sourced",     text: "All beef sourced from British farms with full traceability" },
              { icon: "⭐", title: "Award Winning",       text: "Voted Best Steakhouse UK 2023 by Restaurant & Bar Awards" },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-section">
        <div className="section-inner reveal-section" ref={galleryRef}>
          <p className="section-eyebrow">Our Kitchen</p>
          <h2 className="section-title">Crafted with Passion</h2>
          <div className="gallery-grid">
            {GALLERY.map((src, i) => (
              <div className="gallery-item" key={i}>
                <img src={src} alt={`Steakz gallery ${i + 1}`} loading="lazy" />
                <div className="gallery-overlay" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-inner reveal-section" ref={testimonialsRef}>
          <p className="section-eyebrow">Reviews</p>
          <h2 className="section-title gradient-text-gold">What Our Guests Say</h2>

          {reviewStats && reviewStats.count > 0 && (
            <div className="review-stats-bar">
              <div className="review-stats-stars">
                {"★".repeat(Math.round(reviewStats.average))}{"☆".repeat(5 - Math.round(reviewStats.average))}
              </div>
              <strong>{reviewStats.average}</strong>
              <span>out of 5 · {reviewStats.count} {reviewStats.count === 1 ? "review" : "reviews"}</span>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="testimonials-grid">
              {reviews.map((r) => (
                <div className="testimonial-card" key={r.id}>
                  <div className="testimonial-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <p className="testimonial-text">"{r.comment || "Great experience at Steakz!"}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{r.customerName[0]}</div>
                    <div>
                      <strong>{r.customerName}</strong>
                      <span>{r.branch?.name ?? "Steakz UK"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="testimonials-grid">
              {FALLBACK_TESTIMONIALS.map((t) => (
                <div className="testimonial-card" key={t.name}>
                  <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.name[0]}</div>
                    <div><strong>{t.name}</strong><span>{t.city}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Locations */}
      <section className="locations-section">
        <div className="section-inner reveal-section" ref={locationsRef}>
          <p className="section-eyebrow">Find Us</p>
          <h2 className="section-title">Our UK Locations</h2>
          <div className="locations-grid">
            {[
              { city: "Manchester", flag: "🏙️", note: "Northern Quarter",  hours: "12:00 – 23:00" },
              { city: "London",     flag: "🎭", note: "Central London",     hours: "12:00 – 23:30" },
              { city: "Edinburgh",  flag: "🏰", note: "Old Town",           hours: "12:00 – 22:30" },
              { city: "Birmingham", flag: "💎", note: "Jewellery Quarter",  hours: "12:00 – 23:00" },
              { city: "Bristol",    flag: "🌉", note: "Clifton Village",    hours: "12:00 – 22:30" },
            ].map((loc) => (
              <div className="location-card" key={loc.city} onClick={() => navigate("/order")}>
                <div className="location-flag">{loc.flag}</div>
                <h3>{loc.city}</h3>
                <p>{loc.note}</p>
                <span className="location-hours">{loc.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="info-section">
        <div className="section-inner info-cards">
          <div className="info-card">
            <h3>🕐 Opening Hours</h3>
            <div className="hours-list">
              <div><span>Monday – Thursday</span><span>12:00 – 22:30</span></div>
              <div><span>Friday – Saturday</span><span>12:00 – 23:30</span></div>
              <div><span>Sunday</span><span>12:00 – 21:00</span></div>
            </div>
          </div>
          <div className="info-card">
            <h3>📞 Contact</h3>
            <div className="contact-list">
              <div><span>Phone</span><span>+44 161 000 0000</span></div>
              <div><span>Email</span><span>hello@steakz.co.uk</span></div>
              <div><span>HQ</span><span>Manchester, UK</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="cta-banner-bg" />
        <div className="cta-banner-content">
          <p className="section-eyebrow">Ready?</p>
          <h2>Experience Steakz</h2>
          <p>Order online for collection or dine in at your nearest UK location.</p>
          <div className="hero-cta">
            {!isStaff && <button className="btn-primary-lg" onClick={() => navigate("/order")}>Start Your Order</button>}
            {!isStaff && <button className="btn-outline-lg" onClick={() => navigate("/reserve")}>Reserve a Table</button>}
            <button className="btn-outline-lg" onClick={() => navigate("/login")}>Staff Login</button>
          </div>
        </div>
      </section>

    </div>
  );
}

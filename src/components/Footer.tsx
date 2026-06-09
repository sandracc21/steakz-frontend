import { useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/staff")) return null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <button className="footer-logo" onClick={() => navigate("/")}>
            🥩 Steakz
          </button>
          <p className="footer-tagline">
            Premium British steakhouse across five iconic UK locations. Hand-selected, dry-aged beef. Expertly crafted.
          </p>
          <div className="footer-socials">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="X / Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Explore</h4>
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/menu")}>Menu</button>
          <button onClick={() => navigate("/order")}>Order Online</button>
          <button onClick={() => navigate("/login")}>My Account</button>
        </div>

        <div className="footer-links-group">
          <h4>Locations</h4>
          <span>Manchester — Northern Quarter</span>
          <span>London</span>
          <span>Edinburgh — Old Town</span>
          <span>Birmingham — Jewellery Quarter</span>
          <span>Bristol — Clifton Village</span>
        </div>

        <div className="footer-links-group">
          <h4>Contact</h4>
          <span>hello@steakz.co.uk</span>
          <span>+44 161 000 0000</span>
          <span>Mon–Thu: 12:00–22:30</span>
          <span>Fri–Sat: 12:00–23:30</span>
          <span>Sunday: 12:00–21:00</span>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Steakz UK Ltd. All rights reserved.</span>
        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Allergen Information</span>
        </div>
      </div>
    </footer>
  );
}

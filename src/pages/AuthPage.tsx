import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../types";

const BRANCH_KEYS = ["manchester", "london", "edinburgh", "birmingham", "bristol"] as const;
type BranchKey = typeof BRANCH_KEYS[number];

const BRANCH_LABELS: Record<BranchKey, string> = {
  manchester: "Manchester",
  london:     "London",
  edinburgh:  "Edinburgh",
  birmingham: "Birmingham",
  bristol:    "Bristol",
};

const BRANCH_ROLE_OPTIONS: { role: Role; label: string; emailPrefix: string }[] = [
  { role: 2, label: "Branch Manager", emailPrefix: "manager"  },
  { role: 3, label: "Chef",           emailPrefix: "chef"     },
  { role: 4, label: "Cashier",        emailPrefix: "cashier"  },
  { role: 5, label: "Waiter",         emailPrefix: "waiter"   },
];

const GLOBAL_ROLE_OPTIONS: { role: Role; label: string; email: string }[] = [
  { role: 7, label: "Admin",      email: "admin@steakz.co.uk" },
  { role: 1, label: "HQ Manager", email: "hq@steakz.co.uk"    },
];

type AuthMode = "staff-login" | "customer-login" | "customer-signup";

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("customer-login");

  // ── Customer login state
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");

  // ── Customer signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  // ── Staff login state
  const [selectedLocation, setSelectedLocation] = useState<BranchKey | "global" | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLocationSelect = (loc: BranchKey | "global") => {
    setSelectedLocation(loc);
    setSelectedRole(null);
    setStaffEmail("");
    setStaffPassword("");
    setError(null);
  };

  const handleRoleSelect = (role: Role, roleEmail: string) => {
    setSelectedRole(role);
    setStaffEmail(roleEmail);
    setStaffPassword("");
    setError(null);
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(custEmail, custPassword);
      navigate("/my-orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally { setLoading(false); }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (signupPassword !== signupConfirm) { setError("Passwords do not match"); return; }
    if (signupPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, role: 6 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string }).message || "Registration failed");
      setSignupSuccess(true);
      setTimeout(() => { setMode("customer-login"); setSignupSuccess(false); }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(staffEmail, staffPassword);
      navigate("/staff");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page-split">
      {/* Left — food photo */}
      <div className="auth-photo-side">
        <img
          src="https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80"
          alt="Steakz"
        />
        <div className="auth-photo-overlay" />
        <div className="auth-photo-content">
          <h2>Welcome to Steakz</h2>
          <p>Premium British steakhouse across five iconic UK locations</p>
          <div className="auth-photo-badges">
            <span>🏙️ Manchester</span>
            <span>🎭 London</span>
            <span>🏰 Edinburgh</span>
            <span>💎 Birmingham</span>
            <span>🌉 Bristol</span>
          </div>
        </div>
      </div>

      {/* Right — form side */}
      <div className="auth-form-side">
        <button className="back-link" onClick={() => navigate("/")}>← Back to home</button>

        <div className="auth-tabs">
          <button className={mode === "customer-login"  ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("customer-login");  setError(null); }}>Login</button>
          <button className={mode === "customer-signup" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("customer-signup"); setError(null); }}>Sign Up</button>
          <button className={mode === "staff-login"     ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("staff-login");     setError(null); }}>Staff</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* ── Customer Login ── */}
        {mode === "customer-login" && (
          <div className="auth-card">
            <h2>Welcome back</h2>
            <p className="auth-sub">Log in to track your orders</p>
            {signupSuccess && <div className="auth-success">Account created! Please log in.</div>}
            <form onSubmit={handleCustomerLogin} className="auth-form">
              <label>Email<input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} required placeholder="you@example.com" /></label>
              <label>Password<input type="password" value={custPassword} onChange={e => setCustPassword(e.target.value)} required placeholder="••••••••" /></label>
              <button className="btn-primary-full" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
            </form>
            <p className="auth-switch">No account? <span onClick={() => setMode("customer-signup")}>Create one →</span></p>
          </div>
        )}

        {/* ── Customer Signup ── */}
        {mode === "customer-signup" && (
          <div className="auth-card">
            <h2>Create your account</h2>
            <p className="auth-sub">Order online and track your meals</p>
            <form onSubmit={handleCustomerSignup} className="auth-form">
              <label>Full Name<input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required placeholder="Your name" /></label>
              <label>Email<input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="you@example.com" /></label>
              <label>Password<input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required placeholder="Min 6 characters" /></label>
              <label>Confirm Password<input type="password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} required placeholder="Repeat password" /></label>
              <button className="btn-primary-full" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
            </form>
            <p className="auth-switch">Already have an account? <span onClick={() => setMode("customer-login")}>Sign in →</span></p>
          </div>
        )}

        {/* ── Staff Login ── */}
        {mode === "staff-login" && (
          <div className="auth-card staff-login-card">
            <h2>Staff Sign In</h2>
            <p className="auth-sub">Secure staff portal</p>
            <form onSubmit={handleStaffLogin} className="auth-form">
              <div>
                <p className="field-label">Step 1 — Select location</p>
                <div className="role-grid">
                  <button
                    type="button"
                    className={selectedLocation === "global" ? "role-tile selected" : "role-tile"}
                    onClick={() => handleLocationSelect("global")}
                  >
                    <strong>HQ / Global</strong>
                    <span>Admin &amp; HQ Manager</span>
                  </button>
                  {BRANCH_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={selectedLocation === key ? "role-tile selected" : "role-tile"}
                      onClick={() => handleLocationSelect(key)}
                    >
                      <strong>{BRANCH_LABELS[key]}</strong>
                      <span>Branch staff</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedLocation && (
                <div>
                  <p className="field-label">Step 2 — Select your role</p>
                  <div className="role-grid">
                    {selectedLocation === "global"
                      ? GLOBAL_ROLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.role}
                            type="button"
                            className={selectedRole === opt.role ? "role-tile selected" : "role-tile"}
                            onClick={() => handleRoleSelect(opt.role, opt.email)}
                          >
                            <strong>{opt.label}</strong>
                          </button>
                        ))
                      : BRANCH_ROLE_OPTIONS.map((opt) => {
                          const roleEmail = `${opt.emailPrefix}.${selectedLocation}@steakz.co.uk`;
                          return (
                            <button
                              key={opt.role}
                              type="button"
                              className={selectedRole === opt.role ? "role-tile selected" : "role-tile"}
                              onClick={() => handleRoleSelect(opt.role, roleEmail)}
                            >
                              <strong>{opt.label}</strong>
                            </button>
                          );
                        })
                    }
                  </div>
                </div>
              )}

              {selectedRole !== null && (
                <>
                  <label>
                    Email
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="you@steakz.co.uk"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <p style={{ color: "#b3b3b3", fontSize: "0.78rem", marginTop: -8 }}>
                    Email auto-filled — enter your password to continue
                  </p>
                  <label>
                    Password
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <button className="btn-primary-full" type="submit" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </>
              )}

              {!selectedLocation && (
                <p style={{ color: "#b3b3b3", fontSize: "0.85rem", textAlign: "center" }}>
                  Select a location above to continue
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

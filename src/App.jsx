// src/App.jsx
// Uses a Layout component with <Outlet> — the correct React Router v6 pattern.
// Google Fonts must be added to your index.html <head> (see note below).
//
// ── ADD THIS TO YOUR index.html <head> ───────────────────────────────────
// <link rel="preconnect" href="https://fonts.googleapis.com" />
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
// <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />
// ─────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AuthProvider   from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

import Home          from "./pages/Home";
import Shop          from "./pages/Shop";
import Cart          from "./pages/Cart";
import Checkout      from "./pages/Checkout";
import OrderSuccess  from "./pages/OrderSuccess";
import Orders        from "./pages/Orders";
import About         from "./pages/About";
import Contact       from "./pages/Contact";
import Admin         from "./pages/Admin";
import Dashboard     from "./pages/Dashboard";
import Login         from "./pages/auth/Login";
import AuthCallback  from "./pages/auth/AuthCallback";
import ResetPassword from "./pages/auth/Reset-Password";
import Test          from "./pages/Test";

/* ── Shared layout for all public pages ── */
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Auth — full screen, no Navbar/Footer */}
          <Route path="/login"               element={<Login />} />
          <Route path="/auth/callback"       element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Admin — own full-screen layout */}
          <Route path="/admin" element={<Admin />} />

          {/* All public + protected pages inside the shared layout */}
          <Route element={<PublicLayout />}>
            <Route path="/"              element={<Home />} />
            <Route path="/shop"          element={<Shop />} />
            <Route path="/cart"          element={<Cart />} />
            <Route path="/checkout"      element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders"        element={<Orders />} />
            <Route path="/about"         element={<About />} />
            <Route path="/contact"       element={<Contact />} />
            <Route path="/test"          element={<Test />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
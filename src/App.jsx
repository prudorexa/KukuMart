import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

import Home from "./pages/Home";
// Uncomment each import as you build the pages:
import Shop from "./pages/Shop";
// import About   from "./pages/About";
// import Contact from "./pages/Contact";
// import Cart    from "./pages/Cart";
// import Orders  from "./pages/Orders";
// import Admin   from "./pages/Admin";

// ── Temporary placeholder until each page is built ──
function Placeholder({ title }) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">🐔</div>
      <h1 className="text-3xl font-bold text-[#C8290A]">{title}</h1>
      <p className="text-gray-400 text-sm">This page is coming soon — we're building it!</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Google Fonts — DM Sans for clean, professional look */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="flex flex-col min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/shop"    element={<Shop />} />
            <Route path="/about"   element={<Placeholder title="About us" />} />
            <Route path="/contact" element={<Placeholder title="Contact us" />} />
            <Route path="/cart"    element={<Placeholder title="Cart" />} />
            <Route path="/orders"  element={<Placeholder title="My orders" />} />
            <Route path="/admin"   element={<Placeholder title="Admin panel" />} />
          </Routes>
        </main>

        <Footer />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}
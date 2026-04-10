import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Home           from "./pages/Home";
import Shop           from "./pages/Shop";
import Cart           from "./pages/Cart";
import Checkout       from "./pages/Checkout";
import OrderSuccess   from "./pages/OrderSuccess";
import Admin          from "./pages/Admin";
// import About   from "./pages/About";
// import Contact from "./pages/Contact";
// import Orders  from "./pages/Orders";

function Placeholder({ title }) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">🐔</div>
      <h1 className="text-3xl font-bold text-[#C8290A]">{title}</h1>
      <p className="text-gray-400 text-sm">This page is coming soon — we're building it!</p>
    </main>
  );
}

// Admin uses its own full-screen layout (no Navbar/Footer)
function AdminWrapper() {
  return <Admin />;
}

export default function App() {
  return (
    <BrowserRouter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Routes>
        {/* Admin — full screen, no public navbar/footer */}
        <Route path="/admin" element={<AdminWrapper />} />

        {/* All public pages — wrapped in Navbar + Footer */}
        <Route
          path="*"
          element={
            <div className="flex flex-col min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/"              element={<Home />} />
                  <Route path="/shop"          element={<Shop />} />
                  <Route path="/cart"          element={<Cart />} />
                  <Route path="/checkout"      element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/about"         element={<Placeholder title="About us" />} />
                  <Route path="/contact"       element={<Placeholder title="Contact us" />} />
                  <Route path="/orders"        element={<Placeholder title="My orders" />} />
                </Routes>
              </main>
              <Footer />
              <WhatsAppButton />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Home           from "./pages/Home";
import Shop           from "./pages/Shop";
import Cart           from "./pages/Cart";
import Checkout       from "./pages/Checkout";
import OrderSuccess   from "./pages/OrderSuccess";
import Orders         from "./pages/Orders";
import About          from "./pages/About";
import Contact        from "./pages/Contact";
import Admin          from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <Routes>
        {/* Admin — full-screen, no public nav/footer */}
        <Route path="/admin" element={<Admin />} />

        {/* All public pages — wrapped in Navbar + Footer */}
        <Route
          path="*"
          element={
            <div
              className="flex flex-col min-h-screen"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/"              element={<Home />} />
                  <Route path="/shop"          element={<Shop />} />
                  <Route path="/cart"          element={<Cart />} />
                  <Route path="/checkout"      element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/orders"        element={<Orders />} />
                  <Route path="/about"         element={<About />} />
                  <Route path="/contact"       element={<Contact />} />
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
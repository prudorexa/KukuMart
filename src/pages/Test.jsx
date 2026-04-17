import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export default function TestPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState({});

  useEffect(() => {
    (async () => {
      // Fetch products with all fields
      const { data: prods, error: prodError } = await supabase
        .from("products")
        .select("*");
      
      if (prodError) {
        console.error("❌ Product fetch error:", prodError);
      } else {
        console.log("✓ Fetched", prods?.length, "products");
        if (prods && prods.length > 0) {
          console.log("First product:", prods[0]);
          console.log("Image URLs sample:", prods.slice(0, 3).map(p => ({ id: p.id, name: p.name, image_url: p.image_url })));
        }
      }
      setProducts(prods || []);

      // Count orders
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      setStats({ orders: orderCount, products: productCount });
    })();
  }, []);

  // Track image loading status
  const handleImageLoad = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: "loaded" }));
  };

  const handleImageError = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: "failed" }));
  };

  async function createTestAccount() {
    setIsCreatingAccount(true);
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = "TestPassword123";

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { full_name: "Test User" } }
    });

    if (signupError) {
      alert("Error creating account: " + signupError.message);
      setIsCreatingAccount(false);
      return;
    }

    if (signupData?.user) {
      await supabase.from("profiles").upsert([{
        id: signupData.user.id,
        full_name: "Test User",
        email: testEmail,
        loyalty_points: 50,
        created_at: new Date().toISOString(),
      }]);

      const { error: signinError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (!signinError) {
        alert(`✓ Account created!\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nRefresh page to see dashboard.`);
        window.location.reload();
      }
    }

    setIsCreatingAccount(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">🧪 KukuMart Diagnostics</h1>

      {/* Status section */}
      <div className="bg-white border-2 rounded-xl p-6 space-y-3">
        <h2 className="text-xl font-bold">Status</h2>
        <p className={`text-lg ${user ? "text-green-600" : "text-red-600"}`}>
          {user ? `✓ Logged in as ${user.email}` : "✗ Not logged in"}
        </p>
        <p className="text-gray-600">
          Database: {stats.orders !== undefined ? `✓ ${stats.products} products, ${stats.orders} orders` : "Loading..."}
        </p>
      </div>

      {/* Products section */}
      <div className="bg-white border-2 rounded-xl p-6 space-y-3">
        <h2 className="text-xl font-bold">Sample Products ({products.length})</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {products.slice(0, 10).map(p => (
            <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{p.name}</span>
                <span className="text-[#C8290A]">KSh {p.price?.toLocaleString() || "N/A"}</span>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                <p className="truncate">Image URL: {p.image_url || "❌ NULL"}</p>
                <p>In stock: {p.in_stock ? "✓" : "✗"}</p>
              </div>
              {p.image_url && (
                <div className="mt-2">
                  <img 
                    src={p.image_url} 
                    alt={p.name}
                    className="w-full h-32 object-cover rounded-lg bg-gray-100"
                    onLoad={() => handleImageLoad(p.id)}
                    onError={() => handleImageError(p.id)}
                  />
                  <p className="text-xs mt-1">
                    Status: {imageLoadStatus[p.id] === "loaded" ? "✅ Loaded" : imageLoadStatus[p.id] === "failed" ? "❌ Failed to load" : "⏳ Loading..."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auth section */}
      <div className="bg-white border-2 rounded-xl p-6 space-y-3">
        <h2 className="text-xl font-bold">Authentication</h2>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600"
          >
            Sign Out
          </button>
        ) : (
          <>
            <p className="text-gray-600 mb-3">No account? Create one to test the dashboard:</p>
            <button
              onClick={createTestAccount}
              disabled={isCreatingAccount}
              className="w-full bg-[#C8290A] text-white py-3 rounded-lg font-bold hover:bg-[#a82008] disabled:opacity-50"
            >
              {isCreatingAccount ? "Creating account..." : "Create Test Account"}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <a href="/shop" className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-center font-bold hover:bg-blue-600">
          → Shop Page
        </a>
        {user && (
          <a href="/dashboard" className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-center font-bold hover:bg-purple-600">
            → Dashboard
          </a>
        )}
      </div>
    </div>
  );
}

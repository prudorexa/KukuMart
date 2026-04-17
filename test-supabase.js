import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "✓ Found" : "✗ Missing");
console.log("Supabase Key:", supabaseKey ? "✓ Found" : "✗ Missing");

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  (async () => {
    console.log("\n--- Testing Supabase Connection ---");
    
    // Test products table
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("count", { count: "exact" });
    
    if (productsError) {
      console.log("❌ Products table error:", productsError.message);
    } else {
      console.log("✓ Products table exists");
    }

    // Test orders table
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("count", { count: "exact" });
    
    if (ordersError) {
      console.log("❌ Orders table error:", ordersError.message);
    } else {
      console.log("✓ Orders table exists");
    }

    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("count", { count: "exact" });
    
    if (profilesError) {
      console.log("❌ Profiles table error:", profilesError.message);
    } else {
      console.log("✓ Profiles table exists");
    }

    // Get sample products with images
    const { data: sampleProducts, error: sampleError } = await supabase
      .from("products")
      .select("id, name, image_url")
      .limit(3);

    if (!sampleError && sampleProducts) {
      console.log("\n--- Sample Products ---");
      sampleProducts.forEach(p => {
        console.log(`- ${p.name}: ${p.image_url ? "✓ Has image URL" : "✗ No image URL"}`);
      });
    }
  })();
}

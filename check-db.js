import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iisawglrlpdurtvuhgrj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2F3Z2xybHBkdXJ0dnVoZ3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgzMjYsImV4cCI6MjA5MTI1NDMyNn0.tYNXB7dZpq7ZubSXGmzV4uNHEmZE7HtYKObrW-UNw14";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("\n=== SUPABASE DATABASE CHECK ===\n");

  const tables = ["products", "orders", "profiles", "reviews"];

  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        console.log(`  Code: ${error.code}`);
      } else {
        console.log(`  ✓ Table exists - ${count} rows found`);
        
        // Get sample data
        const { data: sample } = await supabase
          .from(table)
          .select("*")
          .limit(1);
        
        if (sample && sample.length > 0) {
          console.log(`  Sample columns: ${Object.keys(sample[0]).join(", ")}`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
  }

  console.log("\n=== CHECKING AUTHENTICATION ===\n");
  
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`);
    } else if (authData.session) {
      console.log(`✓ Session exists - User: ${authData.session.user.email}`);
    } else {
      console.log(`⚠️ No active session (anonymous mode)`);
    }
  } catch (err) {
    console.log(`❌ Exception checking auth: ${err.message}`);
  }

  console.log("\n=== SAMPLE QUERIES ===\n");

  // Try to fetch a product
  console.log("Fetching products...");
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, image_url")
    .limit(3);

  if (productsError) {
    console.log(`❌ Products error: ${productsError.message}`);
  } else if (products) {
    console.log(`✓ Got ${products.length} products:`);
    products.forEach(p => {
      console.log(`  - ${p.name} (image: ${p.image_url ? "yes" : "no"})`);
    });
  }

  console.log("\nDone!");
}

checkDatabase().catch(console.error);

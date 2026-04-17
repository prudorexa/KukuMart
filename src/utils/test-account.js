export async function createTestAccount() {
  const supabaseUrl = "https://iisawglrlpdurtvuhgrj.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2F3Z2xybHBkdXJ0dnVoZ3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgzMjYsImV4cCI6MjA5MTI1NDMyNn0.tYNXB7dZpq7ZubSXGmzV4uNHEmZE7HtYKObrW-UNw14";

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "TestPassword123";

  console.log("\n=== CREATING TEST ACCOUNT ===");
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);

  // Sign up
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: "Test User" }
    }
  });

  if (signupError) {
    console.error("❌ Signup error:", signupError.message);
    return;
  }

  console.log("✓ Account created");

  // Create profile
  if (signupData?.user) {
    const { error: profileError } = await supabase.from("profiles").upsert([{
      id: signupData.user.id,
      full_name: "Test User",
      email: testEmail,
      loyalty_points: 50,
      created_at: new Date().toISOString(),
    }]);

    if (profileError) {
      console.error("⚠️ Profile creation warning:", profileError.message);
    } else {
      console.log("✓ Profile created");
    }
  }

  // Try to sign in
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signinError) {
    console.error("❌ Sign in error:", signinError.message);
    return;
  }

  console.log("✓ Signed in successfully!");
  console.log("\n📝 Account details:");
  console.log(`- Email: ${testEmail}`);
  console.log(`- Password: ${testPassword}`);
  console.log(`- User ID: ${signinData.user.id}`);
  console.log("\n⏯️ Refresh the page to see your dashboard!\n");
}

// Auto-run if in browser
if (typeof window !== "undefined") {
  window.createTestAccount = createTestAccount;
  console.log("✓ createTestAccount() is available in console");
  console.log("Run: await createTestAccount()");
}

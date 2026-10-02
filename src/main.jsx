// src/main.jsx
// StrictMode is intentionally off (double-invoked effects break Supabase auth locks).
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { supabaseConfigError } from "./lib/supabase";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("App crashed:", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: "48px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: "#C8290A" }}>Something went wrong</h2>
        <pre style={{ background: "#111827", color: "#86efac", padding: 16, borderRadius: 12, whiteSpace: "pre-wrap", fontSize: 12 }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
        <button onClick={() => location.reload()} style={{ padding: "8px 16px", borderRadius: 8 }}>Reload</button>
      </div>
    );
  }
}

function ConfigError({ message }) {
  return (
    <div style={{ maxWidth: 640, margin: "48px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ color: "#C8290A" }}>KukuMart isn't configured</h2>
      <p>{message}</p>
      <pre style={{ background: "#111827", color: "#86efac", padding: 16, borderRadius: 12, fontSize: 12 }}>
{`VITE_SUPABASE_URL=https://iisawglrlpdurtvuhgrj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2F3Z2xybHBkdXJ0dnVoZ3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgzMjYsImV4cCI6MjA5MTI1NDMyNn0.tYNXB7dZpq7ZubSXGmzV4uNHEmZE7HtYKObrW-UNw14`}
      </pre>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  supabaseConfigError ? <ConfigError message={supabaseConfigError} /> : (
    <ErrorBoundary><App /></ErrorBoundary>
  )
);
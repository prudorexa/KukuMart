// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )


// src/main.jsx
// StrictMode is intentionally removed.
// React StrictMode double-invokes effects in development which causes:
//   1. Supabase auth subscription to be set up then immediately torn down
//      → authStore.initialized never becomes true → dashboard spins forever
//   2. Supabase fetch to be started then aborted by the cleanup
//      → "AbortError: Lock broken by another request with the 'steal' option"
//      → Shop page shows "Couldn't load products"
//
// These are all safe to remove for production. Re-add StrictMode only if
// you specifically need to test for deprecated React patterns.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
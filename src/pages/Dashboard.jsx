// src/pages/Dashboard.jsx
// Customer dashboard shell — tabbed layout.
// URL param ?tab=orders|reviews|loyalty|profile lets deep-linking work.
// All data fetching happens inside each tab component.

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore, selectDisplayName, selectInitial } from "../store/authStore";
import DashOverview from "./dashboard/DashOverview";
import DashOrders   from "./dashboard/DashOrders";
import DashReviews  from "./dashboard/DashReviews";
import DashLoyalty  from "./dashboard/DashLoyalty";
import DashProfile  from "./dashboard/DashProfile";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: "orders",
    label: "My orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    id: "loyalty",
    label: "Loyalty",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab]       = useState(searchParams.get("tab") ?? "overview");

  const displayName = useAuthStore(selectDisplayName);
  const initial     = useAuthStore(selectInitial);
  const profile     = useAuthStore((s) => s.profile);

  // Sync tab with URL
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && TABS.find(t => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  function changeTab(id) {
    setActiveTab(id);
    setSearchParams(id === "overview" ? {} : { tab: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const points = profile?.loyalty_points ?? 0;
  const tier   = points >= 1000 ? "Platinum" : points >= 500 ? "Gold" : points >= 200 ? "Silver" : "Bronze";
  const tierIcon = { Bronze:"🥉", Silver:"🥈", Gold:"🥇", Platinum:"💎" }[tier];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-[#C8290A] transition-colors">Home</a>
            <span>/</span>
            <span className="text-gray-700 font-medium">My dashboard</span>
          </nav>

          {/* User header */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#C8290A] flex items-center justify-center text-white text-lg font-bold shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={initial} className="w-full h-full rounded-full object-cover"/>
              ) : initial}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  {tierIcon} {tier} member
                </span>
                <span className="text-xs text-gray-400">{points.toLocaleString()} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 gap-1 pb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-150 ${
                  activeTab === tab.id
                    ? "border-[#C8290A] text-[#C8290A]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className={activeTab === tab.id ? "text-[#C8290A]" : "text-gray-400"}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "overview" && <DashOverview onTabChange={changeTab} />}
        {activeTab === "orders"   && <DashOrders />}
        {activeTab === "reviews"  && <DashReviews />}
        {activeTab === "loyalty"  && <DashLoyalty />}
        {activeTab === "profile"  && <DashProfile />}
      </div>
    </div>
  );
}
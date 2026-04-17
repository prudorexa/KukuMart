// src/pages/dashboard/DashOrders.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const STATUS_LABEL = {
  pending:"Order received", confirmed:"Confirmed", preparing:"Being prepared",
  out_for_delivery:"Out for delivery", delivered:"Delivered", cancelled:"Cancelled",
};
const STATUS_COLOR = {
  pending:"bg-amber-100 text-amber-800", confirmed:"bg-blue-100 text-blue-800",
  preparing:"bg-purple-100 text-purple-800", out_for_delivery:"bg-orange-100 text-orange-800",
  delivered:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700",
};
const STAGE_PROGRESS = { pending:20, confirmed:40, preparing:60, out_for_delivery:80, delivered:100, cancelled:0 };
const CAT_EMOJI = { broiler_live:"🐓", kienyeji_live:"🐔", slaughtered:"🥩", fried_pieces:"🍗", fried_whole:"🍖" };
const PAYMENT_LABELS = { mpesa:"M-Pesa", card:"Card / Bank", cash:"Cash on delivery" };

function formatDate(iso) {
  return new Date(iso).toLocaleString("en",{ day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function OrderDetail({ order, onClose, onReorder }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const progress = STAGE_PROGRESS[order.status] ?? 0;
  const WA_URL = `https://wa.me/254700000000?text=${encodeURIComponent(`Hello KukuMart! I'm following up on order #${order.id.slice(0,8).toUpperCase()}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
          <div>
            <p className="font-bold text-gray-900 text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Progress */}
          {order.status !== "cancelled" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
                <span className="text-xs text-gray-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#C8290A] rounded-full transition-all duration-700" style={{ width:`${progress}%` }} />
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b border-gray-100">Items</p>
            {items.map((item,i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-lg">{CAT_EMOJI[item.category]??"🐔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">× {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">KSh {(item.price*item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Delivery</p>
              <p className="text-xs text-gray-900 font-medium word-break">{order.location}</p>
              {order.delivery_zone && <p className="text-xs text-gray-400 mt-0.5">{order.delivery_zone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Payment</p>
              <p className="text-xs text-gray-900 font-medium">{PAYMENT_LABELS[order.payment_type]??order.payment_type}</p>
              <p className={`text-xs mt-0.5 font-medium ${order.paid?"text-green-600":"text-amber-600"}`}>
                {order.paid ? "✅ Paid" : "⏳ Pending"}
              </p>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">KSh {order.subtotal?.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className="font-medium">KSh {order.delivery_fee?.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5"><span>Total</span><span className="text-[#C8290A]">KSh {order.total?.toLocaleString()}</span></div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#20b958] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Ask about this order
            </a>
            {order.status === "delivered" && items.length > 0 && (
              <button onClick={() => { onReorder(order); onClose(); }}
                className="flex items-center justify-center gap-2 bg-[#C8290A] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#a82008] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Order again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashOrders() {
  const user      = useAuthStore((s) => s.user);
  const profile   = useAuthStore((s) => s.profile);
  const navigate  = useNavigate();
  const addItem   = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [selected,setSelected]= useState(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const phone = user.phone ?? profile?.phone ?? "";
      const variants = [];
      if (phone) {
        const p = phone.replace(/[\s-]/g,"");
        variants.push(p);
        if (p.startsWith("+254")) variants.push("0"+p.slice(4),"254"+p.slice(1));
        else if (p.startsWith("254")) variants.push("+"+p,"0"+p.slice(3));
        else if (p.startsWith("0")) variants.push("254"+p.slice(1),"+254"+p.slice(1));
      }
      const results = await Promise.all([
        variants.length ? supabase.from("orders").select("*").in("phone",variants).order("created_at",{ascending:false}) : Promise.resolve({data:[]}),
        supabase.from("orders").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      ]);
      const seen = new Set();
      const all = results.flatMap(r=>r.data??[]).filter(o=>{ if(seen.has(o.id)) return false; seen.add(o.id); return true; });
      all.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      setOrders(all);
      setLoading(false);
    }
    load();
  }, [user, profile]);

  function handleReorder(order) {
    clearCart();
    (Array.isArray(order.items)?order.items:[]).forEach(item=>addItem(item));
    navigate("/cart");
  }

  const FILTERS = ["all","active","delivered","cancelled"];
  const filtered = filter === "all" ? orders
    : filter === "active" ? orders.filter(o=>!["delivered","cancelled"].includes(o.status))
    : orders.filter(o=>o.status===filter);

  if (loading) return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[0,1,2].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl"/>)}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
              filter===f ? "bg-[#C8290A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f==="all" ? `All (${orders.length})` : f==="active" ? `Active (${orders.filter(o=>!["delivered","cancelled"].includes(o.status)).length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${orders.filter(o=>o.status===f).length})`}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-bold text-gray-900 mb-1">No orders here yet</p>
          <p className="text-xs text-gray-500 mb-4">{filter==="all" ? "Your orders will appear here once you place one." : `No ${filter} orders.`}</p>
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline">
            Browse the shop →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(order => {
            const items = Array.isArray(order.items)?order.items:[];
            const progress = STAGE_PROGRESS[order.status]??0;
            const isActive = !["delivered","cancelled"].includes(order.status);
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-600">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">KSh {order.total?.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {items.slice(0,3).map((item,i) => (
                        <span key={i} className="text-base">{CAT_EMOJI[item.category]??"🐔"}</span>
                      ))}
                      {items.length>3 && <span className="text-xs text-gray-400 self-center">+{items.length-3}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {items.map(i=>`${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>

                  {/* Progress bar for active */}
                  {isActive && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-[#C8290A] rounded-full transition-all duration-700" style={{ width:`${progress}%` }} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setSelected(order)}
                      className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      View details
                    </button>
                    {order.status==="delivered" && (
                      <button onClick={() => handleReorder(order)}
                        className="flex-1 py-2 text-xs font-semibold text-white bg-[#C8290A] rounded-xl hover:bg-[#a82008] transition-colors">
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}
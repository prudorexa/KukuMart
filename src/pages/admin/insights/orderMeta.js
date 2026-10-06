// Shared labels/colours for order status and payment — used by the Orders and Insights tabs.

export const STATUS_OPTIONS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export const STATUS_STYLES = {
  pending:          { bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500",  label: "Pending" },
  confirmed:        { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500",   label: "Confirmed" },
  preparing:        { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500", label: "Preparing" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", label: "Out for delivery" },
  delivered:        { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  label: "Delivered" },
  cancelled:        { bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-400",    label: "Cancelled" },
};

export const PAYMENT_LABELS = { mpesa: "M-Pesa", card: "Card", cash: "Cash on delivery" };

export const ksh = (n) => `KSh ${Math.round(Number(n) || 0).toLocaleString("en-KE")}`;

// src/components/StarRating.jsx
// Two modes:
//   <StarRating value={4} />                         → read-only stars
//   <StarRating value={v} onChange={setV} label="…" />→ tappable 1–5 stars (keyboard accessible)

const STAR = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function Star({ filled, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      className={filled ? "text-amber-400" : "text-gray-200"}>
      <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function StarRating({ value = 0, onChange, size = 20, label, showWord = false }) {
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} filled={n <= value} size={size} />)}
      </span>
    );
  }

  function onKeyDown(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, (value || 0) + 1)); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, (value || 2) - 1)); }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n === value ? 0 : n)}
            className="p-0.5 rounded-lg transition-transform active:scale-90 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8290A]/40"
          >
            <Star filled={n <= value} size={size} />
          </button>
        ))}
      </div>
      {showWord && value > 0 && <span className="text-sm font-semibold text-gray-700">{WORDS[value]}</span>}
    </div>
  );
}

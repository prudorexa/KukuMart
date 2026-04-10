// WhatsAppButton.jsx
// Drop <WhatsAppButton /> into App.jsx (outside <Routes>) — it floats on every page.

const WA_NUMBER = "254720461267"; // ← Replace with real Safaricom number
const WA_MESSAGE = encodeURIComponent(
  "Hello KukuMart! 👋 I'd like to place an order.\n\nMy name is: ___\nI'm in (area): ___\nI'd like to order: ___"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export default function WhatsAppButton() {
  return (
    <>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
        className="wa-btn"
      >
        {/* WhatsApp icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        <span className="wa-label">Order on WhatsApp</span>
      </a>

      <style>{`
        .wa-btn {
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #25D366;
          color: white;
          padding: 13px 18px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(37,211,102,0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wa-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(37,211,102,0.5);
        }
        .wa-btn:active {
          transform: translateY(0);
        }
        /* On small screens: icon only */
        @media (max-width: 480px) {
          .wa-btn {
            padding: 14px;
            border-radius: 50%;
          }
          .wa-label { display: none; }
        }
      `}</style>
    </>
  );
}
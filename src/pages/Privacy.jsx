// src/pages/Privacy.jsx
// Privacy policy — required by Google Play and by Kenya's Data Protection Act, 2019.
// Review the highlighted facts below against how the business really operates.

import { useEffect } from "react";
import { Link } from "react-router-dom";

const UPDATED   = "5 October 2026";
const EMAIL     = "orders@kukumart.co.ke";
const PHONE     = "+254 720 461 267";

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy — KukuMart";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-[#C8290A] mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {UPDATED}</p>

        <Section title="1. Who we are">
          <p>
            KukuMart ("we", "us") sells fresh chicken for delivery in Nairobi, Kenya, through this
            website and app. We are the data controller for the personal information described below
            and handle it in line with the Kenya Data Protection Act, 2019.
          </p>
          <p>Contact: <a className="text-[#C8290A] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> · {PHONE}</p>
        </Section>

        <Section title="2. What we collect">
          <Bullets items={[
            "Account details: your name, email address, phone number and password (stored securely by our authentication provider — we never see or store your plain-text password).",
            "Sign-in with Google: your name and email address from your Google account, if you choose that option.",
            "Order details: the items you order, quantities, order notes, order status and history.",
            "Email address at checkout (optional): used only to send your receipt, order progress updates and a link to track and rate your order.",
            "Ratings and comments: if you rate an order, we store your rating, any comment you write, your first name and your delivery area. These may be shown to other customers and staff. We never show your phone number or email.",
            "Delivery location: the address you type or pick on the map, and its map coordinates, so we can work out the delivery zone and fee.",
            "Phone number for payment and delivery: used to coordinate delivery and for M-Pesa payment requests.",
            "Loyalty information: your points balance and loyalty tier.",
            "Technical data: basic device and browser information and error logs needed to keep the service running. If you install the app, a small cache of the site is stored on your device so it loads faster.",
          ]} />
        </Section>

        <Section title="3. How we use it">
          <Bullets items={[
            "To create and manage your account and let you sign in.",
            "To take, prepare, deliver and confirm your orders, and to contact you about them (call, SMS, WhatsApp, email).",
            "To process payments (M-Pesa or cash on delivery) and keep records of sales.",
            "To run our loyalty rewards.",
            "To keep the service secure, prevent fraud and fix problems.",
            "To meet our legal and tax record-keeping obligations.",
          ]} />
          <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>
        </Section>

        <Section title="4. Who we share it with">
          <p>We only share what is needed to run the service, with these providers:</p>
          <Bullets items={[
            "Supabase — hosts our database and handles sign-in and sending account emails.",
            "Brevo — sends our order emails (your email address, name and order summary).",
            "Vercel — hosts the website.",
            "Google — Google Maps/Places for addresses and delivery distance, and Google Sign-In if you choose it.",
            "Safaricom M-Pesa — to request and confirm mobile payments.",
            "Our delivery riders — your name, phone number and delivery address, only for the order being delivered.",
            "WhatsApp — only if you choose to message us through the WhatsApp button.",
          ]} />
          <p>We may also disclose information if required by law or by a court or regulator in Kenya.</p>
        </Section>

        <Section title="5. How long we keep it">
          <p>
            We keep account and order information while your account is active and afterwards for as long
            as needed for the purposes above, including tax and accounting records. You can ask us to delete
            your account at any time (see section 7); we will remove or anonymise your data unless the law
            requires us to keep some of it.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            Data is sent over encrypted connections (HTTPS) and access to the database is restricted to
            signed-in users for their own records and to authorised KukuMart staff. No system is perfectly
            secure, so please use a strong, unique password.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>Under the Data Protection Act you have the right to:</p>
          <Bullets items={[
            "know what personal data we hold about you and get a copy of it;",
            "ask us to correct data that is wrong or out of date;",
            "ask us to delete your data, or to stop processing it, in the cases the law allows;",
            "object to how we use your data, and withdraw consent you gave us.",
          ]} />
          <p>
            To use any of these rights, email <a className="text-[#C8290A] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            If you are unhappy with our response, you can complain to the Office of the Data Protection
            Commissioner of Kenya (odpc.go.ke).
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            KukuMart is not directed at children under 18, and we do not knowingly collect their personal
            information. If you believe a child has given us data, contact us and we will delete it.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            If we change this policy we will update the date at the top. If a change is significant we will
            tell you in the app or by email.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <Link to="/" className="text-[#C8290A] font-semibold hover:underline">← Back to home</Link>
          <Link to="/contact" className="text-gray-500 hover:text-gray-700">Contact us</Link>
        </div>
      </div>
    </div>
  );
}

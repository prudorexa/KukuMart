// src/pages/admin/AdminProducts.jsx
// Full product management — list all products, add new ones,
// edit existing, upload photos to Supabase Storage, toggle stock.

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";

/* ── Constants ── */
const CATEGORIES = [
  { value: "broiler_live",  label: "Live Broiler" },
  { value: "kienyeji_live", label: "Live Kienyeji" },
  { value: "slaughtered",   label: "Slaughtered" },
  { value: "fried_pieces",  label: "Fried Pieces" },
  { value: "fried_whole",   label: "Whole Fried" },
];

const CAT_EMOJI = {
  broiler_live: "🐓", kienyeji_live: "🐔", slaughtered: "🥩",
  fried_pieces: "🍗", fried_whole: "🍖",
};

const STORAGE_BUCKET = "product-images"; // must match bucket name in Supabase

const EMPTY_FORM = {
  name: "", description: "", price: "", category: "broiler_live",
  weight_kg: "", in_stock: true,
};

/* ── Toast notification ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-xs ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success"
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      }
      {message}
    </div>
  );
}

/* ── Confirm dialog ── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8290A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Are you sure?</h3>
            <p className="text-xs text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#C8290A] hover:bg-[#a82008] rounded-xl transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product form modal (add / edit) ── */
function ProductForm({ product, onSave, onClose }) {
  const isEdit = !!product?.id;
  const [form,        setForm]        = useState(isEdit ? { ...product, price: String(product.price), weight_kg: String(product.weight_kg ?? "") } : { ...EMPTY_FORM });
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url ?? null);
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});
  const fileInputRef = useRef(null);

  function handleField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors((e) => ({ ...e, image: "Image must be under 5 MB." })); return; }
    if (!file.type.startsWith("image/")) { setErrors((e) => ({ ...e, image: "Please select an image file." })); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, image: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name     = "Product name is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 1)
                               e.price    = "Enter a valid price in KSh.";
    if (!form.category)        e.category = "Select a category.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    let image_url = form.image_url ?? null;

    // Upload new image if selected
    if (imageFile) {
      setUploading(true);
      const ext      = imageFile.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, imageFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setErrors((e) => ({ ...e, image: `Upload failed: ${uploadError.message}` }));
        setSaving(false);
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path);
      image_url = publicUrl;
      setUploading(false);
    }

    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      price:       Number(form.price),
      category:    form.category,
      weight_kg:   form.weight_kg ? Number(form.weight_kg) : null,
      in_stock:    form.in_stock,
      image_url,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("products").update(payload).eq("id", product.id));
    } else {
      ({ error } = await supabase.from("products").insert([payload]));
    }

    setSaving(false);
    if (error) {
      setErrors((e) => ({ ...e, submit: error.message }));
    } else {
      onSave();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit product" : "Add new product"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product photo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8290A]/40 hover:bg-red-50/30 transition-all overflow-hidden"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                    <p className="text-white text-sm font-semibold">Click to change</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Click to upload photo</p>
                  <p className="text-xs text-gray-400">JPG, PNG — max 5 MB</p>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Product name <span className="text-[#C8290A]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="e.g. Fresh Broiler Chicken"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
                errors.name ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="Short description of the product…"
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all resize-none"
            />
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Price (KSh) <span className="text-[#C8290A]">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleField("price", e.target.value)}
                placeholder="e.g. 850"
                min="1"
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
                  errors.price ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category <span className="text-[#C8290A]">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => handleField("category", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] bg-white"
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Weight (kg) <span className="text-xs font-normal text-gray-400">— optional</span>
            </label>
            <input
              type="number"
              value={form.weight_kg}
              onChange={(e) => handleField("weight_kg", e.target.value)}
              placeholder="e.g. 1.5"
              min="0"
              step="0.1"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"
            />
          </div>

          {/* In stock toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">In stock</p>
              <p className="text-xs text-gray-500 mt-0.5">Toggle off to hide this product from the shop</p>
            </div>
            <button
              type="button"
              onClick={() => handleField("in_stock", !form.in_stock)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                form.in_stock ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                form.in_stock ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isEdit ? "Save changes" : "Add product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Products tab ── */
export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // product to edit
  const [deleteId,   setDeleteId]   = useState(null);   // product id to confirm delete
  const [toast,      setToast]      = useState(null);   // { message, type }
  const [filterCat,  setFilterCat]  = useState("all");

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (filterCat !== "all") query = query.eq("category", filterCat);
    const { data } = await query;
    setProducts(data ?? []);
    setLoading(false);
  }, [filterCat]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleToggleStock(product) {
    const { error } = await supabase
      .from("products")
      .update({ in_stock: !product.in_stock })
      .eq("id", product.id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, in_stock: !p.in_stock } : p)
      );
      showToast(product.in_stock ? "Marked out of stock" : "Marked in stock");
    }
  }

  async function handleDelete() {
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) { showToast("Failed to delete product.", "error"); return; }
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    showToast("Product deleted.");
  }

  function handleFormSave() {
    setShowForm(false);
    setEditTarget(null);
    fetchProducts();
    showToast(editTarget ? "Product updated!" : "Product added!");
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat("all")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filterCat === "all" ? "bg-[#C8290A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                filterCat === c.value ? "bg-[#C8290A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CAT_EMOJI[c.value]} {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="shrink-0 inline-flex items-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add product
        </button>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-4/3 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-gray-200">
          <span className="text-5xl">🐔</span>
          <h3 className="text-base font-bold text-gray-900">No products yet</h3>
          <p className="text-sm text-gray-500">Click "Add product" to list your first chicken.</p>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline"
          >
            Add your first product →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col group">
              {/* Image */}
              <div className="relative aspect-4/3 bg-gray-50">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {CAT_EMOJI[product.category] ?? "🐔"}
                  </div>
                )}
                {/* Out of stock overlay */}
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                      Out of stock
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">{product.name}</h3>
                  <span className="text-sm font-bold text-[#C8290A] shrink-0">
                    KSh {product.price.toLocaleString()}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category}
                  </span>
                  {product.weight_kg && (
                    <span className="text-xs text-gray-400">{product.weight_kg} kg</span>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-2">
                {/* Stock toggle */}
                <button
                  onClick={() => handleToggleStock(product)}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                    product.in_stock
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? "bg-green-500" : "bg-gray-400"}`} />
                  {product.in_stock ? "In stock" : "Out of stock"}
                </button>

                <div className="flex items-center gap-1">
                  {/* Edit */}
                  <button
                    onClick={() => { setEditTarget(product); setShowForm(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductForm
          product={editTarget}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          message="This product will be permanently removed from your shop. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
import { useState } from "react";

const emptyProduct = { name: "", price: "", category_id: "", image_url: "", available: true };

export function ProductForm({ categories, product, onCancel, onSaved, request }) {
  const [form, setForm] = useState(product ? { ...product, price: String(product.price), category_id: String(product.category_id) } : emptyProduct);
  const [imageMode, setImageMode] = useState("url");
  const [imageFile, setImageFile] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function addInlineCategory() {
    try {
      const result = await request("/api/admin/categories", { method: "POST", body: { name: newCategory } });
      setNewCategory("");
      update("category_id", String(result.category.id));
      await onSaved({ reloadOnly: true });
    } catch (requestError) { setError(requestError.message); }
  }

  async function submit(event) {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      let imageUrl = form.image_url;
      if (imageMode === "upload" && imageFile) {
        const upload = new FormData(); upload.append("image", imageFile);
        imageUrl = (await request("/api/admin/uploads", { method: "POST", body: upload, isFormData: true })).image_url;
      }
      const body = { ...form, category_id: Number(form.category_id), price: Number(form.price), image_url: imageUrl, available: Boolean(form.available) };
      await request(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PUT" : "POST", body });
      await onSaved();
    } catch (requestError) { setError(requestError.message); } finally { setIsSubmitting(false); }
  }

  return (
    <form className="rounded-2xl border border-violet-200/10 bg-[#241349] p-5 shadow-xl shadow-black/10" onSubmit={submit}>
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-300">{product ? "Edit product" : "New product"}</p><h2 className="mt-1 text-xl font-bold text-white">{product ? product.name : "Add a product"}</h2></div>{product && <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-300 hover:text-white">Cancel edit</button>}</div>
      {error && <div className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-200">Product name<input value={form.name} onChange={(event) => update("name", event.target.value)} required className="field" /></label><label className="text-sm font-medium text-slate-200">Price (PKR)<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} required className="field" /></label></div>
      <label className="mt-4 block text-sm font-medium text-slate-200">Category<select value={form.category_id} onChange={(event) => update("category_id", event.target.value)} required className="field"><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <div className="mt-2 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Create category inline" className="field mt-0 flex-1" /><button type="button" onClick={addInlineCategory} disabled={!newCategory.trim()} className="rounded-xl border border-violet-300/25 px-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/10 disabled:opacity-40">Add</button></div>
      <div className="mt-5 flex gap-5 border-b border-violet-200/10 text-sm font-semibold"><button type="button" onClick={() => setImageMode("url")} className={`border-b-2 pb-2 ${imageMode === "url" ? "border-red-400 text-white" : "border-transparent text-slate-400"}`}>Paste image URL</button><button type="button" onClick={() => setImageMode("upload")} className={`border-b-2 pb-2 ${imageMode === "upload" ? "border-red-400 text-white" : "border-transparent text-slate-400"}`}>Upload image</button></div>
      {imageMode === "url" ? <label className="mt-4 block text-sm font-medium text-slate-200">Image URL<input type="url" value={form.image_url ?? ""} onChange={(event) => update("image_url", event.target.value)} placeholder="https://example.com/product.jpg" className="field" /></label> : <label className="mt-4 block text-sm font-medium text-slate-200">Image file (max 5 MB)<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:font-semibold file:text-violet-100" /></label>}
      <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-200"><input type="checkbox" checked={form.available} onChange={(event) => update("available", event.target.checked)} className="size-4 accent-red-500" />Available for future storefront</label>
      <button disabled={isSubmitting || categories.length === 0} className="mt-6 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Saving…" : product ? "Save product" : "Create product"}</button>{categories.length === 0 && <p className="mt-3 text-sm text-amber-200">Create a category before adding the first product.</p>}
    </form>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import { ProductForm } from "./ProductForm";

export function AdminDashboard({ token, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState("");

  const request = useMemo(
    () => async (path, options = {}) => {
      try {
        return await apiRequest(path, { ...options, token });
      } catch (requestError) {
        if (requestError.status === 401) onLogout();
        throw requestError;
      }
    },
    [token, onLogout],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryResult, productResult] = await Promise.all([
        request("/api/admin/categories"),
        request("/api/admin/products"),
      ]);
      setCategories(categoryResult.categories);
      setProducts(productResult.products);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saved(options = {}) {
    await loadData();
    if (!options.reloadOnly) setEditingProduct(null);
  }

  async function remove(product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/products/${product.id}`, { method: "DELETE" });
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggle(product) {
    try {
      await request(`/api/admin/products/${product.id}/availability`, {
        method: "PATCH",
        body: { available: !product.available },
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function addCategory(event) {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setCategoryBusy(true);
    setCategoryMessage("");
    setError("");
    try {
      await request("/api/admin/categories", {
        method: "POST",
        body: { name },
      });
      setNewCategoryName("");
      setCategoryMessage(`Category “${name}” created.`);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCategoryBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#160b2e] text-slate-100">
      <header className="border-b border-violet-200/10 bg-[#1d0e3e]/90 px-5 py-5 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
              Smart Cash & Carry
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">Admin dashboard</h1>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-violet-200/15 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-violet-300/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_420px] sm:px-8">
        <section className="space-y-7">
          {/* Categories management */}
          <div className="rounded-2xl border border-violet-200/10 bg-[#211044] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                  Categories
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Manage categories
                </h2>
              </div>
              <div className="rounded-xl bg-violet-500/15 px-3 py-1.5 text-sm font-semibold text-violet-100">
                {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </div>
            </div>

            <form onSubmit={addCategory} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Fresh Produce, Masalas & Spices"
                className="flex-1 rounded-xl border border-violet-200/15 bg-[#160b2e] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
                maxLength={80}
              />
              <button
                type="submit"
                disabled={categoryBusy || !newCategoryName.trim()}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categoryBusy ? "Adding…" : "Add category"}
              </button>
            </form>

            {categoryMessage && (
              <p className="mt-3 text-sm text-emerald-300">{categoryMessage}</p>
            )}

            {categories.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-100"
                  >
                    {category.name}
                  </li>
                ))}
              </ul>
            ) : (
              !loading && (
                <p className="mt-4 text-sm text-amber-200">
                  No categories yet. Add one above before creating products.
                </p>
              )
            )}
          </div>

          {/* Products list */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                  Catalog
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">Products</h2>
              </div>
              <div className="rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100">
                {products.length} item{products.length === 1 ? "" : "s"}
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border border-violet-200/10 bg-[#211044]">
              <div className="hidden grid-cols-[72px_minmax(150px,1fr)_120px_110px_160px] items-center gap-4 border-b border-violet-200/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-violet-300 md:grid">
                <span>Image</span>
                <span>Product</span>
                <span>Category</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {loading ? (
                <p className="px-5 py-10 text-center text-slate-400">Loading products…</p>
              ) : products.length === 0 ? (
                <p className="px-5 py-10 text-center text-slate-400">
                  No products yet. Use the form to create the first one.
                </p>
              ) : (
                products.map((product) => (
                  <article
                    key={product.id}
                    className="grid gap-3 border-b border-violet-200/10 px-5 py-4 last:border-0 md:grid-cols-[72px_minmax(150px,1fr)_120px_110px_160px] md:items-center md:gap-4"
                  >
                    <div className="size-14 overflow-hidden rounded-lg bg-violet-500/15">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-xs font-bold text-violet-200">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{product.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        PKR {Number(product.price).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">{product.category_name}</p>
                    <button
                      onClick={() => toggle(product)}
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        product.available
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-slate-400/15 text-slate-300"
                      }`}
                    >
                      {product.available ? "Available" : "Hidden"}
                    </button>
                    <div className="flex justify-start gap-2 md:justify-end">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/35"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(product)}
                        className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <aside>
          <ProductForm
            categories={categories}
            product={editingProduct}
            onCancel={() => setEditingProduct(null)}
            onSaved={saved}
            request={request}
          />
        </aside>
      </div>
    </main>
  );
}

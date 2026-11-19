import { useCallback, useEffect, useState } from "react";
import { FaAmbulance, FaEdit, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import api from "../../api/axios";
import notify from "../../common/utils/notify";

const empty = { name: "", description: "", cashPrice: "", isActive: true, sortOrder: 0 };
const fieldClass = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary";
const price = (value) => value == null ? "Price to be confirmed" : `KES ${Number(value).toLocaleString()}`;

export default function AmbulanceServicesCatalog() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/ambulance-services/manage"); setRows(Array.isArray(data) ? data : []); }
    catch { notify.error("Could not load the ambulance service catalogue."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm(empty); setEditingId(null); };
  const edit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || "", description: row.description || "", cashPrice: row.cashPrice ?? "", isActive: Boolean(row.isActive), sortOrder: row.sortOrder ?? 0 });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return notify.error("Service name is required.");
    setSaving(true);
    const data = { ...form, cashPrice: form.cashPrice === "" ? null : Number(form.cashPrice), sortOrder: Number(form.sortOrder) || 0 };
    try {
      if (editingId) await api.put(`/ambulance-services/${editingId}`, data);
      else await api.post("/ambulance-services", data);
      notify.success(editingId ? "Ambulance service updated." : "Ambulance service added.");
      reset(); await refresh();
    } catch (error) { notify.error(error.response?.data?.message || "Could not save ambulance service."); }
    finally { setSaving(false); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name} from the public ambulance page?`)) return;
    try { await api.delete(`/ambulance-services/${row.id}`); notify.success("Ambulance service deleted."); await refresh(); }
    catch (error) { notify.error(error.response?.data?.message || "Could not delete ambulance service."); }
  };

  return <main className="min-h-screen bg-canvas px-4 py-8 text-ink sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <header><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Operations</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-bold"><FaAmbulance className="text-red-600" /> Ambulance service catalogue</h1><p className="mt-2 text-sm text-ink-muted">Manage public emergency transfer options and cash/mobile prices.</p></header>
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{editingId ? "Edit service option" : "Add service option"}</h2>{editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-sm text-ink-muted"><FaTimes /> Cancel edit</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Name *<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setValue("name", e.target.value)} /></label>
          <label className="text-sm font-medium">Description<input className={`${fieldClass} mt-1`} value={form.description} onChange={(e) => setValue("description", e.target.value)} /></label>
          <label className="text-sm font-medium">Cash/mobile price (KES)<input type="number" min="0" step="0.01" className={`${fieldClass} mt-1`} value={form.cashPrice} onChange={(e) => setValue("cashPrice", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={(e) => setValue("isActive", e.target.checked)} /> Show on public ambulance page</label>
        </div>
        <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FaPlus /> {saving ? "Saving…" : editingId ? "Save changes" : "Add option"}</button>
      </form>
      <section className="overflow-hidden rounded-xl bg-surface">
        <div className="border-b border-line p-5"><h2 className="text-lg font-bold">Current service options</h2></div>
        {loading ? <p className="p-6 text-sm text-ink-muted">Loading…</p> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-line text-ink-muted"><th className="p-4">Service</th><th className="p-4">Cash/mobile</th><th className="p-4">Public</th><th className="p-4">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-line last:border-0"><td className="p-4"><p className="font-semibold">{row.name}</p>{row.description && <p className="mt-1 text-xs text-ink-muted">{row.description}</p>}</td><td className="p-4">{price(row.cashPrice)}</td><td className="p-4">{row.isActive ? "Shown" : "Hidden"}</td><td className="p-4"><div className="flex gap-3"><button type="button" onClick={() => edit(row)} className="inline-flex items-center gap-1 text-primary"><FaEdit /> Edit</button><button type="button" onClick={() => remove(row)} className="inline-flex items-center gap-1 text-red-600"><FaTrash /> Delete</button></div></td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-ink-muted">No ambulance service options yet.</p>}
      </section>
    </div>
  </main>;
}

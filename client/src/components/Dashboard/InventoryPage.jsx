import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdInventory2 } from "react-icons/md";
import {
  FaPlus, FaSearch, FaCheckCircle, FaTimes, FaSave,
  FaExclamationTriangle, FaBoxes, FaPills, FaThermometerHalf,
  FaFilter, FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

const CATEGORIES = ["Medicine", "Equipment", "Consumable", "Other"];

const CAT_COLORS = {
  Medicine:   "bg-blue-50 text-blue-600",
  Equipment:  "bg-violet-50 text-violet-600",
  Consumable: "bg-teal-50 text-teal-600",
  Other:      "bg-gray-50 text-gray-600",
};

const EMPTY_FORM = {
  name:"", category:"Medicine", quantity:"", unit:"",
  price:"", supplier:"", batch:"", expiry:"",
  minThreshold: 5, description:"",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtPrice = (p) => typeof p === "number" ? `KSh ${p.toLocaleString("en-KE", { minimumFractionDigits:2 })}` : "—";
const toInputDate = (d) => d ? d.split("T")[0] : "";

const isExpired  = (item) => item.expiry && new Date(item.expiry) < new Date();
const isLowStock = (item) => item.quantity < (item.minThreshold ?? 5);


const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${accent.num}`}>{value ?? 0}</p>
    </div>
  </div>
);

const StockBadge = ({ item }) => {
  if (isExpired(item))
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Expired</span>;
  if (isLowStock(item))
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Low Stock</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Available</span>;
};

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading inventory…</p>
  </div>
);

const Empty = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <MdInventory2 className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);


const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
            <FaTimes className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white";


const InventoryPage = () => {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);


  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory");
      setItems(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const stats = useMemo(() => ({
    total:      items.length,
    medicines:  items.filter(i => i.category === "Medicine").length,
    equipment:  items.filter(i => i.category === "Equipment").length,
    lowStock:   items.filter(i => isLowStock(i)).length,
    expired:    items.filter(i => isExpired(i)).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => {
      const matchSearch =
        i.name?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase().includes(q) ||
        i.batch?.toLowerCase().includes(q);
      const matchCat   = filterCat   === "all" || i.category === filterCat;
      const matchStock =
        filterStock === "all"      ? true :
        filterStock === "expired"  ? isExpired(i) :
        filterStock === "low"      ? isLowStock(i) && !isExpired(i) :
        filterStock === "ok"       ? !isLowStock(i) && !isExpired(i) : true;
      return matchSearch && matchCat && matchStock;
    });
  }, [items, search, filterCat, filterStock]);

 
  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item
      ? {
          name:         item.name         || "",
          category:     item.category     || "Medicine",
          quantity:     item.quantity     ?? "",
          unit:         item.unit         || "",
          price:        item.price        ?? "",
          supplier:     item.supplier     || "",
          batch:        item.batch        || "",
          expiry:       toInputDate(item.expiry),
          minThreshold: item.minThreshold ?? 5,
          description:  item.description  || "",
        }
      : EMPTY_FORM
    );
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingItem(null); setFormData(EMPTY_FORM); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numFields = new Set(["quantity", "price", "minThreshold"]);
    setFormData(prev => ({
      ...prev,
      [name]: numFields.has(name) ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())     { toast.error("Name is required"); return; }
    if (!formData.category)        { toast.error("Category is required"); return; }
    if (formData.quantity === "")  { toast.error("Quantity is required"); return; }
    if (!formData.unit.trim())     { toast.error("Unit is required"); return; }
    if (formData.price === "")     { toast.error("Price is required"); return; }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}`, formData);
        toast.success("Item updated");
    
        setItems(prev => prev.map(i => i._id === editingItem._id ? { ...i, ...formData } : i));
      } else {
        const res = await api.post("/inventory", formData);
        const newItem = res.data.data || res.data;
        toast.success("Item added");
          setItems(prev => [newItem, ...prev]);
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting item");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .fade-up { animation: fadeUp .3s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

    
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <MdInventory2 className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inventory Management</h1>
              <p className="text-xs text-gray-400">Track stock levels, expiry dates, and suppliers</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-200 transition-colors"
          >
            <FaPlus className="text-xs" /> Add Item
          </button>
        </div>


        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Items" value={stats.total}     icon={MdInventory2}          accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Medicines"   value={stats.medicines} icon={FaPills}               accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Equipment"   value={stats.equipment} icon={FaThermometerHalf}     accent={{ bg:"bg-violet-50",  icon:"text-violet-500",  num:"text-violet-600"  }} />
          <StatCard label="Low Stock"   value={stats.lowStock}  icon={FaExclamationTriangle} accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
          <StatCard label="Expired"     value={stats.expired}   icon={FaCalendarAlt}         accent={{ bg:"bg-rose-50",    icon:"text-rose-500",    num:"text-rose-600"    }} />
        </div>


        {(stats.expired > 0 || stats.lowStock > 0) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {stats.expired > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-semibold">
                <FaExclamationTriangle className="text-rose-500 shrink-0" />
                {stats.expired} expired item{stats.expired !== 1 ? "s" : ""} — review immediately
              </div>
            )}
            {stats.lowStock > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-semibold">
                <FaBoxes className="text-amber-500 shrink-0" />
                {stats.lowStock} item{stats.lowStock !== 1 ? "s" : ""} below minimum threshold
              </div>
            )}
          </div>
        )}


        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, supplier, or batch…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FaFilter className="text-gray-300 text-sm" />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
              <option value="all">All Status</option>
              <option value="ok">Available</option>
              <option value="low">Low Stock</option>
              <option value="expired">Expired</option>
            </select>
            {(search || filterCat !== "all" || filterStock !== "all") && (
              <button onClick={() => { setSearch(""); setFilterCat("all"); setFilterStock("all"); }}
                className="text-xs text-gray-400 hover:text-rose-500 cursor-pointer flex items-center gap-1 transition-colors">
                <FaTimes className="text-[10px]" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <Empty text={items.length === 0 ? "No inventory items yet — add one to get started!" : "No items match your filters"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Name", "Category", "Qty", "Unit", "Price", "Supplier", "Batch", "Expiry", "Status", ""].map((h, i) => (
                      <th key={i} className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 9 ? "text-right" : "text-left"}`}>
                        {h || "Actions"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(item => {
                    const rowHighlight = isExpired(item) ? "bg-rose-50/30" : isLowStock(item) ? "bg-amber-50/30" : "";
                    return (
                      <tr key={item._id} className={`hover:bg-gray-50/80 transition-colors group ${rowHighlight}`}>

                       
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </td>

                   
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[item.category] || CAT_COLORS.Other}`}>
                            {item.category}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${isLowStock(item) ? "text-amber-600" : "text-gray-800"}`}>
                            {item.quantity}
                          </span>
                          {isLowStock(item) && (
                            <p className="text-[10px] text-amber-500">min: {item.minThreshold ?? 5}</p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-600">{item.unit}</td>
                        <td className="px-5 py-4 text-xs text-gray-700 font-medium">{fmtPrice(item.price)}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">{item.supplier || "—"}</td>
                        <td className="px-5 py-4 text-xs text-gray-500 font-mono">{item.batch || "—"}</td>

                  
                        <td className="px-5 py-4">
                          <span className={`text-xs ${isExpired(item) ? "text-rose-600 font-semibold" : "text-gray-500"}`}>
                            {fmtDate(item.expiry)}
                          </span>
                        </td>

                        <td className="px-5 py-4"><StockBadge item={item} /></td>

                        
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(item)}
                              className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="Edit">
                              <MdEdit className="text-base" />
                            </button>
                            <button onClick={() => handleDelete(item._id)}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete">
                              <MdDelete className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{items.length}</span> items
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Item Name" required>
              <input name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Paracetamol 500mg" className={inputCls} required />
            </Field>
            <Field label="Category" required>
              <select name="category" value={formData.category} onChange={handleChange} className={inputCls} required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Quantity" required>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                placeholder="0" min="0" className={inputCls} required />
            </Field>
            <Field label="Unit" required>
              <input name="unit" value={formData.unit} onChange={handleChange}
                placeholder="e.g., tablets, boxes, ml" className={inputCls} required />
            </Field>
            <Field label="Price per Unit (KSh)" required>
              <input type="number" name="price" value={formData.price} onChange={handleChange}
                placeholder="0.00" min="0" step="0.01" className={inputCls} required />
            </Field>
            <Field label="Min Threshold">
              <input type="number" name="minThreshold" value={formData.minThreshold} onChange={handleChange}
                placeholder="5" min="0" className={inputCls} />
            </Field>
            <Field label="Supplier">
              <input name="supplier" value={formData.supplier} onChange={handleChange}
                placeholder="Supplier name" className={inputCls} />
            </Field>
            <Field label="Batch Number">
              <input name="batch" value={formData.batch} onChange={handleChange}
                placeholder="e.g., BT-2024-001" className={inputCls} />
            </Field>
          </div>

          <Field label="Expiry Date">
            <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} className={inputCls} />
          </Field>

          <Field label="Description">
            <textarea name="description" value={formData.description} onChange={handleChange}
              placeholder="Additional notes about this item…" rows={3}
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} disabled={submitting}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer shadow-sm shadow-blue-200 transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FaSave className="text-xs" />{editingItem ? "Update Item" : "Save Item"}</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
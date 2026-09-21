import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdInventory2 } from "react-icons/md";
import {
  FaPlus, FaSearch, FaCheckCircle, FaTimes, FaSave,
  FaExclamationTriangle, FaBoxes, FaPills, FaThermometerHalf,
  FaFilter, FaCalendarAlt,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge, Avatar, DataTable,
} from "../../common/components";


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




const StockBadge = ({ item }) => {
  if (isExpired(item))
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Expired</span>;
  if (isLowStock(item))
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Low Stock</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Available</span>;
};

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
      notify.error(err.response?.data?.message || "Error fetching inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useSocket("inventory:created", fetchInventory);
  useSocket("inventory:updated", fetchInventory);
  useSocket("inventory:deleted", fetchInventory);

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
    if (!formData.name.trim())     { notify.error("Name is required"); return; }
    if (!formData.category)        { notify.error("Category is required"); return; }
    if (formData.quantity === "")  { notify.error("Quantity is required"); return; }
    if (!formData.unit.trim())     { notify.error("Unit is required"); return; }
    if (formData.price === "")     { notify.error("Price is required"); return; }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, formData);
        notify.success("Item updated");
    
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
      } else {
        const res = await api.post("/inventory", formData);
        const newItem = res.data.data || res.data;
        notify.success("Item added");
          setItems(prev => [newItem, ...prev]);
      }
      closeModal();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      notify.success("Item deleted");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting item");
    }
  };

  const inventoryColumns = [
    {
      key: "name", label: "Name", priority: "A", mobileSlot: "identity",
      render: (item) => (
        <>
          <p className="font-semibold text-gray-900">{item.name}</p>
          {item.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
        </>
      ),
    },
    {
      key: "category", label: "Category", priority: "B", mobileSlot: "meta",
      render: (item) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[item.category] || CAT_COLORS.Other}`}>{item.category}</span>
      ),
    },
    {
      key: "quantity", label: "Qty", priority: "A", mobileSlot: "value",
      render: (item) => (
        <>
          <span className={`font-bold text-sm ${isLowStock(item) ? "text-amber-600" : "text-gray-800"}`}>{item.quantity}</span>
          {isLowStock(item) && <p className="text-[10px] text-amber-500">min: {item.minThreshold ?? 5}</p>}
        </>
      ),
    },
    { key: "unit", label: "Unit", priority: "C", render: (item) => <span className="text-xs text-gray-600">{item.unit}</span> },
    { key: "price", label: "Price", priority: "B", mobileSlot: "meta", render: (item) => <span className="text-xs text-gray-700 font-medium">{fmtPrice(item.price)}</span> },
    { key: "supplier", label: "Supplier", priority: "C", render: (item) => <span className="text-xs text-gray-500">{item.supplier || "—"}</span> },
    { key: "batch", label: "Batch", priority: "D", render: (item) => <span className="text-xs text-gray-500 font-mono">{item.batch || "—"}</span> },
    {
      key: "expiry", label: "Expiry", priority: "B",
      render: (item) => <span className={`text-xs ${isExpired(item) ? "text-rose-600 font-semibold" : "text-gray-500"}`}>{fmtDate(item.expiry)}</span>,
    },
    { key: "status", label: "Status", priority: "A", mobileSlot: "status", render: (item) => <StockBadge item={item} /> },
    {
      key: "actions", label: "Actions", align: "right", priority: "A", mobileSlot: "actions",
      render: (item) => (
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal(item)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="Edit">
            <MdEdit className="text-base" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete">
            <MdDelete className="text-base" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">

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
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer  transition-colors"
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


        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col md:flex-row gap-3">
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

        {loading ? (
          <Spinner text="Loading inventory…" />
        ) : filtered.length === 0 ? (
          <EmptyState text={items.length === 0 ? "No inventory items yet — add one to get started!" : "No items match your filters"} icon={FaBoxes} />
        ) : (
          <>
            <DataTable
              columns={inventoryColumns}
              data={filtered}
              rowKey={(item) => item.id}
            />
            <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{items.length}</span> items
              </p>
            </div>
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Item Name" required>
              <input name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Paracetamol 500mg" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
            </FormField>
            <FormField label="Category" required>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Quantity" required>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                placeholder="0" min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
            </FormField>
            <FormField label="Unit" required>
              <input name="unit" value={formData.unit} onChange={handleChange}
                placeholder="e.g., tablets, boxes, ml" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
            </FormField>
            <FormField label="Price per Unit (KSh)" required>
              <input type="number" name="price" value={formData.price} onChange={handleChange}
                placeholder="0.00" min="0" step="0.01" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
            </FormField>
            <FormField label="Min Threshold">
              <input type="number" name="minThreshold" value={formData.minThreshold} onChange={handleChange}
                placeholder="5" min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Supplier">
              <input name="supplier" value={formData.supplier} onChange={handleChange}
                placeholder="Supplier name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Batch Number">
              <input name="batch" value={formData.batch} onChange={handleChange}
                placeholder="e.g., BT-2024-001" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
          </div>

          <FormField label="Expiry Date">
            <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
          </FormField>

          <FormField label="Description">
            <textarea name="description" value={formData.description} onChange={handleChange}
              placeholder="Additional notes about this item…" rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none" />
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} disabled={submitting}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer  transition-colors">
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

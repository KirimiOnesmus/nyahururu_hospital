import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdInventory2 } from "react-icons/md";
import { FaPlusCircle, FaSearch } from "react-icons/fa";

const InventoryPage = () => {
const [items, setItems] = useState([]);
const [filtered, setFiltered] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(false);
const [modalOpen, setModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [formData, setFormData] = useState({
name: "",
category: "",
quantity: "",
unit: "",
price: "",
supplier: "",
batch: "",
expiry: "",
});

const fetchInventory = async () => {
try {
setLoading(true);
const res = await api.get("/inventory");
setItems(res.data);
setFiltered(res.data);
} catch (err) {
console.error(err.response?.data?.message || err.message);
alert("Error fetching inventory");
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchInventory();
}, []);

useEffect(() => {
const filteredData = items.filter(
(i) =>
i.name.toLowerCase().includes(search.toLowerCase()) ||
i.category.toLowerCase().includes(search.toLowerCase()) ||
i.supplier?.toLowerCase().includes(search.toLowerCase())
);
setFiltered(filteredData);
}, [search, items]);

const handleOpenModal = (item = null) => {
setEditingItem(item);
setFormData(
item
? {
name: item.name,
category: item.category,
quantity: item.quantity,
unit: item.unit,
price: item.price,
supplier: item.supplier,
batch: item.batch,
expiry: item.expiry ? item.expiry.split("T")[0] : "",
}
: {
name: "",
category: "",
quantity: "",
unit: "",
price: "",
supplier: "",
batch: "",
expiry: "",
}
);
setModalOpen(true);
};

const handleCloseModal = () => {
setEditingItem(null);
setFormData({
name: "",
category: "",
quantity: "",
unit: "",
price: "",
supplier: "",
batch: "",
expiry: "",
});
setModalOpen(false);
};

const handleChange = (e) =>
setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

const handleSubmit = async (e) => {
e.preventDefault();
try {
if (editingItem) {
await api.put(`/inventory/${editingItem._id}`, formData);
} else {
await api.post("/inventory", formData);
}
fetchInventory();
handleCloseModal();
} catch (err) {
alert(err.response?.data?.message || "Error saving item");
}
};

const handleDelete = async (id) => {
if (!window.confirm("Are you sure you want to delete this item?")) return;
try {
await api.delete(`/inventory/${id}`);
fetchInventory();
} catch (err) {
alert(err.response?.data?.message || "Error deleting item");
}
};

// Dashboard stats
const stats = {
total: items.length,
medicines: items.filter((i) => i.category === "Medicine").length,
equipment: items.filter((i) => i.category === "Equipment").length,
consumables: items.filter((i) => i.category === "Consumable").length,
lowStock: items.filter((i) => i.quantity < (i.minThreshold || 5)).length,
expired: items.filter(
(i) => i.expiry && new Date(i.expiry) < new Date()
).length,
};

const getStatusBadge = (item) => {
  if (item.expiry && new Date(item.expiry) < new Date()) {
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">Expired</span>;
  }
  if (item.quantity < (item.minThreshold || 5)) {
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">Low Stock</span>;
  }
  return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Available</span>;
};

return (

    <div className="p-6 bg-gray-100 min-h-screen">
    <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Items</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <MdInventory2 className="text-blue-600 text-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Medicines</p>
          <h3 className="text-2xl font-bold text-green-600">{stats.medicines}</h3>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Low Stock</p>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.lowStock}</h3>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Expired</p>
          <h3 className="text-2xl font-bold text-red-600">{stats.expired}</h3>
        </div>
      </div>
    </div>

    {/* Search & Add */}
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="flex-1 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, category or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => handleOpenModal()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FaPlusCircle /> Add Item
      </button>
    </div>

    {/* Inventory Table */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading inventory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No inventory items found</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((i) => (
              <tr key={i._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-2">{i.name}</td>
                <td className="px-6 py-2">{i.category}</td>
                <td className="px-6 py-2">{i.quantity}</td>
                <td className="px-6 py-2">{i.unit}</td>
                <td className="px-6 py-2">{i.price}</td>
                <td className="px-6 py-2">{i.supplier}</td>
                <td className="px-6 py-2">{i.batch}</td>
                <td className="px-6 py-2">{i.expiry ? new Date(i.expiry).toLocaleDateString("en-US") : "—"}</td>
                <td className="px-6 py-2">{getStatusBadge(i)}</td>
                <td className="px-6 py-2 flex justify-end gap-3 text-xl">
                  <MdEdit className="text-blue-600 cursor-pointer hover:text-blue-700" onClick={() => handleOpenModal(i)} />
                  <MdDelete className="text-red-600 cursor-pointer hover:text-red-700" onClick={() => handleDelete(i._id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>


  {/* Add/Edit Modal */}
  {modalOpen && (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">{editingItem ? "Edit Item" : "Add Inventory Item"}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <input type="number" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" min="0" required />
          <input type="text" name="unit" placeholder="Unit" value={formData.unit} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <input type="number" name="price" placeholder="Price per Unit" value={formData.price} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" min="0" step="0.01" required />
          <input type="text" name="supplier" placeholder="Supplier" value={formData.supplier} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" />
          <input type="text" name="batch" placeholder="Batch Number" value={formData.batch} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" />
          <input type="date" name="expiry" placeholder="Expiry Date" value={formData.expiry} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" />
          <div className="flex justify-end gap-3 mt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingItem ? "Update" : "Save"}</button>
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
};

export default InventoryPage;
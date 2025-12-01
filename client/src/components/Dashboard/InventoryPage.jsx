import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdInventory2 } from "react-icons/md";
import { FaPlusCircle, FaSearch, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Medicine",
    quantity: "",
    unit: "",
    price: "",
    supplier: "",
    batch: "",
    expiry: "",
    minThreshold: 5,
    description: "",
  });

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/inventory");
      setItems(res.data);
      setFiltered(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error fetching inventory";
      console.error("Fetch error:", errorMsg);
      setError(errorMsg);
      setItems([]);
      setFiltered([]);
      toast.error("Error fetching inventory items");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter items based on search
  useEffect(() => {
    const filteredData = items.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.supplier?.toLowerCase().includes(search.toLowerCase()) ||
        i.batch?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, items]);

  // Open modal for add/edit
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        supplier: item.supplier || "",
        batch: item.batch || "",
        expiry: item.expiry ? item.expiry.split("T")[0] : "",
        minThreshold: item.minThreshold || 5,
        description: item.description || "",
      });
    } else {
      setFormData({
        name: "",
        category: "Medicine",
        quantity: "",
        unit: "",
        price: "",
        supplier: "",
        batch: "",
        expiry: "",
        minThreshold: 5,
        description: "",
      });
    }
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Medicine",
      quantity: "",
      unit: "",
      price: "",
      supplier: "",
      batch: "",
      expiry: "",
      minThreshold: 5,
      description: "",
    });
    setError(null);
    setSuccess(null);
    setModalOpen(false);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" || name === "minThreshold" 
        ? value === "" ? "" : Number(value) 
        : value,
    }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.name || !formData.category || formData.quantity === "" || !formData.unit || formData.price === "") {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      if (editingItem) {
        // Update existing item
        await api.put(`/inventory/${editingItem._id}`, formData);
        setSuccess("Item updated successfully!");
        toast.success("Item updated successfully!");
      } else {
        // Create new item
        await api.post("/inventory", formData);
        setSuccess("Item added successfully!");
        toast.success("Item added successfully!");
      }

      // Refresh inventory list
      await fetchInventory();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error saving item";
      console.error("Submit error:", errorMsg);
      setError(errorMsg);
      toast.error("Error saving item");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/inventory/${id}`);
      setSuccess("Item deleted successfully!");
      await fetchInventory();
      toast.success("Item deleted successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error deleting item";
      console.error("Delete error:", errorMsg);
      setError(errorMsg);
      toast.error("Error deleting item");
    }
  };

  // Calculate dashboard stats
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

  // Get status badge for inventory item
  const getStatusBadge = (item) => {
    if (item.expiry && new Date(item.expiry) < new Date()) {
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
          Expired
        </span>
      );
    }
    if (item.quantity < (item.minThreshold || 5)) {
      return (
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
          Low Stock
        </span>
      );
    }
    return (
      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
        Available
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Success Alert */}
      {/* {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FaCheckCircle className="text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )} */}

      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Items</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <MdInventory2 className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm text-gray-500 mb-1">Medicines</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.medicines}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm text-gray-500 mb-1">Low Stock</p>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.lowStock}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm text-gray-500 mb-1">Expired</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.expired}</h3>
          </div>
        </div>
      </div>

      {/* Search & Add Button */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex-1 relative w-full md:w-auto">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, supplier or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <FaPlusCircle /> Add Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MdInventory2 className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {items.length === 0 ? "No inventory items yet. Add one to get started!" : "No items match your search."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <span className={item.quantity < (item.minThreshold || 5) ? "font-bold text-yellow-600" : ""}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{item.unit}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">Ksh {item.price.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{item.supplier || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{item.batch || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {item.expiry ? new Date(item.expiry).toLocaleDateString("en-US") : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm">{getStatusBadge(item)}</td>
                  <td className="px-6 py-3 flex justify-end gap-3 text-lg">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit item"
                    >
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete item"
                    >
                      <MdDelete />
                    </button>
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
            <h2 className="text-2xl font-bold mb-6">
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </h2>

            {/* Modal Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Paracetamol"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    name="unit"
                    placeholder="e.g., tablets, boxes, ml"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    name="minThreshold"
                    placeholder="5"
                    value={formData.minThreshold}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Supplier name"
                    value={formData.supplier}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    name="batch"
                    placeholder="Batch number"
                    value={formData.batch}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry"
                  value={formData.expiry}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Additional notes..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
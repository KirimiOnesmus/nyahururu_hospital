import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdDelete, MdEdit } from "react-icons/md";

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert("Error fetching services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Delete service
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting service");
    }
  };

  // Open modal for add/edit
  const openModal = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description,
        image: null,
      });
      setIsEditing(true);
    } else {
      setSelectedService(null);
      setFormData({ name: "", description: "", image: null });
      setIsEditing(false);
    }
    setModalOpen(true);
  };

  // Handle add/edit submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);

      // Only append image if a new file is selected
      if (formData.image) {
        payload.append("image", formData.image);
      }

      // CRITICAL FIX: Configure axios to send FormData properly
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEditing) {
        await api.put(`/services/${selectedService._id}`, payload, config);
      } else {
        await api.post("/services", payload, config);
      }

      fetchServices();
      setModalOpen(false);
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "Error saving service");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Services Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Service
        </button>
      </div>

      {loading ? (
        <p>Loading services...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s._id}
                  className="hover:bg-gray-50 border-b border-gray-300"
                >
                  <td className="px-4 py-2">
                    {s.imageUrl ? (
                      <img
                        src={`http://localhost:5000${s.imageUrl}`}
                        alt={s.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.description || "—"}</td>
                  <td className="px-4 py-2 flex space-x-3 text-xl">
                    <MdEdit
                      title="Edit"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => openModal(s)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(s._id)}
                    />
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-600">
                    No services found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Service" : "Add Service"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Description:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Image:</label>
                {isEditing && selectedService?.imageUrl && !formData.image && (
                  <img
                    src={`http://localhost:5000${selectedService.imageUrl}`}
                    alt="Current"
                    className="h-24 w-24 object-cover rounded mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  required={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
                {formData.image && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? "Update" : "Add"} Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
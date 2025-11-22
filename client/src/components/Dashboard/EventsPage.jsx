import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";
import { FaPlusCircle, FaRegFileAlt, FaImage, FaSearch } from "react-icons/fa";

const EventsPage = () => {
const [events, setEvents] = useState([]);
const [filtered, setFiltered] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(false);
const [modalOpen, setModalOpen] = useState(false);
const [editingEvent, setEditingEvent] = useState(null);
const [previewImage, setPreviewImage] = useState(null);
const [formData, setFormData] = useState({
title: "",
description: "",
date: "",
venue: "",
image: null,
});

const fetchEvents = async () => {
try {
setLoading(true);
const res = await api.get("/events");
setEvents(res.data);
setFiltered(res.data);
} catch (err) {
console.error(err.response?.data?.message || err.message);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchEvents();
}, []);

useEffect(() => {
const filteredData = events.filter(
(e) =>
e.title.toLowerCase().includes(search.toLowerCase()) ||
e.venue?.toLowerCase().includes(search.toLowerCase())
);
setFiltered(filteredData);
}, [search, events]);

const handleOpenModal = (event = null) => {
setEditingEvent(event);
setFormData(
event
? {
title: event.title,
description: event.description,
date: event.date.split("T")[0],
venue: event.venue,
image: null,
}
: { title: "", description: "", date: "", venue: "", image: null }
);
setPreviewImage(event?.imageUrl || null);
setModalOpen(true);
};

const handleCloseModal = () => {
setEditingEvent(null);
setFormData({ title: "", description: "", date: "", venue: "", image: null });
setPreviewImage(null);
setModalOpen(false);
};

const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

const handleImageChange = (e) => {
const file = e.target.files[0];
if (file) {
setFormData((prev) => ({ ...prev, image: file }));
setPreviewImage(URL.createObjectURL(file));
}
};

const handleSubmit = async (e) => {
e.preventDefault();
try {
const data = new FormData();
data.append("title", formData.title);
data.append("description", formData.description);
data.append("date", formData.date);
data.append("venue", formData.venue);
if (formData.image) data.append("image", formData.image);

  if (editingEvent) {
    await api.put(`/events/${editingEvent._id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    await api.post("/events", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  fetchEvents();
  handleCloseModal();
} catch (err) {
  alert(err.response?.data?.message || "Error saving event");
}

};

const handleDelete = async (id) => {
if (!window.confirm("Are you sure you want to delete this event?")) return;
try {
await api.delete(`/events/${id}`);
fetchEvents();
} catch (err) {
alert(err.response?.data?.message || "Error deleting event");
}
};

// Stats
const stats = {
total: events.length,
withImage: events.filter((e) => e.imageUrl).length,
withoutImage: events.filter((e) => !e.imageUrl).length,
};

return (

<div className="p-6 bg-gray-100 min-h-screen">
  <h1 className="text-3xl font-bold mb-6">Events Management</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Events</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <FaRegFileAlt className="text-blue-600 text-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">With Image</p>
          <h3 className="text-2xl font-bold text-green-600">{stats.withImage}</h3>
        </div>
        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
          <FaImage className="text-green-600 text-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Without Image</p>
          <h3 className="text-2xl font-bold text-red-600">{stats.withoutImage}</h3>
        </div>
        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
          <FaImage className="text-red-600 text-xl" />
        </div>
      </div>
    </div>

    {/* Search & Add */}
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="flex-1 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => handleOpenModal()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FaPlusCircle />
        Add Event
      </button>
    </div>

    {/* Events Table */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading events...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center">
          <FaRegFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No events found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {e.imageUrl ? (
                      <img src={e.imageUrl} alt={e.title} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{e.title}</td>
                  <td className="px-6 py-4">{new Date(e.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4">{e.venue}</td>
                  <td className="px-6 py-4 flex justify-end gap-3 text-xl">
                    <MdEdit className="text-blue-600 cursor-pointer hover:text-blue-700" onClick={() => handleOpenModal(e)} title="Edit" />
                    <MdDelete className="text-red-600 cursor-pointer hover:text-red-700" onClick={() => handleDelete(e._id)} title="Delete" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
 

  {/* Modal */}
  {modalOpen && (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">{editingEvent ? "Edit Event" : "Add Event"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <input type="text" name="venue" placeholder="Venue" value={formData.venue} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <textarea name="description" placeholder="Description" rows="4" value={formData.description} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          <div>
            <label className="block mb-2 text-gray-700">Event Banner</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-gray-300 p-2 rounded" />
            {previewImage && <img src={previewImage} alt="Preview" className="mt-2 w-full h-40 object-cover rounded" />}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{editingEvent ? "Update" : "Save"}</button>
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
};

export default EventsPage;
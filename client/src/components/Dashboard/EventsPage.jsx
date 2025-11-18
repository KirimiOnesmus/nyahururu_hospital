import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
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
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);
  const handleOpenModal = (event = null) => {
    setEditingEvent(event);
    setFormData(
      event
        ? {
            title: event.title,
            description: event.description,
            date: event.date.split("T")[0],
            venue: event.location,
            image: null,
          }
        : { title: "", description: "", date: "", venue: "", image: null }
    );
    setPreviewImage(event?.imageUrl || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      date: "",
      venue: "",
      image: null,
    });
    setPreviewImage(null);
    setModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
        >
          Add Event
        </button>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Venue</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev._id}
                  className="hover:bg-gray-50 border-b border-gray-200"
                >
                  <td className="px-4 py-2 ">
                    {ev.imageUrl ? (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-2 ">{ev.title}</td>
                  <td className="px-4 py-2 ">
                    {new Date(ev.date).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 ">{ev.location}</td>
                  <td className="px-4 py-2  flex space-x-4 text-xl">
                    <MdEdit
                      title="Edit"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => handleOpenModal(ev)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(ev._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? "Edit Event" : "Add Event"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Event Title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                name="venue"
                placeholder="Venue"
                value={formData.venue}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <div>
                <label className="block mb-2 text-gray-700">Event Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
                >
                  {editingEvent ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 px-4 py-2 rounded cursor-pointer hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;

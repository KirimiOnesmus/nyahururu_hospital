import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete, MdPictureAsPdf } from "react-icons/md";
const ResearchPage = () => {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    abstract: "",
    category: "",
    pdf: null,
    thumbnail: null,
  });

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/research");
      setResearch(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);

    setFormData(
      item
        ? {
            title: item.title,
            author: item.author,
            abstract: item.abstract,
            category: item.category,
            pdf: null,
            thumbnail: null,
          }
        : {
            title: "",
            author: "",
            abstract: "",
            category: "",
            pdf: null,
            thumbnail: null,
          }
    );
    setPreviewImage(item?.thumbnailUrl || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      author: "",
      abstract: "",
      category: "",
      pdf: null,
      thumbnail: null,
    });
    setPreviewImage(null);
    setModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, [name]: file }));
    if (name === "thumbnail" && file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      if (editingItem) {
        await api.put(`/research/${editingItem._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/research", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchResearch();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving research paper");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this research paper?"))
      return;
    try {
      await api.delete(`/research/${id}`);
      fetchResearch();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting research");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Research Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
        >
          Add Research
        </button>
      </div>

      {loading ? (
        <p>Loading research papers...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Thumbnail</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Author</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">PDF</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {research.map((r) => (
                <tr
                  key={r._id}
                  className="hover:bg-gray-50 border-b border-gray-400"
                >
                  <td className="px-4 py-2 ">
                    {r.thumbnailUrl ? (
                      <img
                        src={r.thumbnailUrl}
                        alt={r.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-2 ">{r.title}</td>
                  <td className="px-4 py-2 ">{r.author}</td>
                  <td className="px-4 py-2 ">{r.category}</td>
                  <td className="px-4 py-2 ">
                    {r.fileUrl ? (
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 flex items-center hover:underline"
                      >
                        <MdPictureAsPdf className="mr-1" /> View PDF
                      </a>
                    ) : (
                      <span className="text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-2  flex space-x-4 text-xl">
                    <MdEdit
                      title="Edit"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => handleOpenModal(r)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(r._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Research" : "Add Research"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Research Title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                name="author"
                placeholder="Author Name"
                value={formData.author}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
              />
              <textarea
                name="abstract"
                placeholder="Abstract / Summary"
                rows="4"
                value={formData.abstract}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
              />
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Upload PDF
                </label>
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Upload Thumbnail (optional)
                </label>
                <input
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded p-2"
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
                  {editingItem ? "Update" : "Save"}
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

export default ResearchPage;

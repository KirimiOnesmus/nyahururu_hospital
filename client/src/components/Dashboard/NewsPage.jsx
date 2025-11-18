import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";

const NewsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "", 
    content: "",
    author: "",
    image: null,
  });
  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/news");
      setNewsList(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenModal = (news = null) => {
    setEditingNews(news);
    setFormData(
      news
        ? {
            title: news.title,
            content: news.content,
            author: news.author,
            image: null,
          }
        : { title: "", content: "", author: "", image: null }
    );
    setPreviewImage(news?.imageUrl || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingNews(null);
    setFormData({ title: "", content: "", author: "", image: null });
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
      data.append("content", formData.content);
      data.append("author", formData.author);
      if (formData.image) data.append("image", formData.image);

      if (editingNews) {
        await api.put(`/news/${editingNews._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/news", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchNews();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving news");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;
    try {
      await api.delete(`/news/${id}`);
      fetchNews();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting news");
    }
  };
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
    
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
        >
          Add News
        </button>
      </div>

     
      {loading ? (
        <p>Loading news...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Author</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((n) => (
                <tr key={n._id} className="hover:bg-gray-50 border-b border-gray-300">
                  <td className="px-4 py-2 ">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-2 ">{n.title}</td>
                  <td className="px-4 py-2">{n.author}</td>
                  <td className="px-4 py-2 ">
                    {new Date(n.createdAt).toLocaleDateString(
                      "en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    }
                    )}
                  </td>
                  <td className="px-4 py-2 flex space-x-4 text-xl">
                    <MdEdit
                      title="Edit"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => handleOpenModal(n)}
                    />
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(n._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingNews ? "Edit News" : "Add News"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={formData.author}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <textarea
                name="content"
                placeholder="Content"
                rows="4"
                value={formData.content}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
              <div>
                <label className="block mb-2 text-gray-700">Thumbnail</label>
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
                  {editingNews ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 cursor-pointer"
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

export default NewsPage;

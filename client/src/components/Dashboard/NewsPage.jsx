import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";
import { FaSearch, FaPlusCircle, FaImage, FaRegFileAlt, FaCalendarAlt, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";

const NewsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
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
      setFiltered(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      toast.error("Error fetching news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    const filteredData = newsList.filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.author.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, newsList]);

  const handleOpenModal = (news = null) => {
    setEditingNews(news);
    setFormData(
      news
        ? { title: news.title, content: news.content, author: news.author, image: null }
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
      data.append("content", formData.content);
      data.append("author", formData.author);
      if (formData.image) data.append("image", formData.image);

      if (editingNews) {
        await api.put(`/news/${editingNews._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("News updated successfully!");
      } else {
        await api.post("/news", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("News created successfully!");
      }

      fetchNews();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving news");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;
    try {
      await api.delete(`/news/${id}`);
      fetchNews();
      toast.success("News deleted successfully!");
    } catch (err) {
      console.error(err.response?.data?.message || "Error deleting news");
      toast.error("Error deleting news");
    }
  };

  // Stats
  const stats = {
    total: newsList.length,
    withImage: newsList.filter((n) => n.imageUrl).length,
    withoutImage: newsList.filter((n) => !n.imageUrl).length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">News Management</h1>
        <p className="text-gray-600">Create, edit, and manage hospital news and updates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">Total News</p>
              <h3 className="text-3xl font-bold text-blue-600">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaRegFileAlt className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">With Image</p>
              <h3 className="text-3xl font-bold text-green-600">{stats.withImage}</h3>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center">
              <FaImage className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">Without Image</p>
              <h3 className="text-3xl font-bold text-orange-600">{stats.withoutImage}</h3>
            </div>
            <div className="w-14 h-14 bg-orange-50 rounded-lg flex items-center justify-center">
              <FaImage className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
        <div className="flex-1 relative w-full">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <FaPlusCircle />
          Add News
        </button>
      </div>

      {/* News Table/Cards */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading news...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaRegFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No news found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((n) => (
                    <tr key={n._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        {n.imageUrl ? (
                          <img src={n.imageUrl} alt={n.title} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaImage className="text-gray-400 text-xl" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-2">{n.title}</p>
                    
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          
                          {n.author}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                         
                          {new Date(n.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleOpenModal(n)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <MdEdit className="text-xl" />
                          </button>
                          <button
                            onClick={() => handleDelete(n._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <MdDelete className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {filtered.map((n) => (
                <div key={n._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {n.imageUrl ? (
                        <img src={n.imageUrl} alt={n.title} className="w-24 h-24 object-cover rounded-lg" />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaImage className="text-gray-400 text-2xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{n.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{n.content}</p>
                      <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                        
                          {n.author}
                        </div>
                        <div className="flex items-center gap-2">
                          
                          {new Date(n.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenModal(n)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <MdEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <MdDelete className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingNews ? "Edit News" : "Add New News"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="News Title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  name="author"
                  placeholder="Author Name"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  name="content"
                  placeholder="News Content"
                  rows="5"
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="mt-3 w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingNews ? "Update News" : "Create News"}
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

import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaFileAlt,
  FaUser,
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaDownload,
  FaImage,
  FaBookOpen,
} from "react-icons/fa";
import{toast} from "react-toastify";

const ResearchPage = () => {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    abstract: "",
    category: "",
    pdf: null,
    thumbnail: null,
  });

  const categories = [
    "Medical Research",
    "Clinical Studies",
    "Public Health",
    "Laboratory Research",
    "Epidemiology",
    "Health Policy",
    "Nursing Research",
    "Other"
  ];

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/research");
      setResearch(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      toast.error( "Error fetching research papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

  const filteredResearch = research.filter((item) => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.abstract?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      filterCategory === "all" || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

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
      //alert("Research paper saved successfully!");
      toast.success("Research paper saved successfully!");
    } catch (err) {
      console.error(err.response?.data?.message || "Error saving research paper");
      toast.error("Error saving research paper");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this research paper?"))
      return;
    try {
      await api.delete(`/research/${id}`);
      fetchResearch();
      toast.success("Research paper deleted successfully!");
    } catch (err) {
      console.log(err.response?.data?.message || "Error deleting research");
      toast.error("Error deleting research paper");
    }
  };

  const handleViewResearch = (item) => {
    setSelectedResearch(item);
    setViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Research & Publications
            </h1>
            <p className="text-gray-600">Manage research papers and academic publications</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" />
            Add Research Paper
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Papers</p>
                <h3 className="text-2xl font-bold text-gray-900">{research.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaBookOpen className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">With PDFs</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {research.filter((r) => r.fileUrl).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaFilePdf className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Categories</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {new Set(research.map(r => r.category).filter(Boolean)).size}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaFileAlt className="text-xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">With Thumbnails</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {research.filter((r) => r.thumbnailUrl).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FaImage className="text-xl text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or abstract..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Research Grid */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading research papers...</p>
            </div>
          ) : filteredResearch.length === 0 ? (
            <div className="p-12 text-center">
              <FaBookOpen className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No research papers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredResearch.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBookOpen className="text-5xl text-blue-300" />
                      </div>
                    )}
                    {item.fileUrl && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
                        <FaFilePdf className="mr-1" /> PDF
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FaUser className="mr-2 text-gray-400" />
                      <span className="truncate">{item.author}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.abstract || "No abstract available"}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewResearch(item)}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <FaEye className="mr-1" />
                        View Details
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Research"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Research"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Research Modal */}
      {viewModal && selectedResearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedResearch.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FaUser className="mr-1" />
                      {selectedResearch.author}
                    </div>
                    <span className="text-purple-600 font-semibold">
                      {selectedResearch.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500 text-xl" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedResearch.thumbnailUrl && (
                <div className="mb-6">
                  <img
                    src={selectedResearch.thumbnailUrl}
                    alt={selectedResearch.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-semibold">Abstract</p>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedResearch.abstract || "No abstract available"}
                  </p>
                </div>

                {selectedResearch.fileUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaFilePdf className="text-2xl text-green-600 mr-3" />
                        <div>
                          <p className="font-semibold text-gray-900">PDF Document</p>
                          <p className="text-sm text-gray-600">Full research paper available</p>
                        </div>
                      </div>
                      <a
                        href={selectedResearch.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <FaDownload className="mr-2" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setViewModal(false);
                    handleOpenModal(selectedResearch);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="mr-2" />
                  Edit Research
                </button>
                <button
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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

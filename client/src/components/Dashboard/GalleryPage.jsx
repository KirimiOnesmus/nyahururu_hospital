import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaImage,
  FaVideo,
  FaFolder,
  FaClock,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaUpload,
  FaCheckCircle,
  FaDownload,
  FaEllipsisV,
  FaChevronDown,
  FaTh,
  FaList,
  FaFolderPlus,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const GalleryPage = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [uploadModal, setUploadModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [uploadData, setUploadData] = useState({
    files: [],
    title: "",
    description: "",
    category: "",
    tags: "",
    visible: true,
  });

  //fetch gallery items
  const fetchGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};

      if (filterCategory !== "all") params.category = filterCategory;
      if (filterType !== "all") params.type = filterType;
      if (searchTerm) params.search = searchTerm;

      let sort = "-uploadDate";
      if (sortBy === "oldest") sort = "uploadDate";
      if (sortBy === "alphabetical") sort = "title";
      params.sort = sort;

      const res = await api.get("/gallery", { params });
      setGalleryItems(res.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching gallery";
      console.error("Fetch gallery error:", errorMsg);
      setError(errorMsg);
      setGalleryItems([]);
      toast.error("Error fetching gallery");
    } finally {
      setLoading(false);
    }
  };
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get("/gallery/categories");
      setCategories(res.data.map((cat) => cat.name));
    } catch (err) {
      console.error("Fetch categories error:", err);
      toast.error("Error fetching categories");
    }
  };
  // Mock data - replace with API calls
  useEffect(() => {
    fetchCategories();
    fetchGallery();
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [filterCategory, filterType, sortBy, searchTerm]);

  const stats = {
    totalImages: galleryItems.filter((i) => i.type === "image").length,
    totalVideos: galleryItems.filter((i) => i.type === "video").length,
    totalCategories: categories.length,
    recentItems: galleryItems.filter(
      (i) =>
        new Date(i.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadData({ ...uploadData, files });
  };

  const handleUploadSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!uploadData.files.length || !uploadData.title || !uploadData.category) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      for (const file of uploadData.files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", uploadData.title);
        formData.append("description", uploadData.description);
        formData.append("category", uploadData.category);
        formData.append("tags", uploadData.tags);
        formData.append("visible", uploadData.visible);

        await api.post("/gallery", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(`${uploadData.files.length} file(s) uploaded successfully!`);
      setUploadModal(false);
      setUploadData({
        files: [],
        title: "",
        description: "",
        category: "",
        tags: "",
        visible: true,
      });
      await fetchGallery();
      toast.success("Files uploaded successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error uploading files";
      console.error("Upload error:", errorMsg);
      setError(errorMsg);
      toast.error("Error uploading files");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post("/gallery/categories", { name: newCategory });
      setSuccess("Category added successfully!");
      setNewCategory("");
      await fetchCategories();
      toast.success("Category added successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error adding category";
      setError(errorMsg);
      toast.error("Error adding category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"?`)) return;

    try {
      setError(null);
      setSuccess(null);
      // Find category ID first
      const catRes = await api.get("/gallery/categories");
      const cat = catRes.data.find((c) => c.name === categoryName);
      if (cat) {
        await api.delete(`/gallery/categories/${cat._id}`);
        setSuccess("Category deleted successfully!");
        await fetchCategories();
      }
      toast.success("Category deleted successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error deleting category";
      setError(errorMsg);
      toast.error("Error deleting category");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/gallery/${id}`);
      setSuccess("Item deleted successfully!");
      await fetchGallery();
      toast.success("Item deleted successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error deleting item";
      setError(errorMsg);
      toast.error("Error deleting item");
    }
  };

  const handleToggleVisibility = async (id, currentVisible) => {
    try {
      setError(null);
      setSuccess(null);
      await api.patch(`/gallery/${id}/toggle-visibility`);
      setSuccess(`Item is now ${!currentVisible ? "visible" : "hidden"}`);
      await fetchGallery();
      toast.success("Visibility toggled successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Error toggling visibility";
      setError(errorMsg);
      toast.error("Error toggling visibility");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !selectedItems.length ||
      !window.confirm(`Delete ${selectedItems.length} item(s)?`)
    )
      return;

    try {
      setError(null);
      setSuccess(null);
      await api.post("/gallery/bulk/delete", { ids: selectedItems });
      setSuccess(`${selectedItems.length} item(s) deleted successfully!`);
      setSelectedItems([]);

      await fetchGallery();
      toast.success("Items deleted successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error deleting items";
      setError(errorMsg);
      toast.error("Error deleting items");
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {/* {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <FaExclamationTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

   {success && (
  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
    <FaCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" />
    <p className="text-green-700">{success}</p>
  </div>
)} */}

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gallery Management
            </h1>
            <p className="text-gray-600">
              Manage hospital images, videos, and media content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCategoryModal(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaFolderPlus className="mr-2" />
              Manage Categories
            </button>
            <button
              onClick={() => setUploadModal(true)}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaPlus className="mr-2" />
              Add New Media
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Images</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalImages}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaImage className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Videos</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {stats.totalVideos}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaVideo className="text-xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Categories</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats.totalCategories}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaFolder className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Recent (7 days)</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {stats.recentItems}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FaClock className="text-xl text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, category, or file type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaTh />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} item(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <FaSpinner className="text-4xl text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading gallery...</p>
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="p-12 text-center">
              <FaImage className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No media found</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {galleryItems.map((item) => (
                <div
                  key={item._id}
                  className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => toggleSelection(item._id)}
                    className="absolute top-2 left-2 z-10 w-5 h-5"
                  />

                  <span
                    className={`absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs font-medium ${
                      item.type === "image"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.type === "image" ? (
                      <FaImage className="inline mr-1" />
                    ) : (
                      <FaVideo className="inline mr-1" />
                    )}
                    {item.type}
                  </span>

                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={item.thumbnailUrl || item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(item.uploadDate).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() =>
                          handleToggleVisibility(item._id, item.visible)
                        }
                        className={
                          item.visible ? "text-green-600" : "text-gray-400"
                        }
                      >
                        {item.visible ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {galleryItems.map((item) => (
                <div
                  key={item._id}
                  className="p-4 hover:bg-gray-50 flex items-center gap-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => toggleSelection(item._id)}
                    className="w-5 h-5"
                  />
                  <img
                    src={item.thumbnailUrl || item.fileUrl}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.category} • {item.type}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(item.uploadDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() =>
                      handleToggleVisibility(item._id, item.visible)
                    }
                    className={
                      item.visible ? "text-green-600" : "text-gray-400"
                    }
                  >
                    {item.visible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upload New Media
                </h2>
                <button
                  onClick={() => setUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                    >
                      Browse Files
                    </label>
                    {uploadData.files.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        {uploadData.files.length} file(s) selected
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter media title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={uploadData.tags}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, tags: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                      placeholder="tag1, tag2"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visibility"
                    checked={uploadData.visible}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        visible: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="visibility"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Make this media visible
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setUploadModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={submitting}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaCheckCircle className="mr-2" />
                  )}
                  {submitting ? "Uploading..." : "Upload Media"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {categoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Manage Categories
                </h2>
                <button
                  onClick={() => setCategoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{cat}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;

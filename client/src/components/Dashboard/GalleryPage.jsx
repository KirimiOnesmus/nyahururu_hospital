import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";

const GalleryPage = () => {
      const [galleryItems, setGalleryItems] = useState([]);
  const [categories, setCategories] = useState([
    "Facilities",
    "Doctors & Staff",
    "Events",
    "Equipment",
    "Ambulance & Emergency",
    "Outreach Programs",
  ]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [uploadModal, setUploadModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [uploadData, setUploadData] = useState({
    files: [],
    title: "",
    description: "",
    category: "",
    tags: "",
    visible: true,
  });

  // Mock data - replace with API calls
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        type: "image",
        title: "Main Hospital Building",
        category: "Facilities",
        thumbnail: "https://picsum.photos/400/300?random=1",
        uploadDate: "2024-11-20",
        visible: true,
        tags: ["building", "exterior"],
      },
      {
        id: 2,
        type: "video",
        title: "Emergency Department Tour",
        category: "Facilities",
        thumbnail: "https://picsum.photos/400/300?random=2",
        uploadDate: "2024-11-18",
        visible: true,
        tags: ["emergency", "tour"],
      },
      {
        id: 3,
        type: "image",
        title: "Medical Staff Team",
        category: "Doctors & Staff",
        thumbnail: "https://picsum.photos/400/300?random=3",
        uploadDate: "2024-11-15",
        visible: false,
        tags: ["staff", "team"],
      },
      {
        id: 4,
        type: "image",
        title: "Health Awareness Event",
        category: "Events",
        thumbnail: "https://picsum.photos/400/300?random=4",
        uploadDate: "2024-11-10",
        visible: true,
        tags: ["event", "awareness"],
      },
    ];
    setGalleryItems(mockData);
  }, []);

  const stats = {
    totalImages: galleryItems.filter((i) => i.type === "image").length,
    totalVideos: galleryItems.filter((i) => i.type === "video").length,
    totalCategories: categories.length,
    recentItems: galleryItems.filter(
      (i) => new Date(i.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  const filteredItems = galleryItems
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === "oldest") return new Date(a.uploadDate) - new Date(b.uploadDate);
      if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
      return 0;
    });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadData({ ...uploadData, files });
  };

  const handleUploadSubmit = () => {
    // TODO: Implement upload logic
    console.log("Uploading:", uploadData);
    setUploadModal(false);
    setUploadData({
      files: [],
      title: "",
      description: "",
      category: "",
      tags: "",
      visible: true,
    });
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action}`, selectedItems);
    setSelectedItems([]);
  };

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  return (
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery Management</h1>
            <p className="text-gray-600">Manage hospital images, videos, and media content</p>
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
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalImages}</h3>
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
                <h3 className="text-2xl font-bold text-purple-600">{stats.totalVideos}</h3>
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
                <h3 className="text-2xl font-bold text-green-600">{stats.totalCategories}</h3>
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
                <h3 className="text-2xl font-bold text-orange-600">{stats.recentItems}</h3>
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
                    onClick={() => handleBulkAction("hide")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleBulkAction("move")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Move
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading gallery...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <FaImage className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No media found</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === "image"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {item.type === "image" ? <FaImage className="inline mr-1" /> : <FaVideo className="inline mr-1" />}
                      {item.type}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setEditModal(true);
                          }}
                          className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.uploadDate}</span>
                      {item.visible ? (
                        <span className="flex items-center text-green-600">
                          <FaEye className="mr-1" /> Visible
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-400">
                          <FaEyeSlash className="mr-1" /> Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-5 h-5"
                  />
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.category} • {item.type}</p>
                  </div>
                  <span className="text-sm text-gray-500">{item.uploadDate}</span>
                  {item.visible ? (
                    <span className="text-green-600"><FaEye /></span>
                  ) : (
                    <span className="text-gray-400"><FaEyeSlash /></span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setEditModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Upload New Media</h2>
                <button
                  onClick={() => setUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
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

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter media title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Category & Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
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
                      onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visibility"
                    checked={uploadData.visible}
                    onChange={(e) => setUploadData({ ...uploadData, visible: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="visibility" className="ml-2 text-sm font-medium text-gray-700">
                    Make this media visible on website
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
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaCheckCircle className="mr-2" />
                  Upload Media
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {categoryModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
                <button
                  onClick={() => setCategoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New category name"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{cat}</span>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-600 hover:text-gray-900">
                          <FaEdit />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-700">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryPage
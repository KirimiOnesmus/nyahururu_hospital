import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaGavel,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
  FaSave,
  FaCopy,
  FaFileDownload,
  FaCheckCircle,
  FaClipboardList,
  FaFileAlt,
  FaPaperclip,
  FaAward,
  FaExclamationTriangle,
  FaBan,
  FaHourglass,
  FaUsers,
  FaDollarSign,
  FaChartLine,
  FaFileContract,
} from "react-icons/fa";

const TenderPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [createModal, setCreateModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [bidsModal, setBidsModal] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [selectedTenders, setSelectedTenders] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    tenderNumber: "",
    category: "",
    description: "",
    scopeOfWork: "",
    eligibilityCriteria: "",
    requiredDocuments: "",
    deliverables: "",
    budgetMin: "",
    budgetMax: "",
    publicationDate: "",
    submissionDeadline: "",
    evaluationDate: "",
    visibility: "public",
    status: "draft",
    attachments: [],
  });

  const categories = [
    "Medical Equipment",
    "Drugs & Pharmaceuticals",
    "ICT Services",
    "Construction",
    "Maintenance",
    "Consultancy",
    "Laboratory Supplies",
    "Food Services",
  ];

  const statuses = [
    "draft",
    "active",
    "closed",
    "under_evaluation",
    "awarded",
    "cancelled",
  ];

  // Mock data
  useEffect(() => {
    const mockTenders = [
      {
        id: 1,
        tenderNumber: "TND-2024-001",
        title: "Supply of Medical Equipment",
        category: "Medical Equipment",
        description: "Tender for supply of various medical equipment...",
        publicationDate: "2024-11-15",
        submissionDeadline: "2024-12-15",
        evaluationDate: "2024-12-20",
        status: "active",
        bidsReceived: 5,
        budgetRange: "$50,000 - $100,000",
        createdBy: "Admin John",
        createdAt: "2024-11-15",
      },
      {
        id: 2,
        tenderNumber: "TND-2024-002",
        title: "ICT Infrastructure Upgrade",
        category: "ICT Services",
        description: "Complete hospital network and server upgrade...",
        publicationDate: "2024-11-10",
        submissionDeadline: "2024-11-30",
        evaluationDate: "2024-12-05",
        status: "active",
        bidsReceived: 8,
        budgetRange: "$200,000 - $300,000",
        createdBy: "Admin Sarah",
        createdAt: "2024-11-10",
      },
      {
        id: 3,
        tenderNumber: "TND-2024-003",
        title: "Annual Drug Supply Contract",
        category: "Drugs & Pharmaceuticals",
        description: "One-year contract for pharmaceutical supplies...",
        publicationDate: "2024-10-01",
        submissionDeadline: "2024-11-01",
        evaluationDate: "2024-11-05",
        status: "under_evaluation",
        bidsReceived: 12,
        budgetRange: "$500,000 - $750,000",
        createdBy: "Admin Mary",
        createdAt: "2024-10-01",
      },
      {
        id: 4,
        tenderNumber: "TND-2024-004",
        title: "Building Maintenance Services",
        category: "Maintenance",
        description: "Comprehensive maintenance services for 2025...",
        publicationDate: "2024-09-15",
        submissionDeadline: "2024-10-15",
        evaluationDate: "2024-10-20",
        status: "awarded",
        bidsReceived: 6,
        budgetRange: "$80,000 - $120,000",
        awardedTo: "ABC Maintenance Ltd",
        createdBy: "Admin John",
        createdAt: "2024-09-15",
      },
      {
        id: 5,
        tenderNumber: "TND-2024-005",
        title: "Laboratory Equipment Supply",
        category: "Laboratory Supplies",
        description: "Modern laboratory equipment procurement...",
        publicationDate: "2024-08-20",
        submissionDeadline: "2024-09-20",
        evaluationDate: "2024-09-25",
        status: "closed",
        bidsReceived: 4,
        budgetRange: "$150,000 - $200,000",
        createdBy: "Admin Sarah",
        createdAt: "2024-08-20",
      },
    ];
    setTenders(mockTenders);
  }, []);

  // Mock bids data
  const mockBids = [
    {
      id: 1,
      vendorName: "MedTech Solutions",
      bidAmount: "$85,000",
      submissionDate: "2024-11-28",
      status: "submitted",
      documents: ["proposal.pdf", "technical_specs.pdf"],
      score: 0,
    },
    {
      id: 2,
      vendorName: "Global Medical Supplies",
      bidAmount: "$92,000",
      submissionDate: "2024-11-29",
      status: "under_review",
      documents: ["proposal.pdf", "company_profile.pdf"],
      score: 85,
    },
    {
      id: 3,
      vendorName: "HealthCare Partners",
      bidAmount: "$78,000",
      submissionDate: "2024-11-27",
      status: "shortlisted",
      documents: ["proposal.pdf", "certifications.pdf"],
      score: 92,
    },
  ];

  const stats = {
    total: tenders.length,
    active: tenders.filter((t) => t.status === "active").length,
    closed: tenders.filter((t) => t.status === "closed").length,
    underEvaluation: tenders.filter((t) => t.status === "under_evaluation").length,
    awarded: tenders.filter((t) => t.status === "awarded").length,
  };

  const filteredTenders = tenders
    .filter((tender) => {
      const matchesSearch =
        tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.tenderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || tender.category === filterCategory;
      const matchesStatus = filterStatus === "all" || tender.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
      if (sortBy === "deadline") return new Date(a.submissionDeadline) - new Date(b.submissionDeadline);
      return 0;
    });

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: FaFileAlt },
      active: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: FaCheckCircle },
      closed: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: FaBan },
      under_evaluation: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: FaHourglass },
      awarded: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FaAward },
      cancelled: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: FaTimes },
    };
    const statusConfig = config[status] || config.draft;
    const Icon = statusConfig.icon;
    const displayText = status.replace("_", " ");

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        <Icon className="mr-1" />
        {displayText.charAt(0).toUpperCase() + displayText.slice(1)}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Medical Equipment": "text-blue-600 bg-blue-50",
      "Drugs & Pharmaceuticals": "text-purple-600 bg-purple-50",
      "ICT Services": "text-cyan-600 bg-cyan-50",
      Construction: "text-orange-600 bg-orange-50",
      Maintenance: "text-green-600 bg-green-50",
      Consultancy: "text-indigo-600 bg-indigo-50",
      "Laboratory Supplies": "text-pink-600 bg-pink-50",
      "Food Services": "text-yellow-600 bg-yellow-50",
    };
    return colors[category] || "text-gray-600 bg-gray-50";
  };

  const generateTenderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `TND-${year}-${random}`;
  };

  const handleCreateTender = () => {
    if (!formData.tenderNumber) {
      formData.tenderNumber = generateTenderNumber();
    }
    console.log("Creating tender:", formData);
    setCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      tenderNumber: "",
      category: "",
      description: "",
      scopeOfWork: "",
      eligibilityCriteria: "",
      requiredDocuments: "",
      deliverables: "",
      budgetMin: "",
      budgetMax: "",
      publicationDate: "",
      submissionDeadline: "",
      evaluationDate: "",
      visibility: "public",
      status: "draft",
      attachments: [],
    });
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action}`, selectedTenders);
    setSelectedTenders([]);
  };

  const toggleSelection = (id) => {
    setSelectedTenders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExtendDeadline = (tender) => {
    console.log("Extending deadline for:", tender.tenderNumber);
  };

  const handleCloseTender = (tender) => {
    console.log("Closing tender:", tender.tenderNumber);
  };

  const handleAwardTender = (tender) => {
    console.log("Awarding tender:", tender.tenderNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FaGavel className="mr-3 text-blue-600" />
              Tender Management
            </h1>
            <p className="text-gray-600">Manage procurement tenders and bids</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Export functionality")}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaFileDownload className="mr-2" />
              Export
            </button>
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaPlus className="mr-2" />
              Create New Tender
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div
            onClick={() => setFilterStatus("all")}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tenders</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaGavel className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("active")}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("closed")}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Closed</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.closed}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FaBan className="text-xl text-red-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("under_evaluation")}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Evaluating</p>
                <h3 className="text-2xl font-bold text-yellow-600">{stats.underEvaluation}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FaHourglass className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("awarded")}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Awarded</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.awarded}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaAward className="text-xl text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, tender number, or description..."
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
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="under_evaluation">Under Evaluation</option>
                  <option value="awarded">Awarded</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="deadline">Deadline Soonest</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTenders.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTenders.length} tender(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("close")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Close Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction("category")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Change Category
                  </button>
                  <button
                    onClick={() => handleBulkAction("export")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedTenders([])}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tenders Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading tenders...</p>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="p-12 text-center">
              <FaGavel className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenders(filteredTenders.map((t) => t.id));
                          } else {
                            setSelectedTenders([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Tender ID / Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Publication Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Bids
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTenders.includes(tender.id)}
                          onChange={() => toggleSelection(tender.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{tender.title}</p>
                          <p className="text-sm text-gray-500">{tender.tenderNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tender.category)}`}>
                          {tender.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{tender.publicationDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaClock className="mr-2 text-gray-400" />
                          {tender.submissionDeadline}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedTender(tender);
                            setBidsModal(true);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          <FaClipboardList className="mr-1" />
                          {tender.bidsReceived} bids
                        </button>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(tender.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTender(tender);
                              setDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {
                              setFormData(tender);
                              setCreateModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          {tender.status === "active" && (
                            <>
                              <button
                                onClick={() => handleExtendDeadline(tender)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Extend Deadline"
                              >
                                <FaClock />
                              </button>
                              <button
                                onClick={() => handleCloseTender(tender)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Close Tender"
                              >
                                <FaBan />
                              </button>
                            </>
                          )}
                          {tender.status === "under_evaluation" && (
                            <button
                              onClick={() => handleAwardTender(tender)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Award Tender"
                            >
                              <FaAward />
                            </button>
                          )}
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formData.id ? "Edit Tender" : "Create New Tender"}
                </h2>
                <button
                  onClick={() => {
                    setCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaFileContract className="mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Title & Tender Number */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tender Number *
                        </label>
                        <input
                          type="text"
                          value={formData.tenderNumber}
                          onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                          placeholder="Auto-generated"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    </div>

                    {/* Tender Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Supply of Medical Equipment"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        placeholder="Provide a brief description of the tender..."
                      />
                    </div>
                  </div>
                </div>

                {/* Tender Requirements Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaClipboardList className="mr-2 text-blue-600" />
                    Tender Requirements
                  </h3>

                  <div className="space-y-4">
                    {/* Scope of Work */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scope of Work *
                      </label>
                      <textarea
                        value={formData.scopeOfWork}
                        onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Detailed scope of work required..."
                      />
                    </div>

                    {/* Eligibility Criteria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Eligibility Criteria
                      </label>
                      <textarea
                        value={formData.eligibilityCriteria}
                        onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="List eligibility requirements for vendors..."
                      />
                    </div>

                    {/* Required Documents */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Documents
                      </label>
                      <textarea
                        value={formData.requiredDocuments}
                        onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="List all required documents (e.g., Company registration, tax certificates...)"
                      />
                    </div>

                    {/* Deliverables */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deliverables
                      </label>
                      <textarea
                        value={formData.deliverables}
                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Expected deliverables and timeline..."
                      />
                    </div>

                    {/* Budget Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Budget (Optional)
                        </label>
                        <input
                          type="number"
                          value={formData.budgetMin}
                          onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Budget (Optional)
                        </label>
                        <input
                          type="number"
                          value={formData.budgetMax}
                          onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="100000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-600" />
                    Important Dates
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publication Date *
                      </label>
                      <input
                        type="date"
                        value={formData.publicationDate}
                        onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Deadline *
                      </label>
                      <input
                        type="date"
                        value={formData.submissionDeadline}
                        onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Evaluation Date
                      </label>
                      <input
                        type="date"
                        value={formData.evaluationDate}
                        onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaPaperclip className="mr-2 text-blue-600" />
                    Attachments
                  </h3>

                  <label className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="text-center">
                      <FaPaperclip className="text-3xl text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-600">Click to upload tender documents</span>
                      <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, XLS (Max 10MB each)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Visibility & Status */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visibility & Status</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visibility
                      </label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="public">Public (appears on website)</option>
                        <option value="internal">Internal Only</option>
                        <option value="restricted">Restricted Access</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, status: "draft" });
                      handleCreateTender();
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, status: "active" });
                      handleCreateTender();
                    }}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaSave className="mr-2" />
                    {formData.id ? "Update Tender" : "Publish Tender"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsModal && selectedTender && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTender.title}</h2>
                      {getStatusBadge(selectedTender.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedTender.tenderNumber} • Created by {selectedTender.createdBy} on {selectedTender.createdAt}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FaClipboardList className="mr-2" />
                      Tender Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Category:</span>
                        <span className={`text-sm px-2 py-1 rounded font-medium ${getCategoryColor(selectedTender.category)}`}>
                          {selectedTender.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Budget Range:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedTender.budgetRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Bids Received:</span>
                        <span className="text-sm font-medium text-blue-600">{selectedTender.bidsReceived} bids</span>
                      </div>
                      {selectedTender.awardedTo && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Awarded To:</span>
                          <span className="text-sm font-medium text-green-600">{selectedTender.awardedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Important Dates
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Publication:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedTender.publicationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Deadline:</span>
                        <span className="text-sm font-medium text-red-600">{selectedTender.submissionDeadline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Evaluation:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedTender.evaluationDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaFileAlt className="mr-2" />
                    Description
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTender.description}</p>
                </div>

                {/* Attachments */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaPaperclip className="mr-2" />
                    Tender Documents
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FaFileAlt className="text-red-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tender_Document.pdf</p>
                          <p className="text-xs text-gray-500">2.5 MB</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FaFileAlt className="text-red-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Technical_Specifications.pdf</p>
                          <p className="text-xs text-gray-500">1.8 MB</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity History</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Tender published</p>
                        <p className="text-xs text-gray-500">{selectedTender.publicationDate} by {selectedTender.createdBy}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">First bid received</p>
                        <p className="text-xs text-gray-500">2 days after publication</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => {
                    setFormData(selectedTender);
                    setDetailsModal(false);
                    setCreateModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="mr-2" />
                  Edit Tender
                </button>
                <button
                  onClick={() => {
                    setDetailsModal(false);
                    setBidsModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaClipboardList className="mr-2" />
                  View Bids ({selectedTender.bidsReceived})
                </button>
                {selectedTender.status === "active" && (
                  <button
                    onClick={() => handleCloseTender(selectedTender)}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <FaBan className="mr-2" />
                    Close Tender
                  </button>
                )}
                <button
                  onClick={() => setDetailsModal(false)}
                  className="ml-auto px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bids Management Modal */}
        {bidsModal && selectedTender && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bid Submissions</h2>
                    <p className="text-sm text-gray-500">
                      {selectedTender.tenderNumber} • {selectedTender.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setBidsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Bids Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Vendor Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Bid Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Submission Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockBids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaUsers className="text-gray-400 mr-3" />
                              <span className="font-medium text-gray-900">{bid.vendorName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-green-600 font-semibold">
                              <FaDollarSign className="mr-1" />
                              {bid.bidAmount}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{bid.submissionDate}</td>
                          <td className="px-6 py-4">
                            {bid.score > 0 ? (
                              <div className="flex items-center">
                                <FaChartLine className="text-blue-600 mr-2" />
                                <span className="font-medium text-blue-600">{bid.score}/100</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not scored</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {bid.status === "submitted" && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Submitted
                              </span>
                            )}
                            {bid.status === "under_review" && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                Under Review
                              </span>
                            )}
                            {bid.status === "shortlisted" && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Shortlisted
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Documents"
                              >
                                <FaEye />
                              </button>
                              <button
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Score Bid"
                              >
                                <FaChartLine />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Award tender to ${bid.vendorName}?`)) {
                                    console.log("Awarding to:", bid.vendorName);
                                  }
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Award Tender"
                              >
                                <FaAward />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Evaluation Summary */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Evaluation Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Bids:</span>
                      <span className="ml-2 font-medium text-blue-900">{mockBids.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Shortlisted:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {mockBids.filter(b => b.status === "shortlisted").length}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Under Review:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {mockBids.filter(b => b.status === "under_review").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bids Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => alert("Export bids to PDF/Excel")}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FaFileDownload className="mr-2" />
                  Export Bids
                </button>
                <button
                  onClick={() => setBidsModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default TenderPage;
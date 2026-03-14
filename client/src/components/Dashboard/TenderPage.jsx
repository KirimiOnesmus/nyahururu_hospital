import React, { useState, useEffect } from "react";
import {
  FaPlus, FaSearch, FaFilter, FaGavel, FaCalendarAlt, FaClock,
  FaEdit, FaTrash, FaEye, FaTimes, FaSave, FaCopy, FaFileDownload,
  FaCheckCircle, FaClipboardList, FaFileAlt, FaPaperclip, FaAward,
  FaExclamationTriangle, FaBan, FaHourglass, FaUsers, FaDollarSign,
  FaChartLine, FaFileContract, FaBullhorn,
} from "react-icons/fa";
import api from "../../api/axios";
import{toast} from "react-toastify";

// Helper function to generate a unique tender number
const generateTenderNumber = () => {
  const year = new Date().getFullYear();
  // Using a more robust random identifier
  const random = Math.floor(Math.random() * 90000 + 10000).toString(); 
  return `TND-${year}-${random}`;
};

const TenderPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Modal States
  const [createModal, setCreateModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [bidsModal, setBidsModal] = useState(false);
  
  const [selectedTender, setSelectedTender] = useState(null);
  const [selectedTenders, setSelectedTenders] = useState([]);
  const [bids, setBids] = useState([]);
  const [modalError, setModalError] = useState(""); // Error specific to the active modal

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    underEvaluation: 0,
    awarded: 0,
  });

  const initialFormData = {
    title: "",
    tenderNumber: generateTenderNumber(), // Initialize with a number
    category: "",
    description: "",
    scopeOfWork: "",
    eligibilityCriteria: "",
    requiredDocuments: "",
    deliverables: "",
    budgetMin: "",
    budgetMax: "",
    publicationDate: new Date().toISOString().split("T")[0], // Set default to today
    submissionDeadline: "",
    evaluationDate: "",
    visibility: "public",
    status: "draft",
    attachments: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const categories = [
    "Medical Equipment", "Drugs & Pharmaceuticals", "ICT Services",
    "Construction", "Maintenance", "Consultancy", "Laboratory Supplies",
    "Food Services", "Others"
  ];

  // --- API Handlers (Refined) ---

  useEffect(() => {
    fetchTenders();
  }, [searchTerm, filterCategory, filterStatus, sortBy]); // Dependencies trigger fetch

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        search: searchTerm || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        sortBy,
      };
      
      const res = await api.get("/tenders", { params });
      if (res.data.success) {
        // Assume the backend handles filtering/sorting based on params
        setTenders(res.data.data); 
        setStats(res.data.stats);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error fetching tenders";
      setError(errorMsg);
      console.error("Error fetching tenders:", err);
      toast.error("Error fetching tenders");
    } finally {
      setLoading(false);
    }
  };

  const fetchBidsByTender = async (tenderId) => {
    setBids([]);
    try {
      setLoading(true);
      const res = await api.get(`/bids/tender/${tenderId}`);
      if (res.data.success) {
        setBids(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
      setModalError("Error fetching bids for this tender.");
      toast.error("Error fetching bids for this tender.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTender = async (e) => {
    e.preventDefault();
    setModalError("");
    setLoading(true);

    try {
      if (!formData.title || !formData.category || !formData.description) {
        setModalError("Please fill in all required fields (Title, Category, Description).");
        toast.error("Please fill in all required fields (Title, Category, Description).");
        setLoading(false);
        return;
      }
      
      const fd = new FormData();
      for (const key in formData) {
        if (key !== "attachments" && formData[key] !== null) {
          fd.append(key, formData[key]);
        }
      }
      
      if (formData.attachments) {
        for (let i = 0; i < formData.attachments.length; i++) {
          fd.append("attachments", formData.attachments[i]);
        }
      }

      let res;
      // Use _id for consistency
      if (formData._id) { 
        res = await api.put(`/tenders/${formData._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/tenders", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      if (res.data.success) {
        setCreateModal(false);
        resetForm();
        fetchTenders();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error saving tender";
      setModalError(errorMsg); // Use modal-specific error
      console.error("Error saving tender:", err);
      toast.error("Error saving tender");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTender = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tender?")) return;
    try {
      setLoading(true);
      const res = await api.delete(`/tenders/${id}`);
      if (res.data.success) {
        fetchTenders();
        // Clear global error if set
        setError(""); 
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting tender";
      setError(errorMsg);
      console.error(err);
      toast.error("Error deleting tender");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTenders.length === 0) {
      setError("Please select tenders to delete");
      return;
    }
    if (!window.confirm(`Delete ${selectedTenders.length} tenders?`)) return;
    
    try {
      setLoading(true);
      const res = await api.post("/tenders/bulk-delete", {
        ids: selectedTenders,
      });
      if (res.data.success) {
        setSelectedTenders([]);
        fetchTenders();
        setError("");
      }
      toast.success("Selected tenders deleted successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting tenders";
      setError(errorMsg);
      console.error(err);
      toast.error("Error deleting tenders");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTender = async (tender) => {
    if (!window.confirm(`Are you sure you want to close tender: ${tender.title}?`)) return;
    try {
      setLoading(true);
      const res = await api.patch(`/tenders/${tender._id}/close`);
      if (res.data.success) {
        fetchTenders();
        setDetailsModal(false);
      }
      toast.success("Tender closed successfully");
    } catch (err) {
      setError("Error closing tender");
      console.error(err);
      toast.error("Error closing tender");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendDeadline = async (tender) => {
    const defaultDate = new Date(tender.submissionDeadline).toISOString().split("T")[0];
    const newDeadline = prompt("Enter new deadline (YYYY-MM-DD):", defaultDate);
    
    if (!newDeadline) return;

    // Simple date validation
    if (isNaN(Date.parse(newDeadline))) {
        alert("Invalid date format. Please use YYYY-MM-DD.");
        return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/tenders/${tender._id}/extend-deadline`, {
        newDeadline,
      });
      if (res.data.success) {
        fetchTenders();
        setSelectedTender(prev => ({...prev, submissionDeadline: newDeadline}));
      }
      toast.success("Deadline extended successfully");
    } catch (err) {
      setError("Error extending deadline");
      console.error(err);
      toast.error("Error extending deadline");
    } finally {
      setLoading(false);
    }
  };

  const handleAwardTender = async (tender, vendorId) => {
    if (!window.confirm("Confirm awarding this tender to the selected vendor?")) return;

    try {
      setLoading(true);
      const res = await api.patch(`/tenders/${tender._id}/award`, {
        awardedTo: vendorId,
      });
      if (res.data.success) {
        fetchTenders();
        setBidsModal(false);
      }
      toast.success("Tender awarded successfully");
    } catch (err) {
      setError("Error awarding tender");
      console.error(err);
      toast.error("Error awarding tender");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreBid = async (bidId, technical, financial, notes) => {
    // In a real app, this would be handled within a Bid scoring form component
    console.log(`Scoring bid ${bidId}: Tech=${technical}, Fin=${financial}`);
    try {
      setLoading(true);
      const res = await api.patch(`/bids/${bidId}/score`, {
        technical,
        financial,
        evaluationNotes: notes,
      });
      if (res.data.success) {
        fetchBidsByTender(selectedTender._id);
      }
    } catch (err) {
      setError("Error scoring bid");
      console.error(err);
      toast.error("Error scoring bid");
    } finally {
      setLoading(false);
    }
  };

  // --- Utility Functions ---

  const resetForm = () => {
    setFormData(initialFormData);
    setFormData(prev => ({...prev, tenderNumber: generateTenderNumber()})); // Ensure new number for next creation
    setModalError("");
  };

  const handleAttachmentChange = (e) => {
    setFormData({ ...formData, attachments: e.target.files });
  };
  
  const handleEditClick = (tender) => {
    // Ensure dates are formatted correctly for input type="date"
    const formattedTender = {
        ...tender,
        publicationDate: tender.publicationDate ? new Date(tender.publicationDate).toISOString().split("T")[0] : '',
        submissionDeadline: tender.submissionDeadline ? new Date(tender.submissionDeadline).toISOString().split("T")[0] : '',
        evaluationDate: tender.evaluationDate ? new Date(tender.evaluationDate).toISOString().split("T")[0] : '',
    };

    setFormData(formattedTender);
    setCreateModal(true);
    setModalError("");
  };

  const toggleSelection = (id) => {
    setSelectedTenders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  
  // Note: Client-side filtering/sorting removed to rely fully on server-side implementation
  // as defined in fetchTenders and useEffect.
  const displayedTenders = tenders; 

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
    const displayText = status.replace(/_/g, " ");
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
  
  const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      // Ensure the string is in a standard format before parsing
      const date = new Date(dateString); 
      // Add one day to account for potential timezone shift during creation
      // date.setDate(date.getDate() + 1); 
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatCurrency = (amount) => {
      if (!amount) return "N/A";
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // --- JSX Rendering ---

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Error Alert */}
        {/* {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center">
                <FaExclamationTriangle className="text-red-600 mr-3" />
                <span className="text-red-700 font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800 p-1 rounded-full">
              <FaTimes />
            </button>
          </div>
        )} */}
        
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
              onClick={() => alert("Export functionality coming soon")}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaFileDownload className="mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setCreateModal(true);
              }}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <FaPlus className="mr-2" />
              Create New Tender
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {/* ... Stats Card JSX remains the same ... */}
          <div
            onClick={() => setFilterStatus("all")}
            className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tenders</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaGavel className="text-lg sm:text-xl text-blue-600" />
              </div>
            </div>
          </div>
          <div
            onClick={() => setFilterStatus("active")}
            className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <h3 className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</h3>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-lg sm:text-xl text-green-600" />
              </div>
            </div>
          </div>
          <div
            onClick={() => setFilterStatus("closed")}
            className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Closed</p>
                <h3 className="text-xl sm:text-2xl font-bold text-red-600">{stats.closed}</h3>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FaBan className="text-lg sm:text-xl text-red-600" />
              </div>
            </div>
          </div>
          <div
            onClick={() => setFilterStatus("under_evaluation")}
            className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Evaluating</p>
                <h3 className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.underEvaluation}</h3>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FaHourglass className="text-lg sm:text-xl text-yellow-600" />
              </div>
            </div>
          </div>
          <div
            onClick={() => setFilterStatus("awarded")}
            className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Awarded</p>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-600">{stats.awarded}</h3>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaAward className="text-lg sm:text-xl text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
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
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex items-center">
                    <FaFilter className="absolute left-3 text-gray-400 pointer-events-none" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                </div>
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
            {selectedTenders.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTenders.length} tender(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkDelete()}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <FaTrash className="inline mr-1" />
                    Delete ({selectedTenders.length})
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
          {loading && !tenders.length ? ( // Show full spinner only on initial load
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading tenders...</p>
            </div>
          ) : displayedTenders.length === 0 ? (
            <div className="p-12 text-center">
              <FaGavel className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenders found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTenders.length === displayedTenders.length && displayedTenders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenders(displayedTenders.map((t) => t._id));
                          } else {
                            setSelectedTenders([]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tender ID / Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Publication Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Bids
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedTenders.map((tender) => (
                    <tr key={tender._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTenders.includes(tender._id)}
                          onChange={() => toggleSelection(tender._id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(tender.publicationDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaClock className="mr-2 text-gray-400" />
                          {formatDate(tender.submissionDeadline)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedTender(tender);
                            fetchBidsByTender(tender._id);
                            setBidsModal(true);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                          disabled={tender.status === "draft"}
                        >
                          <FaClipboardList className="mr-1" />
                          {tender.bidsCount || 0} Bids
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
                          {(tender.status === "draft" || tender.status === "active") && (
                            <button
                              onClick={() => handleEditClick(tender)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                          )}
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
                          <button
                            onClick={() => handleDeleteTender(tender._id)}
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
        
        {/* --- MODALS --- */}

        {/* Create/Edit Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleCreateTender} className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formData._id ? "Edit Tender" : "Create New Tender"}
                </h2>
                <button
                  type="button"
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
                 {/* Modal Error Alert */}
                {/* {modalError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                        <FaExclamationTriangle className="inline mr-2" />
                        {modalError}
                    </div>
                )} */}
                
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaFileContract className="mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Tender Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Title *
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Supply of Medical Equipment"
                        required
                      />
                    </div>
                    {/* Tender Number & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="tenderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          Tender Number
                        </label>
                        <input
                          id="tenderNumber"
                          type="text"
                          value={formData.tenderNumber}
                          // Allow manual input only if it's new (though auto-gen is better)
                          onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })} 
                          disabled={!!formData._id} // Disable editing once created
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
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
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        placeholder="Provide a brief description of the tender..."
                        required
                      />
                    </div>
                     {/* Scope of Work */}
                    <div>
                      <label htmlFor="scopeOfWork" className="block text-sm font-medium text-gray-700 mb-2">
                        Scope of Work / Requirements
                      </label>
                      <textarea
                        id="scopeOfWork"
                        value={formData.scopeOfWork}
                        onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Detailed requirements and expected outcomes..."
                      />
                    </div>
                  </div>
                </div>
                
                {/* Timeline and Budget Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-600" />
                    Timeline & Budget
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Publication Date
                      </label>
                      <input
                        id="publicationDate"
                        type="date"
                        value={formData.publicationDate}
                        onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="submissionDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Deadline
                      </label>
                      <input
                        id="submissionDeadline"
                        type="date"
                        value={formData.submissionDeadline}
                        onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="evaluationDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Planned Evaluation Date
                      </label>
                      <input
                        id="evaluationDate"
                        type="date"
                        value={formData.evaluationDate}
                        onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                     <div>
                      <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range (Min)
                      </label>
                      <input
                        id="budgetMin"
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        placeholder="Kshs"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range (Max)
                      </label>
                      <input
                        id="budgetMax"
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                        placeholder="Kshs"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active (Published)</option>
                        <option value="closed">Closed</option>
                        <option value="under_evaluation">Under Evaluation</option>
                        <option value="awarded">Awarded</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                 {/* Documents and Attachments Section */}
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FaPaperclip className="mr-2 text-blue-600" />
                        Documents & Attachments
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="requiredDocuments" className="block text-sm font-medium text-gray-700 mb-2">
                                Required Documents from Vendors
                            </label>
                            <textarea
                                id="requiredDocuments"
                                value={formData.requiredDocuments}
                                onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="e.g., Company Registration, Tax Certificate, Technical Proposal..."
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Tender Documents
                            </label>
                            <input
                                id="attachments"
                                type="file"
                                onChange={handleAttachmentChange}
                                multiple
                                className="w-full p-2 border border-gray-200 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                {formData._id && "Current documents will be replaced or appended (server-dependent)."}
                                {!formData._id && "Upload relevant documents (e.g., RFP, Scope, Drawings)."}
                            </p>
                            {/* Display existing attachments if editing */}
                            {formData._id && tender.attachments && tender.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-semibold text-gray-600">Existing Attachments:</p>
                                    {/* Map through existing attachments (assuming structure: [{filename, url}]) */}
                                    {tender.attachments.map((file, index) => (
                                        <a 
                                            key={index}
                                            href={file.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
                                        >
                                            <FaPaperclip className="mr-1" /> {file.filename}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FaSave className="mr-2" />
                  )}
                  {formData._id ? "Save Changes" : "Create Tender"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tender Details Modal */}
        {detailsModal && selectedTender && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaEye className="mr-2 text-blue-600" />
                  Tender Details: {selectedTender.tenderNumber}
                </h2>
                <button
                  onClick={() => setDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">{selectedTender.title}</h3>
                <div className="flex flex-wrap items-center gap-4">
                    {getStatusBadge(selectedTender.status)}
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getCategoryColor(selectedTender.category)}`}>
                      {selectedTender.category}
                    </span>
                    <span className="text-sm text-gray-600 flex items-center">
                        <FaUsers className="mr-1" /> {selectedTender.visibility.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <DetailItem icon={FaFileAlt} label="Description" value={selectedTender.description} full />
                    <DetailItem icon={FaBullhorn} label="Scope of Work" value={selectedTender.scopeOfWork} full />
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <DetailItem icon={FaCalendarAlt} label="Publication Date" value={formatDate(selectedTender.publicationDate)} />
                    <DetailItem icon={FaClock} label="Submission Deadline" value={formatDate(selectedTender.submissionDeadline)} />
                    <DetailItem icon={FaCalendarAlt} label="Evaluation Date" value={formatDate(selectedTender.evaluationDate)} />
                    <DetailItem icon={FaDollarSign} label="Budget Range" value={`${formatCurrency(selectedTender.budgetMin)} - ${formatCurrency(selectedTender.budgetMax)}`} />
                    <DetailItem icon={FaClipboardList} label="Required Documents" value={selectedTender.requiredDocuments || "None specified"} />
                    <DetailItem icon={FaAward} label="Awarded To" value={selectedTender.awardedTo?.name || (selectedTender.status === "awarded" ? "Vendor ID needed" : "N/A")} />
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><FaPaperclip className="mr-2" /> Attachments ({selectedTender.attachments?.length || 0})</h4>
                    {selectedTender.attachments && selectedTender.attachments.length > 0 ? (
                        <div className="space-y-1">
                            {selectedTender.attachments.map((file, index) => (
                                <a 
                                    key={index}
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    <FaFileDownload className="inline mr-1" /> {file.filename}
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No documents attached.</p>
                    )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDetailsModal(false);
                    setSelectedTender(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bids Modal */}
        {bidsModal && selectedTender && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaClipboardList className="mr-2 text-blue-600" />
                  Bids for: {selectedTender.title}
                </h2>
                <button
                  onClick={() => setBidsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading bids...</p>
                    </div>
                ) : bids.length === 0 ? (
                    <div className="p-8 text-center">
                        <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-3" />
                        <p className="text-gray-500">No bids received yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Total Bids: <span className="font-semibold">{bids.length}</span></p>
                        <div className="overflow-x-auto border border-gray-100 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technical Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Score</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bids.map((bid) => (
                                        <tr key={bid._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bid.vendorName || "Anonymous Vendor"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{formatCurrency(bid.bidAmount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(bid.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bid.technicalScore || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bid.financialScore || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                                <button
                                                    onClick={() => alert(`View details for Bid ID: ${bid._id}`)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="View Bid Documents"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => alert(`Score Bid functionality for Bid ID: ${bid._id}`)}
                                                    className="text-yellow-600 hover:text-yellow-900 p-1"
                                                    title="Score Bid (Placeholder)"
                                                >
                                                    <FaChartLine />
                                                </button>
                                                {selectedTender.status !== 'awarded' && (
                                                    <button
                                                        onClick={() => handleAwardTender(selectedTender, bid.vendorId)}
                                                        className="text-green-600 hover:text-green-900 p-1"
                                                        title="Award Tender to this Bid"
                                                    >
                                                        <FaAward />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setBidsModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
};

// Helper component for Details Modal
const DetailItem = ({ icon: Icon, label, value, full = false }) => (
    <div className={full ? "col-span-2" : ""}>
        <p className="text-xs font-semibold text-gray-500 uppercase flex items-center">
            <Icon className="mr-1" /> {label}
        </p>
        <p className="text-base text-gray-800 mt-1">{value || "N/A"}</p>
    </div>
);

export default TenderPage;
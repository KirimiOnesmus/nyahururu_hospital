import React, { useEffect, useState, useRef, use } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import {
  FaSave,
  FaTimes,
  FaDownload,
  FaFilePdf,
  FaImage,
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUpload,
  FaLock,
} from "react-icons/fa";
import {toast} from "react-toastify";

const defaultUser = {
  firstName: "",
  lastName: "",
  role: "",
  employeeId: "",
  bloodGroup: "",
  email: "",
  phone: "",
  rfid: "",
  photo: "",
  joinDate: "",
  expiryDate: "",
  signatureText: "Your Sincerely",
  terms:
    "By using this card you agree to the hospital rules and policies. Lost cards must be reported immediately.",
  department: "",
};

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(defaultUser);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [categories, setCategories] = useState([]); 
  const [loadingCategories, setLoadingCategories] = useState(false);

  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || id === "new") return;
      try {
        setLoading(true);
        const res = await api.get(`/users/${id}`);
        setUser({ ...defaultUser, ...res.data });
        console.log("Fetched user:", res.data);
      } catch (err) {
        console.error(
          "Failed to fetch user:",
          err.response?.data?.message || err.message
        );
        toast.error("Failed to load user. Redirecting to users list.");
        navigate("/dashboard/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await api.get("/services");
        
        const uniqueCategories = [...new Set(
          res.data
            .map(s => s.category)
            .filter(Boolean)
        )];
        
        setCategories(uniqueCategories.sort());
       
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);


  const updateField = (field, value) => {
    setUser((p) => ({ ...p, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField("photo", reader.result); // base64 string
    };
    reader.readAsDataURL(file);
  };

  // const handleSave = async (e) => {
  //   e.preventDefault();

  //   // Validate required fields
  //   if (!user.firstName || !user.lastName || !user.email || !user.role) {
  //     alert(
  //       "Please fill in all required fields: First Name, Last Name, Email, and Role"
  //     );
  //     return;
  //   }
  //      if (user.role.toLowerCase() === "doctor" && !user.department) {
  //     alert("Please select a department for this doctor");
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     const { ...userData } = user;

  //     if (userData.role) {
  //       userData.role = userData.role.toLowerCase().trim();
  //     }

  //     if (id === "new") {
  //       const res = await api.post("/users", userData);
  //       toast.success(
  //         "User created successfully! Employee ID and RFID have been generated."
  //       );

  //       // Navigate to edit page with the new user ID
  //       const newUserId =
  //         res.data.user?._id || res.data.user?.id || res.data._id;
  //       if (newUserId) {
  //         navigate(`/dashboard/users/edit/${newUserId}`);
  //       } else {
  //         console.error("No user ID returned:", res.data);
  //         toast.error(
  //           "User created but couldn't load edit page. Please check users list."
  //         );
  //         navigate("/dashboard/users");
  //       }
  //     } else {
  //       const res = await api.put(`/users/${id}`, userData);
  //       // Refresh user data to get any server-side updates
  //       const updatedUser = res.data.user || res.data;
  //       setUser({ ...defaultUser, ...updatedUser });
  //       toast.success("User updated successfully!");
  //     }
  //   } catch (err) {
  //     console.error("Save error:", err);
  //     const errorMessage =
  //       err.response?.data?.message || err.message || "Error saving user";
  //       console.error("Save error details:", errorMessage);
  //     toast.error('Failed to save user');

  //     // Log additional error details in development
  //     if (err.response?.data?.error) {
  //       console.error("Server error details:", err.response.data.error);
  //     }
  //   } finally {
  //     setSaving(false);
  //   }
  // };
const handleSave = async (e) => {
  e.preventDefault();

  // Validate required fields
  if (!user.firstName || !user.lastName || !user.email || !user.role) {
    alert(
      "Please fill in all required fields: First Name, Last Name, Email, and Role"
    );
    return;
  }
  
  // Validate doctor specialization
  if (user.role.toLowerCase() === "doctor" && !user.department) {
    alert("Please select a specialization for this doctor");
    return;
  }

  try {
    setSaving(true);
    const { ...userData } = user;

    if (userData.role) {
      userData.role = userData.role.toLowerCase().trim();
    }

    if (id === "new") {
      const res = await api.post("/users", userData);
      toast.success(
        "User created successfully! Employee ID and RFID have been generated."
      );

      // Navigate to edit page with the new user ID
      const newUserId =
        res.data.user?._id || res.data.user?.id || res.data._id;
      if (newUserId) {
        navigate(`/dashboard/users/edit/${newUserId}`);
      } else {
        console.error("No user ID returned:", res.data);
        toast.error(
          "User created but couldn't load edit page. Please check users list."
        );
        navigate("/dashboard/users");
      }
    } else {
      const res = await api.put(`/users/${id}`, userData);
      // Refresh user data to get any server-side updates
      const updatedUser = res.data.user || res.data;
      setUser({ ...defaultUser, ...updatedUser });
      toast.success("User updated successfully!");
    }
  } catch (err) {
    console.error("Save error:", err);
    const errorMessage =
      err.response?.data?.message || err.message || "Error saving user";
    console.error("Save error details:", errorMessage);
    toast.error(err.response?.data?.message || 'Failed to save user');

    // Log additional error details in development
    if (err.response?.data?.error) {
      console.error("Server error details:", err.response.data.error);
    }
  } finally {
    setSaving(false);
  }
};
  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Check if refs are available
      if (!frontRef.current || !backRef.current) {
        toast.error("Card preview not ready. Please wait a moment and try again.");
        return;
      }

      const scale = 3;
      const frontCanvas = await html2canvas(frontRef.current, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const backCanvas = await html2canvas(backRef.current, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      // Calculate dimensions
      const width = frontCanvas.width / 2;
      const height = frontCanvas.height / 2;

      // Validate dimensions
      if (!width || !height || width <= 0 || height <= 0) {
        toast.error("Invalid card dimensions. Please try again.");
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [width, height],
      });

      pdf.addImage(
        frontCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        width,
        height
      );

      pdf.addPage([width, height], "portrait");
      pdf.addImage(
        backCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        width,
        height
      );

      pdf.save(`${user.firstName || "user"}_ID_Card.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadFrontPNG = async () => {
    try {
      setExporting(true);

      // Check if ref is available
      if (!frontRef.current) {
        toast.loading("Card preview not ready. Please wait a moment and try again.");
        return;
      }

      const canvas = await html2canvas(frontRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.firstName || "user"}_ID_Front.png`;
      a.click();
      toast.success("Front card exported successfully!");
    } catch (err) {
      console.error("PNG export error:", err);
      toast.error("Failed to export PNG: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {id === "new" ? "Create New User" : "Edit User & ID Card"}
              </h1>
              <p className="text-gray-600">
                {id === "new"
                  ? "Add a new user and generate their official ID card"
                  : "Update user details and regenerate ID card"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadFrontPNG}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <FaImage className="mr-2" />
                {exporting ? "Exporting..." : "Export PNG"}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <FaFilePdf className="mr-2" />
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                User Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill in all required user details
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading user data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Name Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First name"
                        value={user.firstName}
                        onChange={(e) =>
                          updateField("firstName", e.target.value)
                        }
                        required
                      />
                      <input
                        className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last name"
                        value={user.lastName}
                        onChange={(e) =>
                          updateField("lastName", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* AUTO-GENERATED IDs - READ ONLY */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FaLock className="text-blue-600 mr-2" />
                      <p className="text-sm font-medium text-blue-900">
                        Auto-Generated Identifiers
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-2">
                          Employee ID
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-700 cursor-not-allowed"
                          value={
                            user.employeeId ||
                            (id === "new" ? "Auto-generated on save" : "-")
                          }
                          readOnly
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-2">
                          RFID Number
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-700 cursor-not-allowed"
                          value={
                            user.rfid ||
                            user.rfidTag ||
                            (id === "new" ? "Auto-generated on save" : "-")
                          }
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      <FaLock className="inline mr-1" />
                      These fields are automatically generated by the system and
                      cannot be edited
                    </p>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., O+"
                      value={user.bloodGroup}
                      onChange={(e) =>
                        updateField("bloodGroup", e.target.value)
                      }
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaEnvelope className="mr-2 text-gray-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="user@hospital.com"
                        value={user.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaPhone className="mr-2 text-gray-400" />
                        Phone
                      </label>
                      <input
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+254 700 000 000"
                        value={user.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role / Job Title *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      value={user.role}
                      onChange={(e) => updateField("role", e.target.value)}
                      required
                    >
                      <option value="">Select a role...</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="staff">Staff</option>
                      <option value="it">IT Support</option>
                      <option value="communication">Communication</option>
                    </select>
                  </div>
                     {user.role.toLowerCase() === "doctor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={user.department || ""}
                        onChange={(e) =>
                          updateField("department", e.target.value)
                        }
                        disabled={loadingCategories}
                        required
                      >
                        <option value="">
                          {loadingCategories
                            ? "Loading Depsrtments..."
                            : "Select a Departments..."}
                        </option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && !loadingCategories && (
                        <p className="text-xs text-red-600 mt-1">
                          No specializations available
                        </p>
                      )}
                    </div>
                  )}


                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        Join Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={user.joinDate || ""}
                        onChange={(e) =>
                          updateField("joinDate", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={user.expiryDate || ""}
                        onChange={(e) =>
                          updateField("expiryDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt="profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="text-3xl text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                        <FaUpload className="mr-2" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Signature Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature Text
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Yours Sincerely"
                      value={user.signatureText}
                      onChange={(e) =>
                        updateField("signatureText", e.target.value)
                      }
                    />
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Terms & Conditions
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter terms and conditions..."
                      value={user.terms}
                      onChange={(e) => updateField("terms", e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/users")}
                      className="flex items-center px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <FaSave className="mr-2" />
                      {saving
                        ? "Saving..."
                        : id === "new"
                        ? "Create User"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Card Preview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FaIdCard className="mr-2 text-blue-600" />
                Live ID Card Preview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                See how the ID card will look
              </p>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center gap-8">
                {/* FRONT SIDE */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Front Side
                  </p>
                  <div
                    ref={frontRef}
                    className="w-[340px] h-[520px] bg-white rounded-xl shadow-2xl overflow-hidden relative border border-gray-200"
                  >
                    {/* Header */}
                    <div className="relative h-40 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
                      <h2 className="text-lg font-bold">N.C.R.H</h2>
                      <p className="text-xs mt-1 opacity-90">
                        Nyahururu County Referral Hospital
                      </p>
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-900 opacity-50"></div>
                    </div>

                    {/* Photo */}
                    <div className="relative -mt-16 flex justify-center">
                      <div className="w-32 h-32 bg-white p-1 shadow-lg rounded-full border-4 border-white">
                        {user.photo ? (
                          <img
                            src={user.photo}
                            className="w-full h-full object-fit rounded-full"
                            alt="user"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <FaUser className="text-4xl text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mt-4 px-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {user.firstName || "First"} {user.lastName || "Last"}
                      </h3>
                      <p className="text-blue-600 text-sm font-medium mt-1 capitalize">
                        {user.role || "Role"}
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 px-6">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-gray-500 text-xs">Emp No</p>
                            <p className="font-semibold text-gray-800">
                              {user.employeeId || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Blood</p>
                            <p className="font-semibold text-gray-800">
                              {user.bloodGroup || "-"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs">Department</p>
                            <p className="font-medium text-gray-800 truncate">
                              {user.department || "-"}
                            </p>
                          </div>
                          {/* <div className="col-span-2">
                            <p className="text-gray-500 text-xs">Phone</p>
                            <p className="font-medium text-gray-800">
                              {user.phone || "-"}
                            </p>
                          </div> */}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 h-6"></div>
                  </div>
                </div>

                {/* BACK SIDE */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Back Side
                  </p>
                  <div
                    ref={backRef}
                    className="w-[340px] h-[520px] bg-white rounded-xl shadow-2xl overflow-hidden relative border border-gray-200"
                  >
                    {/* Header */}
                    <div className="h-20 bg-blue-600 text-white flex items-center justify-center">
                      <h3 className="text-lg font-bold">TERMS & CONDITIONS</h3>
                    </div>

                    <div className="p-6 text-sm text-gray-700">
                      {/* Terms */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed text-xs">
                          <li>{user.terms}</li>
                          <li>Card must be presented upon request</li>
                          <li>This card remains hospital property</li>
                        </ul>
                      </div>

                      {/* Dates */}
                      <div className="mb-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold">Joined:</span>
                          <span>
                            {new Date(user.joinDate).toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            ) || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">Expires:</span>
                          <span>
                            {new Date(user.expiryDate).toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            ) || "-"}
                          </span>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex justify-center my-4">
                        <QRCodeCanvas
                          value={JSON.stringify({
                            id: user.employeeId,
                            name: `${user.firstName} ${user.lastName}`,
                            role: user.role,
                            rfid: user.rfid || user.rfidTag,
                          })}
                          size={100}
                          level="H"
                        />
                      </div>

                      {/* Signature */}
                      <div className="text-center mt-6">
                        <div className="h-12 flex items-center justify-center">
                          <p className="italic text-gray-600 text-lg font-signature">
                            {user.signatureText}
                          </p>
                        </div>
                        <div className="border-t border-gray-300 w-40 mx-auto mt-2"></div>
                        <p className="text-xs text-gray-500 mt-1">
                          Authorized Signature
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 h-6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;

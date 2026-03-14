import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaLock,
  FaSpinner,
} from "react-icons/fa";
import api from "../../api/axios";
import { toast } from "react-toastify";

const Spinner = ({ size = "md" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return <FaSpinner className={`${sizes[size]} animate-spin`} />;
};

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    speciality: "",
    bio: "",
    education: "",
    createdAt: "",
    role: "",
    profileImage: "",
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile");
      const { user, doctorDetails, profile: profileData } = res.data.data;

      console.log("Profile Response:", res.data.data);

      // Build profile object - handle null profile/doctorDetails
      const fullProfile = {
        // User fields (always present)
        ...user,
        // Profile fields (use from profileData if exists, fallback to user)
        phone: profileData?.phone || user?.phone || "",
        address: profileData?.address || user?.address || "",
        profileImage: profileData?.imageUrl || user?.profileImage || "",
        // Doctor fields (only if doctor role)
        speciality: doctorDetails?.speciality || "",
        bio: doctorDetails?.bio || "",
        education: doctorDetails?.education || "",
      };

      console.log("Full Profile Object:", fullProfile);

      setProfile(fullProfile);
      setEditedProfile(fullProfile);
    } catch (error) {
      console.log("Error fetching profile", error);
      toast.error("Error fetching profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditedProfile({
      ...editedProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/profile/update", editedProfile);
      const { user, doctorDetails, profile: profileData } = res.data.data;

      const updatedProfile = {
        ...user,
        phone: profileData?.phone || user?.phone || "",
        address: profileData?.address || user?.address || "",
        profileImage: profileData?.imageUrl || user?.profileImage || "",
        speciality: doctorDetails?.speciality || "",
        bio: doctorDetails?.bio || "",
        education: doctorDetails?.education || "",
      };

      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.log("Update error", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const res = await api.post("/profile/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", res.data);

      if (res.data.imageUrl) {
        setProfile((prev) => ({
          ...prev,
          profileImage: res.data.imageUrl,
        }));
        setEditedProfile((prev) => ({
          ...prev,
          profileImage: res.data.imageUrl,
        }));
        toast.success("Profile image updated successfully!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:px-6 md:py-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2 text-md">
            Manage your personal information and settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-8 sticky top-4 border border-gray-100">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  {profile.profileImage ? (
                    <img
                      src={
                        profile.profileImage.startsWith("blob") ||
                        profile.profileImage.startsWith("http")
                          ? profile.profileImage
                          : `${
                              process.env.REACT_APP_API_URL ||
                              "http://localhost:5000"
                            }${profile.profileImage}`
                      }
                      className="w-40 h-40 rounded-full object-fit shadow-xl ring-2 ring-blue-100 transition-transform group-hover:scale-105"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex
                     items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-blue-100
                     transition-transform group-hover:scale-105 cursor-pointer">
                      {profile.name
                        ? profile.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}

                  <label
                    className={`absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full hover:shadow-lg transition-all cursor-pointer shadow-md ${
                      uploading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploading ? <Spinner size="sm" /> : <FaCamera size={18} />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      hidden
                      disabled={uploading}
                    />
                  </label>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-gray-800 text-center">
                  {profile.name}
                </h2>
                <p className="text-blue-600 capitalize font-semibold text-lg mt-1">
                  {profile.role}
                </p>
                {profile.speciality && (
                  <p className="text-gray-600 text-sm mt-2 text-center">
                    {profile.speciality}
                  </p>
                )}

                <div className="mt-4 w-full p-4">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <FaBriefcase className="text-blue-600" />
                      Joined
                    </span>
                    <span className="font-semibold">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:shadow-lg 
                    transition-all font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 cursor-pointer"
                  >
                    <FaEdit />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Profile Information
                </h3>

                {isEditing && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-6 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800"
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-all font-semibold flex items-center gap-2 disabled:opacity-70"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Personal Information Section */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b-2 border-blue-200">
                  Personal Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaUser className="inline mr-2 text-blue-600" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editedProfile.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-800 font-medium border border-gray-200">
                        {profile.name}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-blue-600" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedProfile.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-800 font-medium border border-gray-200">
                        {profile.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaPhone className="inline mr-2 text-blue-600" />
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editedProfile.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-800 font-medium border border-gray-200">
                        {profile.phone || "Not provided"}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2 text-blue-600" />
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={editedProfile.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-800 font-medium border border-gray-200">
                        {profile.address || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information (Doctor Only) */}
              {profile.role === "doctor" && (
                <div className="space-y-8">
                  {/* Speciality */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b-2 border-blue-200">
                      Professional Information
                    </h4>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaBriefcase className="inline mr-2 text-blue-600" />
                        Speciality
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="speciality"
                          value={editedProfile.speciality}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-800 font-medium border border-gray-200">
                          {profile.speciality || "Not provided"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b-2 border-blue-200">
                      Professional Bio
                    </h4>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={editedProfile.bio}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                      />
                    ) : (
                      <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-700 border border-gray-200 leading-relaxed">
                        {profile.bio || "No bio provided"}
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b-2 border-blue-200">
                      Education
                    </h4>
                    {isEditing ? (
                      <textarea
                        name="education"
                        value={editedProfile.education}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                      />
                    ) : (
                      <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-gray-700 border border-gray-200 leading-relaxed">
                        {profile.education || "No education details provided"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaLock className="text-blue-600" />
                Security
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 hover:from-red-700 hover:to-red-800"
              >
                <FaLock />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};

export default ProfilePage;

// Password Change Modal Component
const PasswordChangeModal = ({ onClose }) => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPass !== confirmPass) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/profile/change-password", {
        oldPassword: oldPass,
        newPassword: newPass,
      });

      toast.success("Password updated successfully!");
      onClose();
    } catch (err) {
      console.error("Password error:", err);
      toast.error(err?.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaLock className="text-blue-600" />
          Change Password
        </h2>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:bg-gray-100"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 border border-blue-200">
            <p className="font-semibold mb-2">Password Requirements:</p>
            <ul className="space-y-1">
              <li className={newPass.length >= 6 ? "text-green-600" : ""}>
                {newPass.length >= 6 ? "✓" : "•"} At least 6 characters
              </li>
              <li
                className={
                  newPass === confirmPass && newPass.length > 0
                    ? "text-green-600"
                    : ""
                }
              >
                {newPass === confirmPass && newPass.length > 0 ? "✓" : "•"}{" "}
                Passwords match
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-semibold disabled:opacity-70"
          >
            Cancel
          </button>

          <button
            onClick={handlePasswordUpdate}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Updating...
              </>
            ) : (
              <>Update Password</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

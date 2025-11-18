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
} from "react-icons/fa";
import api from "../../api/axios";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    speciality: "",
    bio: "",
    education: "",
    joinDate: "",
    role: "",
    profileImage: "",
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    fetchProfile();
  }, []);


  const fetchProfile = async () => {
  try {
    const res = await api.get("/profile");
    const { user, doctorDetails, profile: profileData } = res.data.data;
      console.log(res.data.data);

    const fullProfile = {
      ...user,
      speciality: doctorDetails?.speciality || "",
      bio: doctorDetails?.bio || "",
      education: doctorDetails?.education || "",
      phone: profileData?.phone || "",
      address: profileData?.address || "",
      profileImage: profileData?.imageUrl || "",
    };

    setProfile(fullProfile);
    setEditedProfile(fullProfile);
    setLoading(false);
  } catch (error) {
    console.log("Error fetching profile", error);
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
    setEditedProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      speciality: profile.speciality,
      bio: profile.bio,
      education: profile.education,
    });
  };

  const handleSave = async () => {
    try {
      const res = await api.put("/profile/update", editedProfile, {
        headers: { Authorization: localStorage.getItem("token") },
      });
      const { user, doctorDetails } = res.data.data;
      const updatedProfile = {
        ...user,
        speciality: doctorDetails?.speciality || "",
        bio: doctorDetails?.bio || "",
        education: doctorDetails?.education || "",
        createdAt: user.createdAt,
      };
      setProfile(updatedProfile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.log("Update error", error);
      alert(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/profile/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

    console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    }
  };
  if (loading) return <p>Loading...</p>;
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your personal information and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                {profile.profileImage ? (
                  <img
                    src={`http://localhost:5000${profile.profileImage}`}
                    className="w-32 h-32 rounded-full object-cover shadow-lg"
                    alt="Profile"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profile.name ? profile.name.charAt(0) : ""}
                  </div>
                )}

                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg cursor-pointer">
                  <FaCamera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-gray-800">
                {profile.name}
              </h2>
              <p className="text-gray-600 capitalize">{profile.role}</p>
              <p className="text-sm text-gray-500 mt-1">{profile.speciality}</p>

              <div className="mt-6 w-full">
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-3">
                  <FaBriefcase className="text-blue-600" />
                  <span className="text-sm">
                    Joined:{" "}
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
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FaEdit />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Profile Information
              </h3>

              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-600" />
                  Personal Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editedProfile.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg">
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-gray-500" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedProfile.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg">
                        {profile.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2 text-gray-500" />
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editedProfile.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg">
                        {profile.phone}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={editedProfile.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg">
                        {profile.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {profile.role === "doctor" && (
                <div>
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                      <FaBriefcase className="mr-2 text-blue-600" />
                      Professional Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Speciality
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="speciality"
                            value={editedProfile.speciality}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg">
                            {profile.speciality}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">
                      Bio
                    </h4>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={editedProfile.bio}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-700">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">
                      Education
                    </h4>
                    {isEditing ? (
                      <textarea
                        name="education"
                        value={editedProfile.education}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-700">
                        {profile.education}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
            <div className="space-y-4">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full md:w-auto bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};

export default ProfilePage;

const PasswordChangeModal = ({ onClose }) => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!oldPass || !newPass) return alert("Please fill in all fields");

    setLoading(true);

    try {
      await api.post(
        "/api/profile/change-password",
        { oldPassword: oldPass, newPassword: newPass },
        { headers: { Authorization: localStorage.getItem("token") } }
      );

      alert("Password updated successfully!");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating password");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Change Password
        </h2>

        <input
          type="password"
          placeholder="Current Password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
        />

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={handlePasswordUpdate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

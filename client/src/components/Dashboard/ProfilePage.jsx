import React, { useState, useEffect, useCallback } from "react";
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
  FaGraduationCap,
  FaFileAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import api from "../../api/axios";
import { toast } from "react-toastify";

const Spinner = ({ size = "md" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return <FaSpinner className={`${sizes[size]} animate-spin`} />;
};

const buildImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith("blob") || url.startsWith("http")) return url;
  return `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${url}`;
};

const initEmpty = {
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
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const Field = ({
  icon: Icon,
  label,
  name,
  type = "text",
  value,
  editing,
  onChange,
  textarea,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
      <Icon className="text-blue-500 text-xs" />
      {label}
    </label>
    {editing ? (
      textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={4}
          placeholder={`Enter ${label.toLowerCase()}…`}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm
                     outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all
                     resize-none placeholder:text-slate-300"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}…`}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm
                     outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all
                     placeholder:text-slate-300"
        />
      )
    ) : (
      <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 min-h-[2.5rem]">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </div>
    )}
  </div>
);

// Password Inputs

const PasswordInput = ({ label, placeholder, value, onChange, disabled }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white
                     text-slate-800 text-sm outline-none focus:border-blue-400
                     focus:ring-2 focus:ring-blue-100 transition-all
                     disabled:bg-slate-50 placeholder:text-slate-300"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                     hover:text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
        >
          {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
    </div>
  );
};
const PasswordModal = ({ onClose }) => {
  const [fields, setFields] = useState({ old: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const set = (key) => (e) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));
  const lengthOk = fields.next.length >= 6;
  const matchOk = fields.next === fields.confirm && fields.next.length > 0;
  const hasUpper = /[A-Z]/.test(fields.next);
  const hasSpecial = /[@$!%*?&]/.test(fields.next);
  const allValid = lengthOk && matchOk && hasUpper && hasSpecial;

  const handleSubmit = async () => {
    if (!fields.old) return toast.error("Please enter your current password");
    if (!allValid) return toast.error("Please meet all password requirements");

    setLoading(true);
    try {
      await api.post("/profile/change-password", {
        oldPassword: fields.old,
        newPassword: fields.next,
      });
      toast.success("Password updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };
  const Rule = ({ ok, text }) => (
    <div
      className={`flex items-center gap-2 text-sm transition-colors ${ok ? "text-green-600" : "text-slate-400"}`}
    >
      <FaCheckCircle className="text-xs flex-shrink-0" />
      {text}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <FaLock className="text-blue-500" /> Change Password
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 p-1 rounded-lg hover:text-red-500 disabled:opacity-50 cursor-pointer text-xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <PasswordInput
            label="Current Password"
            placeholder="Your current password"
            value={fields.old}
            onChange={set("old")}
            disabled={loading}
          />
          <PasswordInput
            label="New Password"
            placeholder="Min 8 chars, uppercase, special char"
            value={fields.next}
            onChange={set("next")}
            disabled={loading}
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={fields.confirm}
            onChange={set("confirm")}
            disabled={loading}
          />

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              Requirements
            </p>
            <Rule ok={lengthOk} text="At least 8 characters" />
            <Rule ok={hasUpper} text="Contains an uppercase letter" />
            <Rule
              ok={hasSpecial}
              text="Contains a special character (@$!%*?&)"
            />
            <Rule ok={matchOk} text="Passwords match" />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                       font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-60
                       cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !allValid}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white
                       font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer
                       transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner size="sm" /> Updating…
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState(initEmpty);
  const [isEditing, setIsEditing] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Weekly availability state (doctor only)
  const [availability, setAvailability] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const buildProfile = useCallback((data) => {
    const { user, doctorDetails, profile: pd } = data;
    return {
      ...user,
      phone: pd?.phone || user?.phone || "",
      address: pd?.address || user?.address || "",
      profileImage: pd?.imageUrl || user?.profileImage || "",
      speciality: doctorDetails?.speciality || "",
      bio: doctorDetails?.bio || "",
      education: doctorDetails?.education || "",
    };
  }, []);

  const buildAvailability = useCallback((data) => {
    const existing = data?.doctorDetails?.availability || [];
    return DAYS.map((day) => {
      const found = existing.find((a) => a.day === day);
      return {
        day,
        enabled: !!found,
        startTime: found?.startTime || "09:00",
        endTime: found?.endTime || "17:00",
      };
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile");
      const full = buildProfile(res.data.data);
      setProfile(full);
      setEditedProfile(full);
      setAvailability(buildAvailability(res.data.data));
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [buildProfile, buildAvailability]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) =>
    setEditedProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = async () => {
    if (!editedProfile.name?.trim()) return toast.error("Name cannot be empty");
    try {
      setSaving(true);
      const res = await api.put("/profile/update", editedProfile);
      const full = buildProfile(res.data.data);
      setProfile(full);
      setEditedProfile(full);
      setIsEditing(false);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
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
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.imageUrl) {
        const url = res.data.imageUrl;
        setProfile((p) => ({ ...p, profileImage: url }));
        setEditedProfile((p) => ({ ...p, profileImage: url }));
        toast.success("Photo updated!");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Availability handlers (doctor only)
  const toggleDay = (day) =>
    setAvailability((prev) =>
      prev.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d))
    );

  const updateDayTime = (day, field, value) =>
    setAvailability((prev) =>
      prev.map((d) => (d.day === day ? { ...d, [field]: value } : d))
    );

  const handleSaveAvailability = async () => {
    const enabledDays = availability.filter((d) => d.enabled);
    for (const d of enabledDays) {
      if (d.startTime >= d.endTime) {
        return toast.error(`${d.day}: start time must be before end time`);
      }
    }
    try {
      setSavingAvailability(true);
      const payload = enabledDays.map(({ day, startTime, endTime }) => ({
        day,
        startTime,
        endTime,
      }));
      await api.put("/doctors/availability", { availability: payload });
      toast.success("Availability updated!");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update availability"
      );
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Spinner size="lg" />
        <p className="text-slate-500 text-base">Loading profile…</p>
      </div>
    );
  }

  if (!profile) return null;

  const avatarSrc = buildImageSrc(profile.profileImage);
  const isDoctor = profile.role === "doctor";
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:px-8 md:py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              My Profile
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your personal information and settings
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
                         text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                           text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" /> Saving…
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white
                           text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center gap-3 sticky top-4">
              <div className="relative group">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-100 shadow-md"
                  />
                ) : (
                  <div
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                                  flex items-center justify-center text-white text-3xl font-bold
                                  ring-4 ring-slate-100 shadow-md select-none"
                  >
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <label
                  className={`absolute bottom-1 right-1 w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600
                               text-white flex items-center justify-center cursor-pointer shadow-md
                               border-2 border-white transition-colors text-xs
                               ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {uploading ? <Spinner size="sm" /> : <FaCamera />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">
                  {profile.name}
                </h2>
                <span
                  className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-50 text-blue-600
                                 text-xs font-semibold capitalize tracking-wide"
                >
                  {profile.role}
                </span>
                {isDoctor && profile.speciality && (
                  <p className="text-slate-500 text-sm mt-1.5 italic">
                    {profile.speciality}
                  </p>
                )}
              </div>

              <div
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50
                              border border-slate-100 text-sm mt-1"
              >
                <span className="flex items-center gap-1.5 text-slate-500">
                  <FaBriefcase className="text-blue-400 text-xs" /> Joined
                </span>
                <span className="font-semibold text-slate-700 text-xs">
                  {joined}
                </span>
              </div>

              <div className="w-full h-px bg-slate-100 my-1" />

              <button
                onClick={() => setShowPwModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                           border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300
                           text-sm font-semibold transition-all"
              >
                <FaShieldAlt /> Change Password
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <FaUser className="text-blue-500" />
                <h3 className="text-base font-bold text-slate-800">
                  Personal Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  icon={FaUser}
                  label="Full Name"
                  name="name"
                  value={editedProfile.name}
                  editing={isEditing}
                  onChange={handleChange}
                />
                <Field
                  icon={FaEnvelope}
                  label="Email"
                  name="email"
                  value={editedProfile.email}
                  editing={false}
                  onChange={handleChange}
                  type="email"
                />
                <Field
                  icon={FaPhone}
                  label="Phone"
                  name="phone"
                  value={editedProfile.phone}
                  editing={isEditing}
                  onChange={handleChange}
                  type="tel"
                />
                <Field
                  icon={FaMapMarkerAlt}
                  label="Address"
                  name="address"
                  value={editedProfile.address}
                  editing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {isDoctor && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                  <FaBriefcase className="text-blue-500" />
                  <h3 className="text-base font-bold text-slate-800">
                    Professional Information
                  </h3>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field
                      icon={FaBriefcase}
                      label="Speciality"
                      name="speciality"
                      value={editedProfile.speciality}
                      editing={isEditing}
                      onChange={handleChange}
                    />
                  </div>
                  <Field
                    icon={FaFileAlt}
                    label="Professional Bio"
                    name="bio"
                    value={editedProfile.bio}
                    editing={isEditing}
                    onChange={handleChange}
                    textarea
                  />
                  <Field
                    icon={FaGraduationCap}
                    label="Education"
                    name="education"
                    value={editedProfile.education}
                    editing={isEditing}
                    onChange={handleChange}
                    textarea
                  />
                </div>
              </div>
            )}

            {isDoctor && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="text-blue-500" />
                    <h3 className="text-base font-bold text-slate-800">
                      Weekly Availability
                    </h3>
                  </div>
                  <button
                    onClick={handleSaveAvailability}
                    disabled={savingAvailability}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
                               text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingAvailability ? (
                      <>
                        <Spinner size="sm" /> Saving…
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Availability
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {availability.map((d) => (
                    <div
                      key={d.day}
                      className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <label className="flex items-center gap-2 w-28 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={() => toggleDay(d.day)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {d.day}
                        </span>
                      </label>

                      {d.enabled ? (
                        <div className="flex items-center gap-2 text-sm">
                          <input
                            type="time"
                            value={d.startTime}
                            onChange={(e) =>
                              updateDayTime(d.day, "startTime", e.target.value)
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800
                                       text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={d.endTime}
                            onChange={(e) =>
                              updateDayTime(d.day, "endTime", e.target.value)
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800
                                       text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">
                          Unavailable
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPwModal && <PasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  );
};

export default ProfilePage;
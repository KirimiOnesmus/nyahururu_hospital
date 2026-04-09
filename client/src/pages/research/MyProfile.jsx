import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaUniversity,
  FaEdit, FaSave, FaTimes, FaCheckCircle, FaFileAlt,
  FaDownload, FaStar, FaCalendarAlt, FaTwitter,
  FaLinkedin, FaGlobe, FaMapMarkerAlt, FaAward, FaBook,
  FaShieldAlt, FaLock, FaArrowLeft,
} from "react-icons/fa";

/* ══════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════ */
const MOCK_PROFILE = {
  id: "usr-001",
  name: "Dr. Amina Wanjiku",
  email: "amina.wanjiku@egerton.ac.ke",
  phone: "+254 712 345 678",
  bio: "Passionate researcher focused on understanding how climate change impacts agricultural productivity in semi-arid regions. 8+ years of experience in field research and data analysis.",
  institution: "Egerton University",
  department: "Faculty of Agriculture",
  discipline: "Medicine",
  title: "Senior Lecturer",
  location: "Nakuru, Kenya",
  profileImage: null,
  verified: true,
  joiningDate: "2016-03-15",
  socialLinks: {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    website: "https://example.com",
  },
};

const MOCK_PUBLICATIONS = [
  {
    id: "p1",
    title: "Impact of Climate Change on Agricultural Productivity in the Rift Valley",
    stage: "final_paper", status: "published",
    date: "2024-03-18", downloads: 342, citations: 12,
  },
  {
    id: "p2",
    title: "Soil Microbiome Diversity and Crop Yield in Semi-Arid Laikipia",
    stage: "final_paper", status: "published",
    date: "2024-06-09", downloads: 156, citations: 8,
  },
  {
    id: "p3",
    title: "Irrigation Efficiency and Water Conservation in Smallholder Farms",
    stage: "abstract", status: "under_review",
    date: "2024-08-15", downloads: 0, citations: 0,
  },
];

const MOCK_STATS = {
  totalSubmissions: 4, published: 2, underReview: 1,
  totalDownloads: 498, totalCitations: 20, h_index: 2,
};

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="text-xs text-white" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   AVATAR INITIALS
══════════════════════════════════════════ */
const Avatar = ({ name, size = "lg" }) => {
  const initials = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sz = size === "lg" ? "w-24 h-24 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white border-4 border-white shadow-md flex-shrink-0`}>
      {initials}
    </div>
  );
};

/* ══════════════════════════════════════════
   EDIT PROFILE MODAL
══════════════════════════════════════════ */
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState(profile);
  const [saving, setSaving]     = useState(false);

  const set = (field, value) => setFormData((p) => ({ ...p, [field]: value }));
  const setSocial = (k, v) => setFormData((p) => ({ ...p, socialLinks: { ...p.socialLinks, [k]: v } }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Profile updated successfully!");
      onSave(formData);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring focus:ring-blue-500 bg-gray-50 hover:border-gray-300 transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ animation: "fadeIn .2s ease" }}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh", animation: "slideUp .25s ease" }}>

        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-white font-bold text-lg">Edit Profile</h3>
          {!saving && (
            <button onClick={onClose} className="text-white/60 hover:text-red-600 
            transition-colors cursor-pointer p-2 hover:bg-white/10 rounded-lg">
              <FaTimes size={20} />
            </button>
          )}
        </div>

        {/* Scrollable form body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={formData.name} 
              onChange={(e) => set("name", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
              <input type="text" value={formData.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={formData.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Institution</label>
              <input type="text" value={formData.institution} onChange={(e) => set("institution", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
              <input type="text" value={formData.department} onChange={(e) => set("department", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <input type="text" value={formData.location} onChange={(e) => set("location", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
            <textarea rows={4} value={formData.bio} onChange={(e) => set("bio", e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h4 className="font-semibold text-gray-900 text-sm mb-4">Social Links</h4>
            <div className="space-y-3">
              {[
                { key: "twitter",  icon: FaTwitter,  label: "Twitter / X",       color: "text-sky-500",   placeholder: "https://twitter.com/..." },
                { key: "linkedin", icon: FaLinkedin, label: "LinkedIn",           color: "text-blue-600",  placeholder: "https://linkedin.com/in/..." },
                { key: "website",  icon: FaGlobe,    label: "Personal Website",   color: "text-gray-600",  placeholder: "https://example.com" },
              ].map(({ key, icon: Icon, label, color, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Icon className={color} size={13} /> {label}
                  </label>
                  <input type="url" value={formData.socialLinks[key]}
                    onChange={(e) => setSocial(key, e.target.value)}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 bg-gray-50/50 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-200
             text-gray-600 rounded-xl font-semibold hover:border-red-500 hover:text-red-600 hover:bg-red-50/50 
             transition-all disabled:opacity-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
             text-white rounded-xl font-semibold transition-all cursor-pointer 
             hover:shadow-lg disabled:bg-blue-400 disabled:hover:bg-blue-400
             disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white 
              border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : (
              <><FaSave size={13} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN PROFILE COMPONENT - Full Page Card
══════════════════════════════════════════ */
const MyProfile = ({ onBack }) => {
  const [profile, setProfile]   = useState(MOCK_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* ── Header ── */}
      <div className="bg-blue-500 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex
           items-center justify-center">
            <FaUser className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">My Research Profile</p>
            <p className="text-blue-200 text-sm">View and manage your profile information</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors p-2
           hover:bg-white/10 rounded-lg cursor-pointer"
        >
          <FaArrowLeft size={20} />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-6">
        
        {/* ── Profile Summary ── */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <div className="flex items-start gap-6">
            <Avatar name={profile.name} />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-blue-600 font-semibold text-base mt-0.5">{profile.title}</p>
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600
                   hover:bg-blue-700 text-white rounded-lg font-semibold
                    text-sm transition-all cursor-pointer"
                >
                  <FaEdit size={13} /> Edit
                </button>
              </div>

              {/* Quick info */}
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1.5">
                  <FaUniversity className="text-blue-500" />
                  {profile.institution}
                </div>
                <div className="flex items-center gap-1.5">
                  <FaBriefcase className="text-blue-500" />
                  {profile.department}
                </div>
                <div className="flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-blue-500" />
                  {profile.location}
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{profile.bio}</p>

              {/* Social links */}
              <div className="flex gap-2">
                {[
                  { key: "twitter",  icon: FaTwitter,  cls: "text-sky-500  bg-sky-50  hover:bg-sky-100"   },
                  { key: "linkedin", icon: FaLinkedin, cls: "text-blue-600 bg-blue-50 hover:bg-blue-100"  },
                  { key: "website",  icon: FaGlobe,    cls: "text-gray-600 bg-gray-100 hover:bg-gray-200" },
                ].filter(({ key }) => profile.socialLinks[key]).map(({ key, icon: Icon, cls }) => (
                  <a key={key} href={profile.socialLinks[key]} target="_blank" rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg flex items-center 
                    justify-center transition-all ${cls}`}>
                    <Icon size={13} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
            <span className="flex items-center gap-1"><FaCalendarAlt /> Member since {new Date(profile.joiningDate).getFullYear()}</span>
            {profile.verified && <span className="flex items-center gap-1 text-green-600"><FaCheckCircle /> Verified</span>}
            <span className="flex items-center gap-1"><FaShieldAlt /> Public Profile</span>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Research Statistics</h3>
          <div className="grid md:grid-cols-5 gap-3">
            <StatCard icon={FaFileAlt}     label="Submissions"  value={MOCK_STATS.totalSubmissions} color="bg-blue-500"   />
            <StatCard icon={FaCheckCircle} label="Published"    value={MOCK_STATS.published}        color="bg-green-500"  />
            <StatCard icon={FaBook}        label="Under Review" value={MOCK_STATS.underReview}      color="bg-yellow-500" />
            <StatCard icon={FaDownload}    label="Downloads"    value={MOCK_STATS.totalDownloads}   color="bg-indigo-500" />
            <StatCard icon={FaStar}        label="Citations"    value={MOCK_STATS.totalCitations}   color="bg-purple-500" />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div>
          <div className="flex gap-6 border-b border-gray-100 mb-5">
            {[
              { id: "overview",      label: "Overview",      icon: FaUser  },
              { id: "publications",  label: "Publications",  icon: FaBook  },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-1 py-3 border-b-2 font-semibold text-sm 
                    flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contact */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <FaEnvelope className="text-blue-500" /> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Email",       value: profile.email,       href: `mailto:${profile.email}` },
                    { label: "Phone",       value: profile.phone,       href: `tel:${profile.phone}` },
                    { label: "Institution", value: profile.institution, href: null },
                    { label: "Department",  value: profile.department,  href: null },
                  ].map(({ label, value, href }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm text-blue-600 hover:underline">{value}</a>
                      ) : (
                        <p className="text-sm text-gray-800">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Research Focus */}
              <div className="border-t border-gray-50 pt-6">
                <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <FaAward className="text-blue-500" /> Research Focus
                </h4>
                <div className="flex items-end gap-8">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Discipline</p>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                      {profile.discipline}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">H-Index</p>
                    <p className="text-3xl font-extrabold text-gray-900">{MOCK_STATS.h_index}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Publications Tab ── */}
          {activeTab === "publications" && (
            <div className="space-y-3">
              {MOCK_PUBLICATIONS.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No publications yet</p>
                </div>
              ) : (
                MOCK_PUBLICATIONS.map((pub) => (
                  <div key={pub.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      pub.status === "published" ? "bg-green-100" : "bg-yellow-100"
                    }`}>
                      <FaFileAlt className={pub.status === "published" ? "text-green-600" : "text-yellow-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{pub.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(pub.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FaDownload className="text-blue-400" /> {pub.downloads} downloads</span>
                        <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {pub.citations} citations</span>
                        {pub.status === "published" && (
                          <button className="flex items-center gap-1
                           text-blue-600 hover:underline font-semibold hover:cursor-pointer">
                            <FaDownload size={10} /> Download
                          </button>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 whitespace-nowrap ${
                      pub.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {pub.status === "published" ? "Published" : "Under Review"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editMode && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditMode(false)}
          onSave={(updated) => { setProfile(updated); setEditMode(false); }}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

export default MyProfile;
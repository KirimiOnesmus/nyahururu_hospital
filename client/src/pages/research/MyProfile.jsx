import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getResearcherProfile, updateResearcherProfile } from "../../api/auth";
import {
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaUniversity,
  FaEdit, FaSave, FaTimes, FaCheckCircle, FaFileAlt,
  FaDownload, FaStar, FaCalendarAlt, FaTwitter,
  FaLinkedin, FaGlobe, FaMapMarkerAlt, FaAward, FaBook,
  FaShieldAlt, FaLock, FaArrowLeft,
} from "react-icons/fa";


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


const Avatar = ({ firstName, lastName, size = "lg" }) => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const sz = size === "lg" ? "w-24 h-24 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white border-4 border-white shadow-md flex-shrink-0`}>
      {initials || "?"}
    </div>
  );
};


const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState(profile);
  const [saving, setSaving]     = useState(false);

  const set = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
   
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error("First and last name are required");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone?.trim() || "",
        institution: formData.institution?.trim() || "",
        discipline: formData.discipline?.trim() || "",
        qualification: formData.qualification?.trim() || "",
        bio: formData.bio?.trim() || "",
      };

      await updateResearcherProfile(updates);
      toast.success("Profile updated successfully!");
      onSave(formData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update profile";
      toast.error(errorMsg);
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
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "100vh", animation: "slideUp .25s ease" }}>

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

       
        <div className="p-6 space-y-5 overflow-y-auto flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
              <input type="text" value={formData.firstName || ""} 
              onChange={(e) => set("firstName", e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
              <input type="text" value={formData.lastName || ""} onChange={(e) => set("lastName", e.target.value)} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={formData.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={formData.phone || ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Institution</label>
              <input type="text" value={formData.institution || ""} onChange={(e) => set("institution", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discipline</label>
              <input type="text" value={formData.discipline || ""} onChange={(e) => set("discipline", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualification</label>
            <input type="text" value={formData.qualification || ""} onChange={(e) => set("qualification", e.target.value)} className={inputCls} placeholder="e.g., PhD, Master's, Bachelor's" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
            <textarea rows={4} value={formData.bio || ""} onChange={(e) => set("bio", e.target.value)}
              className={`${inputCls} resize-none`} placeholder="Tell us about your research interests and background..." />
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


const MyProfile = ({ onBack }) => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getResearcherProfile();
        setProfile(response.researcher);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error("Failed to load profile. Please try again.");
  
        setTimeout(() => onBack?.(), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [onBack]);

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 transition-colors mb-6">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-gray-600 font-medium">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <button onClick={onBack}
         className="flex items-center gap-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 transition-colors mb-6">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex items-center justify-center">
          <div className="text-center">
            <FaUser className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Unable to load profile</p>
            <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 transition-colors mb-6">
        <FaArrowLeft /> Back to Dashboard
      </button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">

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
        </div>

        <div className="px-8 py-6">
  
          <div className="mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-start gap-6">
              <Avatar firstName={profile.firstName} lastName={profile.lastName} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
                    {profile.qualification && (
                      <p className="text-blue-600 font-semibold text-base mt-0.5">{profile.qualification}</p>
                    )}
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

            
                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  {profile.institution && (
                    <div className="flex items-center gap-1.5">
                      <FaUniversity className="text-blue-500" />
                      {profile.institution}
                    </div>
                  )}
                  {profile.discipline && (
                    <div className="flex items-center gap-1.5">
                      <FaBriefcase className="text-blue-500" />
                      {profile.discipline}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <FaEnvelope className="text-blue-500" />
                    {profile.email}
                  </div>
                </div>

        
                {profile.bio && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-4 border-t border-gray-50">
                  {profile.emailVerified && <span className="flex items-center gap-1 text-green-600"><FaCheckCircle /> Email Verified</span>}
                  <span className="flex items-center gap-1"><FaShieldAlt /> Public Profile</span>
                </div>
              </div>
            </div>
          </div>

   
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


            {activeTab === "overview" && (
              <div className="space-y-6">
        
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <FaEnvelope className="text-blue-500" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: "Email",       value: profile.email,         href: `mailto:${profile.email}` },
                      { label: "Phone",       value: profile.phone || "—",   href: profile.phone ? `tel:${profile.phone}` : null },
                      { label: "Institution", value: profile.institution || "—", href: null },
                      { label: "Discipline",  value: profile.discipline || "—",  href: null },
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

   
                <div className="border-t border-gray-50 pt-6">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <FaAward className="text-blue-500" /> Research Focus
                  </h4>
                  <div className="flex items-end gap-8">
                    {profile.discipline && (
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Discipline</p>
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                          {profile.discipline}
                        </span>
                      </div>
                    )}
                    {profile.qualification && (
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide">Qualification</p>
                        <p className="text-lg font-extrabold text-gray-900">{profile.qualification}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


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


        {editMode && (
          <EditProfileModal
            profile={profile}
            onClose={() => setEditMode(false)}
            onSave={handleSaveProfile}
          />
        )}

        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>
      </div>
    </div>
  );
};

export default MyProfile;
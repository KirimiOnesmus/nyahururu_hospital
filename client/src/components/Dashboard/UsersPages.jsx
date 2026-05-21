import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaUser,
  FaUserMd, FaUserShield, FaEnvelope, FaIdCard, FaEye,
  FaTimes, FaUserCog,
} from "react-icons/fa";
import { toast } from "react-toastify";


const ROLES = ["superadmin", "admin", "doctor", "it", "communication", "nurse", "receptionist"];

const ROLE_CONFIG = {
  superadmin:    { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  icon: FaUserShield },
  admin:         { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    icon: FaUserCog    },
  doctor:        { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: FaUserMd     },
  it:            { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-400",  icon: FaUserCog    },
  communication: { bg: "bg-teal-100",   text: "text-teal-700",    dot: "bg-teal-400",    icon: FaUser       },
  nurse:         { bg: "bg-pink-100",   text: "text-pink-700",    dot: "bg-pink-400",    icon: FaUserMd     },
  receptionist:  { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    icon: FaUser       },
};

const cfg = (role) => ROLE_CONFIG[role?.toLowerCase()] || ROLE_CONFIG.receptionist;


const RoleBadge = ({ role }) => {
  const c = cfg(role);
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
};

const Avatar = ({ name, size = "sm" }) => {
  const sizes = { sm: "w-9 h-9 text-sm", lg: "w-16 h-16 text-2xl" };
  return (
    <div className={`${sizes[size]} rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shrink-0`}>
      {name?.charAt(0).toUpperCase() || "U"}
    </div>
  );
};

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading users…</p>
  </div>
);

const Empty = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <FaUser className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">No users found</p>
  </div>
);

const StatCard = ({ label, value, sub, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.bg}`}>
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${accent.num}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);


const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};


const UsersPages = () => {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [viewModal,    setViewModal]    = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();


  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);


  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(u => {
      const matchSearch =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);


  const roleStats = useMemo(() => {
    const s = {};
    ROLES.forEach(r => { s[r] = users.filter(u => u.role === r).length; });
    return s;
  }, [users]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting user");
    }
  };

  const openView = (user) => { setSelectedUser(user); setViewModal(true); };

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        .fade-up { animation: fadeUp .3s ease both; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

    
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaUser className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Management</h1>
              <p className="text-xs text-gray-400">Manage system users and their roles</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard/users/edit/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700
             transition-colors cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add New User
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Users" value={users.length} icon={FaUser}
            accent={{ bg:"bg-blue-50", icon:"text-blue-500", num:"text-blue-600" }}
          />
          <StatCard
            label="Admin Staff"
            value={(roleStats.superadmin || 0) + (roleStats.admin || 0)}
            sub={`Super: ${roleStats.superadmin || 0} · Admin: ${roleStats.admin || 0}`}
            icon={FaUserShield}
            accent={{ bg:"bg-violet-50", icon:"text-violet-500", num:"text-violet-600" }}
          />
          <StatCard
            label="Medical"
            value={(roleStats.doctor || 0) + (roleStats.nurse || 0)}
            sub={`Doctors: ${roleStats.doctor || 0} · Nurses: ${roleStats.nurse || 0}`}
            icon={FaUserMd}
            accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }}
          />
          <StatCard
            label="Other Staff"
            value={(roleStats.it || 0) + (roleStats.communication || 0) + (roleStats.receptionist || 0)}
            sub={`IT: ${roleStats.it || 0} · Others: ${(roleStats.communication || 0) + (roleStats.receptionist || 0)}`}
            icon={FaUserCog}
            accent={{ bg:"bg-orange-50", icon:"text-orange-500", num:"text-orange-600" }}
          />
        </div>

        {/* ── Role distribution pills ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-2">
          {ROLES.map(role => {
            const c = cfg(role);
            const count = roleStats[role] || 0;
            const Icon = c.icon;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(filterRole === role ? "all" : role)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filterRole === role
                    ? `${c.bg} ${c.text} border-transparent ring-2 ring-offset-1 ring-blue-400`
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className="text-[10px]" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${filterRole === role ? "bg-white/60" : "bg-gray-200 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          {filterRole !== "all" && (
            <button
              onClick={() => setFilterRole("all")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <FaTimes className="text-[10px]" /> Clear
            </button>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="Search by name, email, or role…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-300 text-sm" />
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
            >
              <option value="all">All Roles</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          {(searchTerm || filterRole !== "all") && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="font-semibold text-gray-700">{filteredUsers.length}</span> of {users.length} users
              <button onClick={() => { setSearchTerm(""); setFilterRole("all"); }} className="ml-1 text-gray-300 hover:text-red-400 transition-colors cursor-pointer">
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : filteredUsers.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["User", "Email", "Role", "Actions"].map((h, i) => (
                      <th key={h} className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 3 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50/80 transition-colors group">

                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">#{user._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-600 text-xs">
                          <FaEnvelope className="text-gray-300 shrink-0" />
                          {user.email}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openView(user)}
                            className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/users/edit/${user._id}`)}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer count */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filteredUsers.length}</span> of <span className="font-semibold text-gray-600">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── View Modal ── */}
      <Modal open={viewModal} onClose={() => setViewModal(false)}>
        {selectedUser && (
          <>
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <Avatar name={selectedUser.name} size="lg" />
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedUser.email}</p>
                  <div className="mt-2"><RoleBadge role={selectedUser.role} /></div>
                </div>
              </div>
              <button onClick={() => setViewModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name",  value: selectedUser.name,  icon: FaUser     },
                  { label: "Email",      value: selectedUser.email, icon: FaEnvelope },
                  { label: "User ID",    value: selectedUser._id,   icon: FaIdCard   },
                  { label: "Role",       value: selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1), icon: FaUserShield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Icon className="text-gray-300" />{label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 break-all">{value || "—"}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                <button
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setViewModal(false); navigate(`/dashboard/users/edit/${selectedUser._id}`); }}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <FaEdit /> Edit User
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default UsersPages;
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaFilter, FaUser,
  FaUserMd, FaUserShield, FaEnvelope, FaIdCard, FaEye,
  FaTimes, FaUserCog,
} from "react-icons/fa";
import {
  Avatar, Button, DataTable, Modal, PageHeader,
  SearchBox, Spinner, EmptyState, StatCard, StatusBadge,
} from "../../common/components";
import notify from "../../common/utils/notify";


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
    <StatusBadge
      status={role}
      colors={{ bg: c.bg, text: c.text, dot: c.dot }}
      icon={Icon}
    />
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
      notify.error(err.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Real-time updates via Socket.IO
  useSocket("users:created", fetchUsers);
  useSocket("users:updated", fetchUsers);
  useSocket("users:deleted", fetchUsers);


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
      notify.success("User deleted");
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting user");
    }
  };

  const openView = (user) => { setSelectedUser(user); setViewModal(true); };

  const columns = [
    {
      key: "name",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 font-mono">#{String(user.id ?? "").slice(-8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (user) => (
        <span className="flex items-center gap-2 text-gray-600 text-xs">
          <FaEnvelope className="text-gray-300 shrink-0" />
          {user.email}
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (user) => (
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openView(user)}
            className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View"
          >
            <FaEye className="text-sm" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/users/edit/${user.id}`)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Edit"
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <PageHeader
          title="User Management"
          subtitle="Manage system users and their roles"
          icon={FaUser}
          actions={
            <Button icon={FaPlus} onClick={() => navigate("/dashboard/users/edit/new")}>
              Add New User
            </Button>
          }
        />

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

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-2">
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
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterRole === role ? "bg-white/60" : "bg-gray-200 text-gray-500"}`}>
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

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col md:flex-row gap-3">
          <SearchBox
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            placeholder="Search by name, email, or role…"
            className="flex-1"
          />
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

  
        {loading ? (
          <Spinner text="Loading users…" />
        ) : filteredUsers.length === 0 ? (
          <EmptyState text="No users found" icon={FaUser} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredUsers}
              rowKey={(user) => user.id}
            />
            <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filteredUsers.length}</span> of <span className="font-semibold text-gray-600">{users.length}</span> users
              </p>
            </div>
          </>
        )}
      </div>


      <Modal open={viewModal} onClose={() => setViewModal(false)} title={selectedUser?.name} subtitle={selectedUser?.email} size="md">
        {selectedUser && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={selectedUser.name} size="lg" />
              <div>
                <RoleBadge role={selectedUser.role} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name",  value: selectedUser.name,  icon: FaUser     },
                { label: "Email",      value: selectedUser.email, icon: FaEnvelope },
                { label: "User ID",    value: selectedUser.id,    icon: FaIdCard   },
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
              <Button variant="secondary" onClick={() => setViewModal(false)}>Close</Button>
              <Button icon={FaEdit} onClick={() => { setViewModal(false); navigate(`/dashboard/users/edit/${selectedUser.id}`); }}>
                Edit User
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default UsersPages;

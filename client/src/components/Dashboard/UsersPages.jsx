import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";

const UsersPages = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal for Add/Edit
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setFormData(
      user
        ? { name: user.name, email: user.email, role: user.role, password: "" }
        : { name: "", email: "", password: "", role: "staff" }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "staff" });
    setModalOpen(false);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Submit Add/Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
      } else {
        await api.post("/users", formData);
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || "Error occurred");
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
        >
          Add User
        </button>
      </div>


      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-400">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 ">{user.name}</td>
                  <td className="px-4 py-2 ">{user.email}</td>
                  <td className="px-4 py-2  capitalize">{user.role}</td>
                  <td className="px-4 py-2 flex space-x-3 text-xl">
                    <MdEdit
                      className="cursor-pointer text-yellow-500 hover:text-yellow-600"
                      onClick={() => handleOpenModal(user)}
                      title="Edit User"
                    />
                    <MdDelete
                      className="cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(user._id)}
                      title="Delete User"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

  
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "Edit User" : "Add User"}
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded "
                required
              />
              <input
                type="password"
                name="password"
                placeholder={editingUser ? "Leave blank to keep password" : "Password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="it">IT</option>
                <option value="communication">Communication</option>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
                <option value="nurse">Nurse</option>
                <option value="pharmacist">Pharmacist</option>
              </select>

              <div className="flex justify-end space-x-2 mt-4">
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
                >
                  {editingUser ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPages;

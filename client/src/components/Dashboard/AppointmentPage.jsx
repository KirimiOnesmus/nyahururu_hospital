import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

const AppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 🔍 Filter appointments based on patient name or doctor name
  useEffect(() => {
    const filteredData = appointments.filter(
      (appt) =>
        appt.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        appt.doctorId?.specialty
          ?.toLowerCase()
          .includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, appointments]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating status");
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Appointment Management
      </h1>

      {loading ? (
        <p className="text-gray-600">Loading appointments...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Doctor / Service
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appt) => (
                <tr
                  key={appt._id}
                  className="hover:bg-gray-50 border-b border-gray-200 transition"
                >
                  <td className="px-4 py-3">{appt.patientName}</td>
                  <td className="px-4 py-3">
                    {appt.doctorId?.specialty || appt.service || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {appt.appointmentDate
                      ? new Date(appt.appointmentDate).toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    })
                      : "—"}, 
                      {
                        appt.time
                      }
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        appt.status
                      )}`}
                    >
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-3 text-xl">
                    {appt.status !== "Confirmed" && (
                      <MdCheckCircle
                        title="Confirm"
                        className="cursor-pointer text-green-500 hover:text-green-600"
                        onClick={() => updateStatus(appt._id, "Confirmed")}
                      />
                    )}
                    {appt.status !== "Cancelled" && (
                      <MdCancel
                        title="Cancel"
                        className="cursor-pointer text-red-500 hover:text-red-600"
                        onClick={() => updateStatus(appt._id, "Cancelled")}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;

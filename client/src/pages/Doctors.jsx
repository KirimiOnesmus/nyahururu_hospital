import React, { useState, useEffect } from "react";
import { Header, TimeRibbon, Footer } from "../components/layouts";
import DoctorCard from "../components/layouts/DoctorCard";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";
import { FaTimes, FaUserMd } from "react-icons/fa";

const Doctors = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [searchParams] = useSearchParams();

  const filterByDepartment = (list, department) => {
    setFilteredDoctors(
      department ? list.filter((d) => d.department === department) : list,
    );
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await api.get("/doctors/doctors");
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setDoctors(data);

        const departments = [
          ...new Set(data.map((d) => d.department).filter(Boolean)),
        ].sort();
        setAllDepartments(departments);

        const deptParam = searchParams.get("department");
        if (deptParam) {
          const decoded = decodeURIComponent(deptParam);
          setSelectedDepartment(decoded);
          filterByDepartment(data, decoded);
        } else {
          setFilteredDoctors(data);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setDoctors([]);
        setFilteredDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [searchParams]);

  const handleDepartmentChange = (department) => {
    if (!department || department === selectedDepartment) {
      setSelectedDepartment(null);
      setFilteredDoctors(doctors);
    } else {
      setSelectedDepartment(department);
      filterByDepartment(doctors, department);
    }
  };

  const handleClearFilters = () => {
    setSelectedDepartment(null);
    setFilteredDoctors(doctors);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Medical Team
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Our Specialists
          </h2>
        </div>

        {/* ── Filter bar ── */}
        {!loading && doctors.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Department
                </label>
                <select
                  value={selectedDepartment || ""}
                  onChange={(e) =>
                    handleDepartmentChange(e.target.value || null)
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700
                             text-sm font-medium outline-none focus:border-blue-400 focus:ring-2
                             focus:ring-blue-100 transition-all"
                >
                  <option value="">All Departments</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-800">
                    {filteredDoctors.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">
                    {doctors.length}
                  </span>{" "}
                  specialists
                </p>
                {selectedDepartment && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500
                               hover:text-red-700 border border-red-200 hover:border-red-400
                               px-3 py-1.5 rounded-lg transition-colors duration-150"
                  >
                    <FaTimes className="text-[10px]" /> Clear filter
                  </button>
                )}
              </div>
            </div>

            {selectedDepartment && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50
                                 border border-blue-200 text-blue-700 text-xs font-semibold"
                >
                  Department: {selectedDepartment}
                  <button
                    onClick={handleClearFilters}
                    className="hover:text-blue-900"
                  >
                    <FaTimes className="text-[9px]" />
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading specialists…</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <FaUserMd className="text-2xl text-slate-400" />
            </div>
            <p className="font-semibold text-slate-600">
              No specialists found
              {selectedDepartment ? ` in ${selectedDepartment}` : ""}.
            </p>
            {selectedDepartment && (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-semibold rounded-xl transition-colors duration-150"
              >
                View All Specialists
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor._id} id={doctor._id} doctor={doctor} />
            ))}
          </div>
        )}
      </main>

      <div className="border-t border-slate-200">
        <TimeRibbon />
      </div>

      <Footer />
    </div>
  );
};

export default Doctors;

import React, { useState, useEffect } from "react";
import { TimeRibbon } from "../components/layouts";
import{Header, Footer} from "../common/layouts"
import DoctorCard from "../components/layouts/DoctorCard";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";
import {
  FaTimes,
  FaUserMd,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";

const PAGE_SIZE = 8;

const DoctorSlider = ({ doctors, page, totalPages, onPageChange }) => {
  if (!doctors.length) return null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.id} id={doctor.id} doctor={doctor} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                aria-label={`Go to page ${i + 1}`}
                className={`rounded-full transition-all duration-200 cursor-pointer ${
                  i + 1 === page
                    ? "w-6 h-2 bg-blue-600"
                    : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className={`
                w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150
                ${
                  page > 1
                    ? "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 bg-white cursor-pointer"
                    : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                }
              `}
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
              className={`
                w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150
                ${
                  page < totalPages
                    ? "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 bg-white cursor-pointer"
                    : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                }
              `}
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Doctors = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(() => searchParams.get("department") || null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    api.get("/doctors/doctors/filter-options")
      .then(({ data }) => setAllDepartments(data.specialities || []))
      .catch((err) => console.error("Failed to load specialist filters:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await api.get("/doctors/doctors", {
          params: {
            page,
            limit: PAGE_SIZE,
            speciality: selectedDepartment || undefined,
            search: debouncedSearch || undefined,
          },
        });
        if (!isMounted) return;
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setDoctors(data);
        setPagination(res.data.meta || { page: 1, pages: 1, total: data.length });
      } catch {
        if (!isMounted) return;
        setDoctors([]);
        setPagination({ page: 1, pages: 1, total: 0 });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { isMounted = false; };
  }, [page, selectedDepartment, debouncedSearch]);

  useEffect(() => {
    setSelectedDepartment(searchParams.get("department") || null);
    setPage(1);
  }, [searchParams]);

  const handleDepartmentChange = (department) => {
    setSelectedDepartment(department || null);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedDepartment(null);
    setSearch("");
    setPage(1);
  };

  const totalPages = Math.max(1, pagination.pages || 1);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
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

        {!loading && doctors.length > 0 && (
          <div className="py-2 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex items-center gap-4 sm:mr-auto">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-800">
                    {doctors.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">
                    {pagination.total}
                  </span>{" "}
                  specialists
                </p>
                {(selectedDepartment || search) && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500
                               hover:text-red-700 px-2 py-1.5 transition-colors duration-150"
                  >
                    <FaTimes className="text-[10px]" /> Clear filter
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder="Search specialists…"
                    aria-label="Search specialists"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <select
                  value={selectedDepartment || ""}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  aria-label="Filter by speciality"
                  className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="">All Specialities</option>
                  {allDepartments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading specialists…</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <FaUserMd className="text-2xl text-slate-400" />
            </div>
            <p className="font-semibold text-slate-600">
              No specialists found{selectedDepartment ? ` in ${selectedDepartment}` : ""}.
            </p>
            {(selectedDepartment || search) && (
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
          <DoctorSlider
            doctors={doctors}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
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

import React, { useState, useEffect } from "react";
import { Header, TimeRibbon, Footer } from "../components/layouts";
import DoctorCard from "../components/layouts/DoctorCard";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";

const Doctors = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await api.get("/doctors/doctors");

        // Ensure we always get an array
        const doctorsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setDoctors(doctorsData);

        const departments = [
          ...new Set(doctorsData.map((d) => d.department).filter(Boolean)),
        ].sort();
        setAllDepartments(departments);

        const departmentParam = searchParams.get("department");
        if (departmentParam) {
          const decodedDepartment = decodeURIComponent(departmentParam);
          setSelectedDepartment(decodedDepartment);
          filterDoctorsByDepartment(doctorsData, decodedDepartment);
        } else {
          setFilteredDoctors(doctorsData);
          setSelectedDepartment(null);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        // fallback to empty array
        setDoctors([]);
        setFilteredDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [searchParams]);

  const filterDoctorsByDepartment = (doctorsList, department) => {
    if (!department) {
      setFilteredDoctors(doctorsList);
      return;
    }
    const filtered = doctorsList.filter(
      (doctor) => doctor.department === department
    );
    setFilteredDoctors(filtered);
  };

  const handleDepartmentChange = (department) => {
    if (department === null || department === selectedDepartment) {
      setSelectedDepartment(null);
      setFilteredDoctors(doctors);
    } else {
      setSelectedDepartment(department);
      filterDoctorsByDepartment(doctors, department);
    }
  };

  const handleClearFilters = () => {
    setSelectedDepartment(null);
    setFilteredDoctors(doctors);
  };

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body h-full">
        <div className="px-6 md:px-16 py-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
              Our Specialists
            </h2>
            <p className="text-gray-700">
              Showing{" "}
              <span className="font-bold text-blue-600">
                {filteredDoctors.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-blue-600">{doctors.length}</span>{" "}
              specialists
              {selectedDepartment && (
                <span className="text-blue-700 ml-2">
                  in <span className="font-bold">{selectedDepartment}</span>
                </span>
              )}
            </p>
          </div>

          {/* Department Filter */}
          {!loading && doctors.length > 0 && (
            <div className="mb-8">
              <div>
                <p className="text-gray-700 mb-3 font-semibold text-lg">
                  Filter by Department:
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <button
                    onClick={() => handleDepartmentChange(null)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                      selectedDepartment === null
                        ? "bg-blue-600 text-white shadow-md scale-105"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    All Departments
                  </button>
                  {allDepartments.map((department) => (
                    <button
                      key={department}
                      onClick={() => handleDepartmentChange(department)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shadow-sm ${
                        selectedDepartment === department
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No specialists found in this department
              </p>
              {selectedDepartment && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Specialists
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Doctors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor._id}
                    id={doctor._id}
                    doctor={doctor}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <TimeRibbon />
        </div>
      </div>
      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default Doctors;

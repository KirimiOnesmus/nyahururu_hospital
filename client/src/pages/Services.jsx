import React, { useEffect, useState } from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../components/layouts";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { FaTimes } from "react-icons/fa";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Services = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allDivisions, setAllDivisions] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesInDivision, setCategoriesInDivision] = useState([]);
  const [searchParams] = useSearchParams();

  const filterServices = (list, division, category) => {
    let result = list;
    if (division) result = result.filter((s) => s.division === division);
    if (category) result = result.filter((s) => s.category === category);
    setFilteredServices(result);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");
        if (!isMounted) return;

        const data = res.data;
        setServices(data);
        setError(null);

        const divisions = [
          ...new Set(data.map((s) => s.division).filter(Boolean)),
        ].sort();
        const categories = [
          ...new Set(data.map((s) => s.category).filter(Boolean)),
        ].sort();
        setAllDivisions(divisions);
        setAllCategories(categories);

        const divParam = searchParams.get("division");
        const catParam = searchParams.get("category");

        if (divParam) {
          const div = decodeURIComponent(divParam);
          setSelectedDivision(div);

          const divCats = [
            ...new Set(
              data
                .filter((s) => s.division === div)
                .map((s) => s.category)
                .filter(Boolean),
            ),
          ].sort();
          setCategoriesInDivision(divCats);

          if (catParam) {
            const cat = decodeURIComponent(catParam);
            setSelectedCategory(cat);
            filterServices(data, div, cat);
          } else {
            filterServices(data, div, null);
          }
        } else if (catParam) {
          const cat = decodeURIComponent(catParam);
          setSelectedCategory(cat);
          filterServices(data, null, cat);
        } else {
          setFilteredServices(data);
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        if (!isMounted) return;
        setError("Failed to load services. Please try again.");
        setServices([]);
        setFilteredServices([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleDivisionChange = (division) => {
    if (!division || division === selectedDivision) {
      setSelectedDivision(null);
      setSelectedCategory(null);
      setCategoriesInDivision([]);
      filterServices(services, null, null);
      return;
    }
    setSelectedDivision(division);
    setSelectedCategory(null);

    const divCats = [
      ...new Set(
        services
          .filter((s) => s.division === division)
          .map((s) => s.category)
          .filter(Boolean),
      ),
    ].sort();
    setCategoriesInDivision(divCats);
    filterServices(services, division, null);
  };

  const handleCategoryChange = (category) => {
    if (!category || category === selectedCategory) {
      setSelectedCategory(null);
      filterServices(services, selectedDivision, null);
    } else {
      setSelectedCategory(category);
      filterServices(services, selectedDivision, category);
    }
  };

  const handleClearFilters = () => {
    setSelectedDivision(null);
    setSelectedCategory(null);
    setCategoriesInDivision([]);
    setFilteredServices(services);
  };

  const hasActiveFilter = selectedDivision || selectedCategory;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            What We Offer
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Our Services &amp; Departments
            {selectedDivision && (
              <span className="text-blue-600"> — {selectedDivision}</span>
            )}
          </h2>
        </div>

        {/* ── Filters ── */}
        {!loading && services.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8">
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Division
                  </label>
                  <select
                    value={selectedDivision || ""}
                    onChange={(e) =>
                      handleDivisionChange(e.target.value || null)
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700
                               text-sm font-medium outline-none focus:border-blue-400 focus:ring-2
                               focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="">All Divisions</option>
                    {allDivisions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[180px]">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Category
                    {selectedDivision && (
                      <span className="normal-case font-normal text-slate-400 ml-1">
                        (in {selectedDivision})
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value || null)
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700
                               text-sm font-medium outline-none focus:border-blue-400 focus:ring-2
                               focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {(selectedDivision
                      ? categoriesInDivision
                      : allCategories
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Count + clear */}
              <div className="flex items-center gap-4 shrink-0">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-800">
                    {filteredServices.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">
                    {services.length}
                  </span>{" "}
                  services
                </p>
                {hasActiveFilter && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500
                               hover:text-red-700 border border-red-200 hover:border-red-400
                               px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer"
                  >
                    <FaTimes className="text-[10px]" /> Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilter && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                {selectedDivision && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50
                                   border border-blue-200 text-blue-700 text-xs font-semibold"
                  >
                    Division: {selectedDivision}
                    <button
                      onClick={() => handleDivisionChange(null)}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100
                                   border border-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Category: {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className="hover:text-slate-900 cursor-pointer"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── States ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading services…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-xl">
            {error}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-slate-600 font-semibold">
              No services found with the selected filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                         rounded-xl transition-colors duration-150 cursor-pointer"
            >
              Clear Filters &amp; View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div key={service._id} className="relative">
                {service.nhifCovered && (
                  <span
                    className="absolute top-3 right-3 z-10 text-xs px-2.5 py-0.5 rounded-full
                                   font-semibold bg-emerald-600 text-white border border-emerald-700"
                  >
                    SHA Covered
                  </span>
                )}
                <Card
                  id={service._id}
                  image={`${BACKEND_URL}${service.imageUrl}`}
                  title={service.name}
                  buttonText="Learn More"
                />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-16 pt-10 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1 text-center">
              Trusted By
            </p>
            <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
              Our Partners
            </h3>
            <Partners />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Services;

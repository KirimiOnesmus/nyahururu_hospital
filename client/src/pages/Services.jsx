import React, { useEffect, useState } from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../common/layouts";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { ASSET_BASE_URL } from "../config/env";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const BACKEND_URL = ASSET_BASE_URL;
const PAGE_SIZE = 6;


const ServiceSlider = ({ services }) => {
  if (!services.length) return null;

  return (
    <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => (
          <div key={service.id} className="relative">
            {service.nhifCovered && (
              <span
                className="absolute top-3 right-3 z-10 text-xs px-2.5 py-0.5 rounded-full
                           font-semibold bg-emerald-600 text-white border border-emerald-700"
              >
                SHA Covered
              </span>
            )}
            <Card
              id={service.id}
              image={`${BACKEND_URL}${service.imageUrl}`}
              title={service.name}
              buttonText="Learn More"
            />
          </div>
        ))}
      </div>

   
    </div>
  );
};

const Services = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(() => searchParams.get("division") || null);
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || null);
  const [allDivisions, setAllDivisions] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesInDivision, setCategoriesInDivision] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    api.get("/services/filters").then(({ data }) => {
      setAllDivisions(data.divisions || []);
      setAllCategories(data.categories || []);
      setCategoriesInDivision(data.categoriesByDivision?.[selectedDivision] || []);
    }).catch((err) => console.error("Failed to load service filters:", err));
  }, [selectedDivision]);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services", {
          params: {
            page,
            limit: PAGE_SIZE,
            division: selectedDivision || undefined,
            category: selectedCategory || undefined,
          },
        });
        if (!isMounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setServices(data);
        setPagination(res.data.meta || { page: 1, pages: 1, total: data.length });
        setError(null);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        if (!isMounted) return;
        setError("Failed to load services. Please try again.");
        setServices([]);
        setPagination({ page: 1, pages: 1, total: 0 });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchServices();
    return () => { isMounted = false; };
  }, [page, selectedDivision, selectedCategory]);

  useEffect(() => {
    setSelectedDivision(searchParams.get("division") || null);
    setSelectedCategory(searchParams.get("category") || null);
    setPage(1);
  }, [searchParams]);

  const handleDivisionChange = (division) => {
    if (!division || division === selectedDivision) {
      setSelectedDivision(null);
      setSelectedCategory(null);
      setCategoriesInDivision([]);
      setPage(1);
      return;
    }
    setSelectedDivision(division);
    setSelectedCategory(null);
    setCategoriesInDivision([]);
    setPage(1);
  };

  const handleCategoryChange = (category) => {
    if (!category || category === selectedCategory) {
      setSelectedCategory(null);
      setPage(1);
    } else {
      setSelectedCategory(category);
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setSelectedDivision(null);
    setSelectedCategory(null);
    setCategoriesInDivision([]);
    setPage(1);
  };

  const hasActiveFilter = selectedDivision || selectedCategory;
  const totalPages = Math.max(1, pagination.pages || 1);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
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

  
        {!loading && services.length > 0 && (
          <div className="py-2 mb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex items-center gap-4 md:mr-auto">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-800">{services.length}</span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">{pagination.total}</span>{" "}
                  services
                </p>
                {hasActiveFilter && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500
                               hover:text-red-700 px-2 py-1.5 transition-colors duration-150 cursor-pointer"
                  >
                    <FaTimes className="text-[10px]" /> Clear filters
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto md:ml-auto">
                <div className="flex flex-col gap-1 w-full sm:w-52">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Division
                  </label>
                  <select
                    value={selectedDivision || ""}
                    onChange={(e) => handleDivisionChange(e.target.value || null)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700
                               text-sm font-medium outline-none focus:border-blue-400 focus:ring-2
                               focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="">All Divisions</option>
                    {allDivisions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-52">
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
                    onChange={(e) => handleCategoryChange(e.target.value || null)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700
                               text-sm font-medium outline-none focus:border-blue-400 focus:ring-2
                               focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {(selectedDivision ? categoriesInDivision : allCategories).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}


        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading services…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-xl">
            {error}
          </div>
        ) : services.length === 0 ? (
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
          <>
            <ServiceSlider services={services} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-40"
                    aria-label="Previous services page"
                  ><FaChevronLeft className="text-xs" /></button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-40"
                    aria-label="Next services page"
                  ><FaChevronRight className="text-xs" /></button>
                </div>
              </div>
            )}
          </>
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

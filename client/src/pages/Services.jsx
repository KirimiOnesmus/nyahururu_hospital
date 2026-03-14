import React, { useEffect, useState } from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../components/layouts";
// import axios from "axios";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";

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

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    let isMounted = true;

    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");

        if (isMounted) {
          setServices(res.data);
          setError(null);

          const divisions = [
            ...new Set(res.data.map((s) => s.division).filter(Boolean)),
          ];
          setAllDivisions(divisions.sort());

          const categories = [
            ...new Set(res.data.map((s) => s.category).filter(Boolean)),
          ];
          setAllCategories(categories.sort());

          const divisionParam = searchParams.get("division");
          const categoryParam = searchParams.get("category");

          if (divisionParam) {
            const decodedDivision = decodeURIComponent(divisionParam);
            setSelectedDivision(decodedDivision);

            const divisionCategories = [
              ...new Set(
                res.data
                  .filter((s) => s.division === decodedDivision)
                  .map((s) => s.category)
                  .filter(Boolean)
              ),
            ].sort();
            setCategoriesInDivision(divisionCategories);

            if (categoryParam) {
              const decodedCategory = decodeURIComponent(categoryParam);
              setSelectedCategory(decodedCategory);
              filterServices(res.data, decodedDivision, decodedCategory);
            } else {
              filterServices(res.data, decodedDivision, null);
            }
          } else if (categoryParam) {
            const decodedCategory = decodeURIComponent(categoryParam);
            setSelectedCategory(decodedCategory);
            filterServices(res.data, null, decodedCategory);
          } else {
            setFilteredServices(res.data);
            setSelectedDivision(null);
            setSelectedCategory(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        if (isMounted) {
          setError("Failed to load services. Please try again.");
          setServices([]);
          setFilteredServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const filterServices = (servicesList, division, category) => {
    let filtered = servicesList;

    if (division) {
      filtered = filtered.filter((service) => service.division === division);
    }

    if (category) {
      filtered = filtered.filter((service) => service.category === category);
    }

    setFilteredServices(filtered);
  };

  const handleDivisionChange = (division) => {
    if (division === null || division === selectedDivision) {
      // Clear division filter
      setSelectedDivision(null);
      setSelectedCategory(null);
      setCategoriesInDivision([]);
      filterServices(services, null, null);
    } else {
      setSelectedDivision(division);
      setSelectedCategory(null);

      const divisionCategories = [
        ...new Set(
          services
            .filter((s) => s.division === division)
            .map((s) => s.category)
            .filter(Boolean)
        ),
      ].sort();
      setCategoriesInDivision(divisionCategories);

      filterServices(services, division, null);
    }
  };

  const handleCategoryChange = (category) => {
    if (category === null || category === selectedCategory) {
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
  // if(loading){
  //   return(
  //      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
  //       <div className="flex flex-col justify-center items-center gap-4">
  //         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>

  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body px-6 md:px-12 py-8">
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6 flex items-center">
          Our Services & Departments -{" "}
          <span
            className={` rounded-full  ${
              selectedDivision === "Outpatient"
                ? "text-purple-600 "
                : "text-indigo-600 "
            }`}
          >
            ({selectedDivision})
          </span>
        </h2>

        {!loading && services.length > 0 && (
          <div className="mb-8">
            <div className="">
              <div className="md:flex items-center justify-between mb-4">
                {" "}
                <p className="text-gray-700 mb-3 font-semibold text-lg">
                  Filter by Category
                  {selectedDivision && (
                    <span className="text-sm text-gray-500 ml-2">
                      (in {selectedDivision})
                    </span>
                  )}
                  :
                </p>
                <p className="text-gray-700">
                  Showing{" "}
                  <span className="font-bold text-blue-600">
                    {filteredServices.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-blue-600">
                    {services.length}
                  </span>{" "}
                  services
                  {selectedCategory && (
                    <span className="text-blue-700 ml-2">
                      in <span className="font-bold">{selectedCategory}</span>{" "}
                      category
                    </span>
                  )}
                </p>
              </div>

              <div className="w-full md:w-auto md:ml-auto">
                <select
                  id="category-select"
                  value={selectedCategory || ""}
                  onChange={(e) => handleCategoryChange(e.target.value || null)}
                  className="w-full md:w-64 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {selectedDivision ? (
                    categoriesInDivision.length > 0 ? (
                      categoriesInDivision.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        No categories available in this division
                      </option>
                    )
                  ) : (
                    allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              No services found with the selected filters
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters & View All Services
            </button>
          </div>
        ) : (
          <>
            <div className="services grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service._id} className="relative">
                  {service.nhifCovered && (
                    <span className="absolute top-4 right-4 z-10 text-xs px-3 py-1 rounded-full font-semibold shadow-md bg-green-600 text-white">
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
          </>
        )}

        <div className="py-12">
          <h3 className="text-3xl font-bold my-4 text-center">Our Partners</h3>
          <Partners />
        </div>
      </div>

      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default Services;

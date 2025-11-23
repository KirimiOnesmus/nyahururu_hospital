import React, { useEffect, useState, useMemo } from "react";
import Card from "../components/layouts/Card";
import { Header, Partners, Footer } from "../components/layouts";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());

  const BACKEND_URL = "http://localhost:5000";
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/services");
        setServices(res.data);
        setLoading(false);
        console.log(res.data);
        // Auto-expand all departments by default
        const departments = new Set();
        res.data.forEach(service => {
          const dept = service.department || "Other Services";
          departments.add(dept);
        });
        setExpandedDepartments(departments);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    
    const query = searchQuery.toLowerCase();
    return services.filter(service => 
      service.name?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query) ||
      service.department?.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  // Group services by department with fallback logic
  const groupedServices = useMemo(() => {
    const groups = {};
    
    filteredServices.forEach(service => {
      // Auto-categorize if no department is set
      let department = service.department;
      if (!department || department.trim() === "") {
        // Fallback: try to infer from service name
        const name = service.name?.toLowerCase() || "";
        if (name.includes("emergency") || name.includes("icu")) {
          department = "Emergency & Critical Care";
        } else if (name.includes("surgery") || name.includes("surgical")) {
          department = "Surgical Services";
        } else if (name.includes("lab") || name.includes("laboratory")) {
          department = "Laboratory Services";
        } else if (name.includes("radiology") || name.includes("imaging") || name.includes("x-ray")) {
          department = "Radiology & Imaging";
        } else if (name.includes("pharmacy") || name.includes("pharmaceutical")) {
          department = "Pharmacy Services";
        } else if (name.includes("dental") || name.includes("dentistry")) {
          department = "Dental Services";
        } else if (name.includes("pediatric") || name.includes("paediatric")) {
          department = "Pediatric Services";
        } else if (name.includes("therapy") || name.includes("rehab")) {
          department = "Rehabilitation Services";
        } else if (name.includes("wellness") || name.includes("nutrition")) {
          department = "Wellness & Nutrition";
        } else {
          department = "Other Services";
        }
      }
      
      if (!groups[department]) {
        groups[department] = [];
      }
      groups[department].push(service);
    });
    
    return groups;
  }, [filteredServices]);

  const toggleDepartment = (department) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(department)) {
      newExpanded.delete(department);
    } else {
      newExpanded.add(department);
    }
    setExpandedDepartments(newExpanded);
  };

  return (
    <div className="">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="body px-12 py-8">
        <h2 className="text-3xl font-bold border-l-4 border-blue-500 px-2 mb-6">
          Our Services
        </h2>
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search services by name, description, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <p>Loading services...</p>
        ) : (
          <div className="services">
            {Object.keys(groupedServices).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No services found matching your search.</p>
            ) : (
              Object.entries(groupedServices)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([department, deptServices]) => (
                  <div key={department} className="mb-8">
                    <button
                      onClick={() => toggleDepartment(department)}
                      className="flex items-center justify-between w-full text-left mb-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <h3 className="text-2xl font-bold text-blue-700">
                        {department} ({deptServices.length})
                      </h3>
                      <span className="text-blue-700">
                        {expandedDepartments.has(department) ? (
                          <FaChevronUp className="inline" />
                        ) : (
                          <FaChevronDown className="inline" />
                        )}
                      </span>
                    </button>
                    
                    {expandedDepartments.has(department) && (
                      <div className="grid md:grid-cols-3 gap-6 ml-4">
                        {deptServices.map((service) => (
                          <Card
                            key={service._id}
                            id={service._id}
                            image={`${BACKEND_URL}${service.imageUrl}`}
                            title={service.name}
                            buttonText="Learn More"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}
        
        <div className="py-4">
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

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdMenu, MdClose, MdOutlineArrowDropDown, MdPhone, MdLocalHospital, MdPerson } from "react-icons/md";
import logo from "../../assets/logo.png";
import api from "../../api/axios";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const dropdownRef = useRef(null);
  
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname + location.search;

  // const BACKEND_URL = "http://localhost:5000";

  // Fetch divisions from backend
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoadingDivisions(true);
        const res = await api.get("/services");
       
        const uniqueDivisions = [...new Set(
          res.data.map(s => s.division).filter(Boolean)
        )].sort();
        
        setDivisions(uniqueDivisions);
      } catch (error) {
        console.error("Failed to fetch divisions:", error);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const handleDivisionClick = (division) => {
    navigate(`/services?division=${encodeURIComponent(division)}`);
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { 
      name: "Our Departments", 
      path: "/services",
      dropdown: "departments",
      items: divisions
    },
    { name: "Our Specialists", path: "/doctors" },
    { 
      name: "Contact Us", 
      path: "/contact",
      dropdown: "contact",
      items: [
        { name: "Patient Feedback", path: "/feedback" },
        { name: "Report Fraud", path: "/report-fraud" },
        { name: "Ask Doctor", path: "/ask-doctor" },
        { name: "Book Appointment", path: "/appointment" },
        { name: "Virtual Tour", path: "/virtual-tour" }
      ]
    }
  ];

  const donationItems = [
    { name: "Blood Donation", path: "/blood-donation" },
    { name: "Financial Aid", path: "/financial-aid" }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="border-b border-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            <a 
              href="tel:+254712345678" 
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              <MdPhone className="text-lg" />
              +254712345678
            </a>
            <button
              onClick={() => handleNavigate("/ambulance-services")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 px-4 py-1 rounded-lg text-black font-semibold hover:text-green-600 transition-colors text-sm sm:text-base"
            >
              <MdLocalHospital className="text-lg" />
              Ambulance Services
            </button>
          </div>
        </div>
      </div>

   
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-2">
        <div className="flex items-center justify-between py-2">

          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => handleNavigate("/")}
          >
            <img src={logo} alt="N.C.R.H logo" className="w-14 h-14 sm:w-18 sm:h-18" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">N.C.R.H</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {navLinks.map((link) => (
              <div key={link.name} className="relative">
                {link.dropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(link.dropdown)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-lg transition-colors ${
                        activePage.startsWith(link.path)
                          ? "text-blue-500"
                          : "text-gray-900 hover:text-blue-500"
                      }`}
                    >
                      {link.name}
                      <MdOutlineArrowDropDown className={`text-xl transition-transform duration-300 ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === link.dropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                        {link.dropdown === "departments" ? (
                          loadingDivisions ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                              <p className="mt-2 text-sm">Loading departments...</p>
                            </div>
                          ) : divisions.length === 0 ? (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              No departments available
                            </div>
                          ) : (
                            divisions.map((division, index) => (
                              <button
                                key={division}
                                onClick={() => handleDivisionClick(division)}
                                className={`w-full text-left px-4 py-3 hover:bg-blue-100 transition-colors text-gray-700 hover:font-semibold ${
                                  index !== divisions.length - 1 ? "border-b border-gray-100" : ""
                                } ${
                                  activePage.includes(encodeURIComponent(division))
                                    ? "bg-blue-100 font-semibold"
                                    : ""
                                }`}
                              >
                                {division}
                              </button>
                            ))
                          )
                        ) : (
                          link.items.map((item, index) => (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-100 transition-colors text-gray-700 hover:font-semibold ${
                                index !== link.items.length - 1 ? "border-b border-gray-100" : ""
                              } ${
                                activePage === item.path
                                  ? "bg-blue-100 font-semibold"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleNavigate(link.path)}
                    className={`px-3 py-2 rounded-lg font-semibold text-lg transition-colors ${
                      activePage === link.path
                        ? "text-blue-500"
                        : "text-gray-900 hover:text-blue-500"
                    }`}
                  >
                    {link.name}
                  </button>
                )}
              </div>
            ))}

            <div className="relative ml-2">
              <button
                onClick={() => toggleDropdown("donations")}
                className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                Donations
                <MdOutlineArrowDropDown className={`text-xl transition-transform duration-300 ${
                  activeDropdown === "donations" ? "rotate-180" : ""
                }`} />
              </button>
              
              {activeDropdown === "donations" && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                  {donationItems.map((item, index) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-100 transition-colors text-gray-700 hover:font-semibold ${
                        index !== donationItems.length - 1 ? "border-b border-gray-100" : ""
                      } ${
                        activePage === item.path
                          ? "bg-blue-100 font-semibold"
                          : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              onClick={() => handleNavigate("/hmis")}
              className="ml-2 flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
            >
              <MdPerson className="text-xl" />
              Log In
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-3xl text-gray-900 hover:text-blue-500 transition-colors"
          >
            {isOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[116px] w-1/2 h-screen bg-blue-400 overflow-y-auto z-40">
          <div className="px-1 py-4 space-y-2">
            {navLinks.map((link) => (
              <div key={link.name}>
                {link.dropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(link.dropdown)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold text-lg transition-colors ${
                        activePage.startsWith(link.path)
                          ? "text-white bg-blue-500"
                          : "text-white hover:bg-blue-500"
                      }`}
                    >
                      {link.name}
                      <MdOutlineArrowDropDown className={`text-xl transition-transform duration-300 ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`} />
                    </button>
                    {activeDropdown === link.dropdown && (
                      <div className="ml-4 mt-2 space-y-1 bg-blue-300 rounded-lg p-2">
                        {link.dropdown === "departments" ? (
                          loadingDivisions ? (
                            <div className="px-4 py-4 text-center text-white">
                              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              <p className="mt-2 text-sm">Loading...</p>
                            </div>
                          ) : divisions.length === 0 ? (
                            <div className="px-4 py-3 text-center text-white text-sm">
                              No departments available
                            </div>
                          ) : (
                            divisions.map((division) => (
                              <button
                                key={division}
                                onClick={() => handleDivisionClick(division)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-white hover:bg-blue-400 hover:font-semibold ${
                                  activePage.includes(encodeURIComponent(division))
                                    ? "bg-blue-400 font-semibold"
                                    : ""
                                }`}
                              >
                                {division}
                              </button>
                            ))
                          )
                        ) : (
                          link.items.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-white hover:bg-blue-400 hover:font-semibold ${
                                activePage === item.path
                                  ? "bg-blue-400 font-semibold"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleNavigate(link.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-lg transition-colors ${
                      activePage === link.path
                        ? "text-white bg-blue-500"
                        : "text-white hover:bg-blue-500"
                    }`}
                  >
                    {link.name}
                  </button>
                )}
              </div>
            ))}


            <div>
              <button
                onClick={() => toggleDropdown("donations")}
                className="w-full flex items-center justify-between px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                Donations
                <MdOutlineArrowDropDown className={`text-xl transition-transform duration-300 ${
                  activeDropdown === "donations" ? "rotate-180" : ""
                }`} />
              </button>
              {activeDropdown === "donations" && (
                <div className="ml-4 mt-2 space-y-1 bg-green-400 rounded-lg p-2">
                  {donationItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-white hover:bg-green-500 hover:font-semibold ${
                        activePage === item.path
                          ? "bg-green-500 font-semibold"
                          : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavigate("/hmis")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
            >
              <MdPerson className="text-xl" />
              Log In
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
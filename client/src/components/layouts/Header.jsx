import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdMenu,
  MdClose,
  MdOutlineArrowDropDown,
  MdPhone,
  MdLocalHospital,
  MdPerson,
} from "react-icons/md";
import logo from "../../assets/logo.png";
import api from "../../api/axios";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const donationDropdownRef = useRef(null);

  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const activePath = pathname;
  const activeQuery = search;

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoadingDivisions(true);
        const res = await api.get("/services");
        const unique = [
          ...new Set(res.data.map((s) => s.division).filter(Boolean)),
        ].sort();
        setDivisions(unique);
      } catch (error) {
        console.error("Division fetch failed", error.message);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };
    fetchDivisions();
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      const isInsideNav =
        dropdownRef.current && dropdownRef.current.contains(e.target);
      const isInsideDonation =
        donationDropdownRef.current &&
        donationDropdownRef.current.contains(e.target);

      if (!isInsideNav && !isInsideDonation) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveDropdown(null);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const goTo = (path) => {
    // console.log("Navigating to:", path);
    setIsOpen(false);
    setActiveDropdown(null);
    navigate(path);
  };

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    {
      name: "Our Departments",
      dropdown: "departments",
      items: divisions,
    },
    { name: "Our Specialists", path: "/doctors" },
    {
      name: "Contact Us",
      dropdown: "contact",
      items: [
        { name: "Patient Feedback", path: "/feedback" },
        { name: "Report Fraud", path: "/report-fraud" },
        { name: "Ask Doctor", path: "/ask-doctor" },
        { name: "Book Appointment", path: "/appointment" },
        { name: "Virtual Tour", path: "/virtual-tour" },
      ],
    },
  ];

  const donationItems = [
    { name: "Blood Donation", path: "/blood-donation" },
    { name: "Financial Aid", path: "/financial-aid" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 py-2">
            <a
              href="tel:+254712345678"
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              <MdPhone className="text-lg" /> +254712345678
            </a>
            <button
              onClick={() => goTo("/ambulance-services")}
              className="flex items-center gap-2 px-4 py-1 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 hover:text-green-600"
            >
              <MdLocalHospital className="text-xl" /> Ambulance Services
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => goTo("/")}
          >
            <img src={logo} alt="N.C.R.H Logo" className="w-14 h-14" />
            <h1 className="text-2xl font-bold">N.C.R.H</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-2" ref={dropdownRef}>
            {navLinks.map((link) =>
              !link.dropdown ? (
                <button
                  key={link.name}
                  onClick={() => goTo(link.path)}
                  className={`px-3 py-2 text-lg font-semibold rounded-lg cursor-pointer ${
                    activePath === link.path
                      ? "text-blue-600"
                      : "text-gray-900 hover:text-blue-600"
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <div key={link.name} className="relative">
                  <button
                    onClick={() => toggleDropdown(link.dropdown)}
                    className="flex items-center gap-1 px-3 py-2 text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                  >
                    {link.name}
                    <MdOutlineArrowDropDown
                      className={`transition-transform ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === link.dropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-lg border 
                     border-gray-200 overflow-hidden">
                      {link.dropdown === "departments" ? (
                        loadingDivisions ? (
                          <div className="p-4 text-center text-gray-500">
                            Loading...
                          </div>
                        ) : divisions.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No departments
                          </div>
                        ) : (
                          divisions.map((d) => (
                            <button
                              key={d}
                              onClick={() =>
                                goTo(
                                  `/services?division=${encodeURIComponent(d)}`
                                )
                              }
                              className={`w-full text-left px-4 py-3 hover:bg-blue-100 cursor-pointer ${
                                activeQuery.includes(encodeURIComponent(d))
                                  ? "bg-blue-100 font-semibold"
                                  : ""
                              }`}
                            >
                              {d}
                            </button>
                          ))
                        )
                      ) : (
                        link.items?.map((it) => (
                          <button
                            key={it.path}
                            onClick={() => goTo(it.path)}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-100 cursor-pointer ${
                              activePath === it.path
                                ? "bg-blue-100 font-semibold"
                                : ""
                            }`}
                          >
                            {it.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            <div className="relative">
              <button
                onClick={() => toggleDropdown("donations")}
                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600"
              >
                Donations
                <MdOutlineArrowDropDown
                  className={`transition-transform ${
                    activeDropdown === "donations" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeDropdown === "donations" && (
                <div
                  className="absolute top-full right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border
                 border-gray-200 overflow-hidden cursor-pointer"
                >
                  {donationItems.map((d) => (
                    <button
                      key={d.path}
                      onClick={() => goTo(d.path)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-100 cursor-pointer ${
                        activePath === d.path ? "bg-blue-100 font-semibold" : ""
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => goTo("/hmis")}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer"
            >
              <MdPerson className="text-xl" /> Log In
            </button>
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-3xl p-2 cursor-pointer"
          >
            {isOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>
      </div>
      {/* Phone menu */}
      {isOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed top-[116px] left-0 w-3/4 max-w-sm h-[calc(100vh-116px)] bg-blue-400 z-[9999] overflow-y-auto p-4 space-y-3 text-white shadow-2xl"
          style={{ touchAction: "auto" }}
        >
          {navLinks.map((link) => (
            <div key={link.name}>
              {!link.dropdown ? (
                <button
                  onClick={() => {
                    goTo(link.path);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-lg font-semibold cursor-pointer ${
                    activePath === link.path
                      ? "bg-blue-500"
                      : "hover:bg-blue-500"
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(link.dropdown);
                    }}
                    className="w-full flex justify-between items-center px-3 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600"
                  >
                    {link.name}
                    <MdOutlineArrowDropDown
                      className={`transition-transform ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === link.dropdown && (
                    <div
                      className="ml-4 mt-2 space-y-2 relative z-10"
                      style={{ pointerEvents: "auto" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {link.dropdown === "departments" ? (
                        loadingDivisions ? (
                          <div className="p-2 text-center text-white/70">
                            Loading...
                          </div>
                        ) : divisions.length === 0 ? (
                          <div className="p-2 text-center text-white/70">
                            No departments
                          </div>
                        ) : (
                          divisions.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                goTo(
                                  `/services?division=${encodeURIComponent(d)}`
                                );
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer ${
                                activeQuery.includes(encodeURIComponent(d))
                                  ? "bg-blue-600 font-semibold"
                                  : "hover:bg-blue-600"
                              }`}
                            >
                              {d}
                            </button>
                          ))
                        )
                      ) : (
                        link.items?.map((it) => (
                          <button
                            key={it.path}
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              goTo(it.path);
                            }}
                            className={`block w-full text-left px-3 py-2 rounded-lg cursor-pointer ${
                              activePath === it.path
                                ? "bg-blue-600 font-semibold"
                                : "hover:bg-blue-600"
                            }`}
                            style={{
                              pointerEvents: "auto",
                              userSelect: "none",
                            }}
                          >
                            {it.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          <div ref={donationDropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown("donations");
              }}
              className="w-full flex justify-between items-center px-3 py-3 rounded-lg text-lg font-semibold cursor-pointer bg-green-500 hover:bg-green-600"
            >
              Donations
              <MdOutlineArrowDropDown
                className={`transition-transform ${
                  activeDropdown === "donations" ? "rotate-180" : ""
                }`}
              />
            </button>

            {activeDropdown === "donations" && (
              <div
                className="ml-4 mt-2 space-y-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                {donationItems.map((d) => (
                  <button
                    key={d.path}
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      goTo(d.path);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer ${
                      activePath === d.path
                        ? "bg-green-600 font-semibold"
                        : "hover:bg-green-600"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              goTo("/hmis");
            }}
            className="w-full text-center mt-4 px-4 py-3 bg-green-500 cursor-pointer hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <MdPerson className="text-xl" /> Log In
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;

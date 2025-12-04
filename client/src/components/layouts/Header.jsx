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
  const [isOpen, setIsOpen] = useState(false); // mobile menu
  const [activeDropdown, setActiveDropdown] = useState(null); // dropdowns
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const activePath = pathname;
  const activeQuery = search;

  /** Fetch Divisions */
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoadingDivisions(true);

        const res = await api.get("/services"); // no localhost
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

  /** Close dropdown on outside click */
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /** Navigation helper */
  const goTo = (path) => {
    setIsOpen(false);
    setActiveDropdown(null);
    navigate(path);
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

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => goTo("/")}
          >
            <img src={logo} alt="N.C.R.H Logo" className="w-14 h-14" />
            <h1 className="text-2xl font-bold">N.C.R.H</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2" ref={dropdownRef}>
            {navLinks.map((link) =>
              !link.dropdown ? (
                <button
                  key={link.name}
                  onClick={() => goTo(link.path)}
                  className={`px-3 py-2 text-lg font-semibold rounded-lg ${
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
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === link.dropdown ? null : link.dropdown
                      )
                    }
                    className="flex items-center gap-1 px-3 py-2 text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {link.name}
                    <MdOutlineArrowDropDown
                      className={`transition-transform ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === link.dropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
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
                              className={`w-full text-left px-4 py-3 hover:bg-blue-100 ${
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
                        link.items.map((it) => (
                          <button
                            key={it.path}
                            onClick={() => goTo(it.path)}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-100 ${
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

            {/* Donations */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "donations" ? null : "donations"
                  )
                }
                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Donations
                <MdOutlineArrowDropDown
                  className={`transition-transform ${
                    activeDropdown === "donations" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeDropdown === "donations" && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
                  {donationItems.map((d) => (
                    <button
                      key={d.path}
                      onClick={() => goTo(d.path)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-100 ${
                        activePath === d.path ? "bg-blue-100 font-semibold" : ""
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login */}
            <button
              onClick={() => goTo("/hmis")}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <MdPerson className="text-xl" /> Log In
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-3xl p-2"
          >
            {isOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed top-[116px] left-0 w-3/4 h-[calc(100vh-116px)]
     bg-blue-500 z-[9999] overflow-y-auto p-4 space-y-3 text-white"
          >
            {navLinks.map((link) => (
              <div key={link.name}>
                {!link.dropdown ? (
                  <button
                    onClick={() => goTo(link.path)}
                    className={`w-full text-left px-3 py-3 rounded-lg text-lg font-semibold ${
                      activePath === link.path
                        ? "bg-blue-600"
                        : "hover:bg-blue-600"
                    }`}
                  >
                    {link.name}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === link.dropdown
                            ? null
                            : link.dropdown
                        )
                      }
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
                      <div className="ml-4 mt-2 space-y-2">
                        {link.dropdown === "departments"
                          ? divisions.map((d) => (
                              <button
                                key={d}
                                onClick={() =>
                                  goTo(
                                    `/services?division=${encodeURIComponent(
                                      d
                                    )}`
                                  )
                                }
                                className={`w-full text-left px-3 py-2 rounded-lg ${
                                  activeQuery.includes(encodeURIComponent(d))
                                    ? "bg-blue-600 font-semibold"
                                    : "hover:bg-blue-600"
                                }`}
                              >
                                {d}
                              </button>
                            ))
                          : link.items.map((it) => (
                              <button
                                key={it.path}
                                onClick={() => goTo(it.path)}
                                className={`w-full text-left px-3 py-2 rounded-lg ${
                                  activePath === it.path
                                    ? "bg-blue-600 font-semibold"
                                    : "hover:bg-blue-600"
                                }`}
                              >
                                {it.name}
                              </button>
                            ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Mobile Donations */}
            <div>
              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "donations" ? null : "donations"
                  )
                }
                className="w-full flex justify-between items-center px-3 py-3 rounded-lg text-lg font-semibold bg-green-500 hover:bg-green-600"
              >
                Donations
                <MdOutlineArrowDropDown
                  className={`transition-transform ${
                    activeDropdown === "donations" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeDropdown === "donations" && (
                <div className="ml-4 mt-2 space-y-2">
                  {donationItems.map((d) => (
                    <button
                      key={d.path}
                      onClick={() => goTo(d.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
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

            {/* Mobile Login */}
            <button
              onClick={() => goTo("/hmis")}
              className="w-full text-center mt-4 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <MdPerson className="text-xl" /> Log In
            </button>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

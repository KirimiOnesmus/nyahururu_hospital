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

  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navigate = useNavigate();
  const { pathname, search } = useLocation();

 
  useEffect(() => {
    setActiveDropdown(null);
    setIsOpen(false);
  }, [pathname, search]);

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
      if (navRef.current && !navRef.current.contains(e.target)) {
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

    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);


  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const goTo = (path) => {
    setIsOpen(false);
    setActiveDropdown(null);
    navigate(path);
  };

  const toggleDropdown = (name) =>
    setActiveDropdown((prev) => (prev === name ? null : name));

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Our Departments", dropdown: "departments", items: divisions },
    { name: "Our Specialists", path: "/doctors" },
    {
      name: "Contact Us",
      dropdown: "contact",
      items: [
        { name: "Patient Feedback", path: "/feedback" },
        { name: "Report Fraud", path: "/report-fraud" },
        // { name: "Ask Doctor", path: "/ask-doctor" },
        { name: "Book Appointment", path: "/appointment" },
        // { name: "Virtual Tour", path: "/virtual-tour" },
      ],
    },
  ];

  const donationItems = [
    { name: "Blood Donation", path: "/blood-donation" },
    { name: "Financial Aid", path: "/financial-aid" },
  ];


  const DropdownPanel = ({ children, align = "left" }) => (
    <div
      className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-1
                  w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50`}
    >
      {children}
    </div>
  );

  const DropdownItem = ({ label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150
                  ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"}`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-white border-b border-slate-200">
  
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 py-1.5">
            <a
              href="tel:+254712345678"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <MdPhone className="text-base" /> +254 712 345 678
            </a>
            <button
              onClick={() => goTo("/ambulance-services")}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <MdLocalHospital className="text-base text-red-500" /> Ambulance Services
            </button>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-3">
    
          <button
            onClick={() => goTo("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="N.C.R.H Logo" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <p className="text-lg font-bold text-slate-800 leading-tight">N.C.R.H</p>
              <p className="text-sm text-slate-500 leading-tight hidden sm:block">
                Nyahururu County Referral Hospital
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" ref={navRef}>
            {navLinks.map((link) =>
              !link.dropdown ? (
                <button
                  key={link.name}
                  onClick={() => goTo(link.path)}
                  className={`px-3 py-2 text-md font-semibold rounded-lg transition-colors duration-150 cursor-pointer border-none ${
                    pathname === link.path
                      ? "text-blue-600 underline underline-offset-4"
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <div key={link.name} className="relative">
                  <button
                    onClick={() => toggleDropdown(link.dropdown)}
                    className={`flex items-center gap-0.5 px-3 py-2 text-md font-semibold rounded-lg transition-colors duration-150 cursor-pointer ${
                      activeDropdown === link.dropdown
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                    }`}
                  >
                    {link.name}
                    <MdOutlineArrowDropDown
                      className={`text-lg transition-transform duration-200 ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === link.dropdown && (
                    <DropdownPanel>
                      {link.dropdown === "departments" ? (
                        loadingDivisions ? (
                          <div className="px-4 py-3 text-sm text-slate-400">Loading…</div>
                        ) : divisions.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400">No departments</div>
                        ) : (
                          divisions.map((d) => (
                            <DropdownItem
                              key={d}
                              label={d}
                              onClick={() => goTo(`/services?division=${encodeURIComponent(d)}`)}
                              active={search.includes(encodeURIComponent(d))}
                            />
                          ))
                        )
                      ) : (
                        link.items?.map((it) => (
                          <DropdownItem
                            key={it.path}
                            label={it.name}
                            onClick={() => goTo(it.path)}
                            active={pathname === it.path}
                          />
                        ))
                      )}
                    </DropdownPanel>
                  )}
                </div>
              )
            )}

            <div className="relative">
              <button
                onClick={() => toggleDropdown("donations")}
                className="flex items-center gap-0.5 px-3 py-2 text-sm font-semibold rounded-lg
                           border border-emerald-600 text-emerald-700 hover:bg-emerald-50
                           transition-colors duration-150 cursor-pointer"
              >
                Donations
                <MdOutlineArrowDropDown
                  className={`text-lg transition-transform duration-200 ${
                    activeDropdown === "donations" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeDropdown === "donations" && (
                <DropdownPanel align="right">
                  {donationItems.map((d) => (
                    <DropdownItem
                      key={d.path}
                      label={d.name}
                      onClick={() => goTo(d.path)}
                      active={pathname === d.path}
                    />
                  ))}
                </DropdownPanel>
              )}
            </div>

          
            <button
              onClick={() => goTo("/hmis")}
              className="flex items-center gap-1.5 px-4 py-2 ml-1 rounded-lg bg-blue-600
                         hover:bg-blue-700 text-white text-sm font-semibold transition-colors duration-150 cursor-pointer"
            >
              <MdPerson className="text-base" /> Log In
            </button>
          </nav>

          <button
            onClick={() => setIsOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <>

          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsOpen(false)} />

          <div
            ref={mobileMenuRef}
            className="fixed top-0 left-0 w-72 h-full bg-white z-50 overflow-y-auto
                       shadow-xl flex flex-col lg:hidden"
          >
      
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src={logo} alt="N.C.R.H" className="w-9 h-9 object-contain" />
                <span className="font-bold text-slate-800">N.C.R.H</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {!link.dropdown ? (
                    <button
                      onClick={() => goTo(link.path)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                        pathname === link.path
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                      }`}
                    >
                      {link.name}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(link.dropdown); }}
                        className="w-full flex justify-between items-center px-3 py-2.5 rounded-lg
                                   text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {link.name}
                        <MdOutlineArrowDropDown
                          className={`text-lg transition-transform duration-200 ${
                            activeDropdown === link.dropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {activeDropdown === link.dropdown && (
                        <div className="ml-3 mt-1 border-l-2 border-blue-100 pl-3 space-y-0.5">
                          {link.dropdown === "departments" ? (
                            loadingDivisions ? (
                              <p className="py-2 text-xs text-slate-400">Loading…</p>
                            ) : divisions.length === 0 ? (
                              <p className="py-2 text-xs text-slate-400">No departments</p>
                            ) : (
                              divisions.map((d) => (
                                <button
                                  key={d}
                                  onClick={() => goTo(`/services?division=${encodeURIComponent(d)}`)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                    search.includes(encodeURIComponent(d))
                                      ? "bg-blue-50 text-blue-700 font-semibold"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
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
                                onClick={(e) => { e.stopPropagation(); goTo(it.path); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                  pathname === it.path
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                                }`}
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

    
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDropdown("donations"); }}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-lg
                             text-sm font-semibold text-emerald-700 border border-emerald-200
                             hover:bg-emerald-50 transition-colors cursor-pointer cursor-pointer"
                >
                  Donations
                  <MdOutlineArrowDropDown
                    className={`text-lg transition-transform duration-200 ${
                      activeDropdown === "donations" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeDropdown === "donations" && (
                  <div className="ml-3 mt-1 border-l-2 border-emerald-100 pl-3 space-y-0.5">
                    {donationItems.map((d) => (
                      <button
                        key={d.path}
                        onClick={(e) => { e.stopPropagation(); goTo(d.path); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          pathname === d.path
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

         
            <div className="px-4 py-4 border-t border-slate-100">
              <button
                onClick={() => goTo("/hmis")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <MdPerson className="text-base" /> Log In
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
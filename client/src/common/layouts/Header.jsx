import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconMenu, IconClose, IconChevronDown, IconPhone, IconAmbulance, IconUser } from "../icons";
import ThemeToggle from "../components/ThemeToggle";
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
        const unique = [...new Set(res.data.map((s) => s.division).filter(Boolean))].sort();
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
      if (mobileMenuRef.current && mobileMenuRef.current.contains(e.target)) return;
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goTo = (path) => {
    setIsOpen(false);
    setActiveDropdown(null);
    navigate(path);
  };

  const toggleDropdown = (name) => setActiveDropdown((prev) => (prev === name ? null : name));

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Our Departments", dropdown: "departments", items: divisions },
    { name: "Our Specialists", path: "/doctors" },
    {
      name: "Contact Us",
      dropdown: "contact",
      items: [
        { name: "Find Us", path: "/contact" },
        { name: "Patient Feedback", path: "/feedback" },
        { name: "Report Fraud", path: "/report-fraud" },
        { name: "Book Appointment", path: "/appointment" },
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
                  w-56 bg-surface border border-line rounded-xl shadow-md overflow-hidden z-50`}
    >
      {children}
    </div>
  );

  const DropdownItem = ({ label, onClick, active }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left min-h-11 px-4 py-2.5 text-sm font-medium transition-colors
                  ${active ? "bg-primary-soft text-primary font-semibold" : "text-ink hover:bg-canvas hover:text-primary"}`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-surface border-b border-line">
      <div className="border-b border-line bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-1.5">
            <div className="flex items-center justify-center gap-6 flex-1">
              <a
                href="tel:+254758722031"
                className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                <IconPhone className="w-4 h-4" aria-hidden="true" />
                +254 758 722 031
              </a>
              <button
                type="button"
                onClick={() => goTo("/ambulance-services")}
                className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-ink-muted hover:text-primary"
              >
                <IconAmbulance className="w-4 h-4 text-danger" aria-hidden="true" />
                Ambulance Services
              </button>
            </div>
            <ThemeToggle compact />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => goTo("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity min-h-11"
          >
            <img src={logo} alt="Nyahururu County Referral Hospital logo" className="brand-logo w-12 h-12" />
            <div className="text-left">
              <p className="text-lg font-bold text-ink leading-tight">N.C.R.H</p>
              <p className="text-sm text-ink-muted leading-tight hidden sm:block">
                Nyahururu County Referral Hospital
              </p>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1" ref={navRef}>
            {navLinks.map((link) =>
              !link.dropdown ? (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => goTo(link.path)}
                  className={`min-h-11 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                    pathname === link.path
                      ? "text-primary"
                      : "text-ink hover:text-primary hover:bg-canvas"
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <div key={link.name} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(link.dropdown)}
                    aria-expanded={activeDropdown === link.dropdown}
                    className={`flex items-center gap-0.5 min-h-11 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                      activeDropdown === link.dropdown
                        ? "text-primary bg-primary-soft"
                        : "text-ink hover:text-primary hover:bg-canvas"
                    }`}
                  >
                    {link.name}
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeDropdown === link.dropdown ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {activeDropdown === link.dropdown && (
                    <DropdownPanel>
                      {link.dropdown === "departments" ? (
                        loadingDivisions ? (
                          <div className="px-4 py-3 text-sm text-ink-muted">Loading departments…</div>
                        ) : divisions.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-ink-muted">No departments listed</div>
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
                type="button"
                onClick={() => toggleDropdown("donations")}
                aria-expanded={activeDropdown === "donations"}
                className="flex items-center gap-0.5 min-h-11 px-3 py-2 text-sm font-semibold rounded-xl
                           border border-accent text-accent hover:bg-accent-soft transition-colors"
              >
                Donations
                <IconChevronDown
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === "donations" ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
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
              type="button"
              onClick={() => goTo("/hmis")}
              className="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 ml-1 rounded-xl bg-primary
                         hover:bg-primary-hover text-white text-sm font-semibold transition-colors"
            >
              <IconUser className="w-4 h-4" aria-hidden="true" /> Log In
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="lg:hidden min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-ink hover:bg-canvas"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <IconMenu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />

          <div
            ref={mobileMenuRef}
            className="fixed top-0 left-0 w-72 h-full bg-surface z-50 overflow-y-auto
                       shadow-md flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2">
                <img src={logo} alt="" className="brand-logo w-9 h-9" />
                <span className="font-bold text-ink">N.C.R.H</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-ink-muted hover:bg-canvas"
                aria-label="Close menu"
              >
                <IconClose className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {!link.dropdown ? (
                    <button
                      type="button"
                      onClick={() => goTo(link.path)}
                      className={`w-full text-left min-h-11 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        pathname === link.path
                          ? "bg-primary-soft text-primary"
                          : "text-ink hover:bg-canvas hover:text-primary"
                      }`}
                    >
                      {link.name}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(link.dropdown);
                        }}
                        aria-expanded={activeDropdown === link.dropdown}
                        className="w-full flex justify-between items-center min-h-11 px-3 py-2.5 rounded-xl
                                   text-sm font-semibold text-ink hover:bg-canvas hover:text-primary"
                      >
                        {link.name}
                        <IconChevronDown
                          className={`w-4 h-4 transition-transform ${
                            activeDropdown === link.dropdown ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {activeDropdown === link.dropdown && (
                        <div className="ml-3 mt-1 border-l-2 border-primary-soft pl-3 space-y-0.5">
                          {link.dropdown === "departments" ? (
                            loadingDivisions ? (
                              <p className="py-2 text-xs text-ink-muted">Loading departments…</p>
                            ) : divisions.length === 0 ? (
                              <p className="py-2 text-xs text-ink-muted">No departments listed</p>
                            ) : (
                              divisions.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => goTo(`/services?division=${encodeURIComponent(d)}`)}
                                  className={`w-full text-left min-h-11 px-3 py-2 rounded-xl text-sm ${
                                    search.includes(encodeURIComponent(d))
                                      ? "bg-primary-soft text-primary font-semibold"
                                      : "text-ink-muted hover:bg-canvas hover:text-primary"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goTo(it.path);
                                }}
                                className={`w-full text-left min-h-11 px-3 py-2 rounded-xl text-sm ${
                                  pathname === it.path
                                    ? "bg-primary-soft text-primary font-semibold"
                                    : "text-ink-muted hover:bg-canvas hover:text-primary"
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown("donations");
                  }}
                  aria-expanded={activeDropdown === "donations"}
                  className="w-full flex justify-between items-center min-h-11 px-3 py-2.5 rounded-xl
                             text-sm font-semibold text-accent border border-accent hover:bg-accent-soft"
                >
                  Donations
                  <IconChevronDown
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === "donations" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {activeDropdown === "donations" && (
                  <div className="ml-3 mt-1 border-l-2 border-accent-soft pl-3 space-y-0.5">
                    {donationItems.map((d) => (
                      <button
                        key={d.path}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goTo(d.path);
                        }}
                        className={`w-full text-left min-h-11 px-3 py-2 rounded-xl text-sm ${
                          pathname === d.path
                            ? "bg-accent-soft text-accent font-semibold"
                            : "text-ink-muted hover:bg-canvas hover:text-accent"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="px-4 py-4 border-t border-line space-y-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => goTo("/hmis")}
                className="w-full flex items-center justify-center gap-2 min-h-11 rounded-xl
                           bg-primary hover:bg-primary-hover text-white text-sm font-semibold"
              >
                <IconUser className="w-4 h-4" aria-hidden="true" /> Log In
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

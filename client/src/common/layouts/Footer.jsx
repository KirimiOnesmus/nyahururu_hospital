import React from "react";
import logo from "../../assets/logo.png";
import { IconMail, IconMapPin, IconPhone } from "../icons";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Give us your Feedback", path: "/feedback" },
    { label: "Report Fraud", path: "/report-fraud" },
    { label: "Careers", path: "/careers" },
    { label: "Downloads", path: "/downloads" },
    { label: "Research", path: "/research" },
    { label: "Gallery", path: "/gallery" },
  ];

  const contactInfo = [
    { Icon: IconPhone, label: "0758 722 031" },
    { Icon: IconMail, label: "nyahururuhospital@gmail.com" },
    { Icon: IconMapPin, label: "Nyeri-Nyahururu Road" },
  ];

  const socialLinks = [
    { label: "Facebook", url: "#" },
    { label: "X (Twitter)", url: "#" },
    { label: "Instagram", url: "#" },
  ];

  const externalLinks = [
    { label: "Ministry of Health", path: "https://www.health.go.ke/" },
    { label: "Laikipia County Government", path: "https://laikipia.go.ke/" },
    { label: "Social Health Authority", path: "https://sha.go.ke/" },
    { label: "Kenya Medical Training College", path: "https://kmtc.ac.ke/" },
    { label: "Laikipia University", path: "https://www.laikipia.ac.ke/" },
  ];

  return (
    <footer className="bg-surface border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 py-12">
          <div className="flex flex-col items-start gap-3">
            <img src={logo} alt="Nyahururu County Referral Hospital logo" className="h-16" />
            <p className="text-sm text-ink-muted leading-relaxed">
              Providing quality healthcare services to our community.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  className="min-h-11 px-3 inline-flex items-center rounded-xl bg-canvas border border-line
                  text-sm text-ink-muted hover:text-primary hover:border-primary transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">
              Get in Touch
            </p>
            <ul className="space-y-3">
              {contactInfo.map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-ink-muted leading-relaxed">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">
              Quick Links
            </p>
            <ul className="space-y-1">
              {quickLinks.map(({ label, path }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => navigate(path)}
                    className="min-h-11 text-sm text-ink-muted hover:text-primary font-medium text-left"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">
              External Links
            </p>
            <ul className="space-y-1">
              {externalLinks.map(({ label, path }) => (
                <li key={label}>
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-11 text-sm text-ink-muted hover:text-primary font-medium"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-line py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-ink-muted">
            &copy; {currentYear} Nyahururu County Referral Hospital. All rights reserved.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => navigate("/privacy-policy")}
              className="min-h-11 text-xs text-ink-muted hover:text-primary"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate("/terms-of-service")}
              className="min-h-11 text-xs text-ink-muted hover:text-primary"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

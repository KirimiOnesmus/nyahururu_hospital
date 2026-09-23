import React from "react";
import { Header, Footer } from "../common/layouts";
import { Contact as ContactSection } from "../components/layouts";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line">
        <Header />
      </div>
      <main className="flex-1">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

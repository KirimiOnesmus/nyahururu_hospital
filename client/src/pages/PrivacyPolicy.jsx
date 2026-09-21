import React from "react";
import { Header, Footer } from "../common/layouts";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              Privacy Policy
            </h1>

            <p className="text-sm text-slate-500 mb-10">
              Last updated: August 2026
            </p>

            <div className="space-y-8 text-sm text-slate-600 leading-7">

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  1. Introduction
                </h2>

                <p>
                  Nyahururu Hospital ("the Hospital", "we", "us" or "our")
                  respects your privacy and is committed to protecting your
                  personal data.
                </p>

                <p className="mt-3">
                  This Privacy Policy explains how we collect, use, store,
                  disclose and protect personal data when you use this website,
                  interact with our online services, communicate with us, or
                  otherwise provide information to the Hospital.
                </p>

                <p className="mt-3">
                  This Policy is intended to operate in accordance with the
                  Constitution of Kenya, the Data Protection Act, 2019, and
                  other applicable Kenyan laws and regulations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  2. Data Controller
                </h2>

                <p>
                  The organisation responsible for determining the purposes
                  and means of processing personal data through this website
                  and related services is:
                </p>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p><strong>Organisation:</strong> Nyahururu Hospital</p>
                  <p><strong>Location:</strong> Nyeri-Nyahururu Road, Kenya</p>
                  <p>
                    <strong>Telephone:</strong> 0758 722 031
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    nyahururuhospital@gmail.com
                  </p>
                </div>

                <p className="mt-4">
                  Where another organisation processes personal data on our
                  behalf, that organisation may act as a data processor subject
                  to applicable data protection requirements and contractual
                  safeguards.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  3. Personal Data We May Collect
                </h2>

                <p>
                  Depending on how you interact with the Hospital, we may
                  collect information including:
                </p>

                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Name and contact information.</li>
                  <li>Telephone number and email address.</li>
                  <li>Information submitted through feedback forms.</li>
                  <li>Information submitted through employment applications.</li>
                  <li>Information submitted through reports or complaints.</li>
                  <li>Information required to respond to enquiries.</li>
                  <li>Technical information relating to website usage.</li>
                  <li>Authentication and account information where applicable.</li>
                  <li>Other information that you voluntarily provide.</li>
                </ul>

                <p className="mt-4">
                  Where healthcare services are provided, additional personal
                  information may be processed as part of the provision and
                  administration of healthcare services. Health information is
                  treated as sensitive personal data and receives additional
                  protection under Kenyan law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  4. Health Information
                </h2>

                <p>
                  Health information may include information concerning your
                  physical or mental health, healthcare services provided to
                  you, medical history, diagnoses, treatment and related
                  healthcare information.
                </p>

                <p className="mt-3">
                  The Hospital will process health information only where
                  permitted by applicable law and for legitimate healthcare,
                  administrative, legal, public-interest or other authorised
                  purposes.
                </p>

                <p className="mt-3">
                  Access to health information is restricted to persons who
                  require access for authorised purposes and appropriate
                  confidentiality and security measures are applied.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  5. How We Use Personal Data
                </h2>

                <p>We may process personal data for purposes including:</p>

                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Providing and administering healthcare services.</li>
                  <li>Responding to enquiries and requests.</li>
                  <li>Managing feedback, complaints and reports.</li>
                  <li>Processing applications and recruitment activities.</li>
                  <li>Providing information about Hospital services.</li>
                  <li>Managing user accounts where applicable.</li>
                  <li>Maintaining website and system security.</li>
                  <li>Complying with legal and regulatory obligations.</li>
                  <li>Protecting patients, staff and other individuals.</li>
                  <li>Improving our services and systems.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  6. Lawful Basis for Processing
                </h2>

                <p>
                  Depending on the circumstances, personal data may be processed
                  where processing is based on consent or where it is necessary
                  for purposes recognised by applicable law, including
                  performance of a contract, compliance with a legal obligation,
                  protection of vital interests, public-interest functions,
                  public-authority functions or other lawful grounds.
                </p>

                <p className="mt-3">
                  Where consent is relied upon, consent will be obtained in a
                  manner that is clear, specific, informed and voluntary, and
                  may be withdrawn where permitted by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  7. Data Sharing
                </h2>

                <p>
                  We may disclose personal data where necessary and lawful to
                  provide services, comply with legal obligations, protect vital
                  interests, protect the rights of individuals, or perform
                  authorised public-interest functions.
                </p>

                <p className="mt-3">
                  Depending on the circumstances, information may be shared with
                  authorised healthcare professionals, service providers,
                  government authorities, regulators, insurers, payment
                  providers, professional advisers or other authorised parties.
                </p>

                <p className="mt-3">
                  We will not sell your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  8. International Data Transfers
                </h2>

                <p>
                  Some service providers may process information outside Kenya.
                  Where personal data is transferred outside Kenya, the Hospital
                  will apply safeguards and lawful transfer mechanisms required
                  by applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  9. Data Security
                </h2>

                <p>
                  We implement appropriate technical and organisational measures
                  intended to protect personal data against unauthorised access,
                  disclosure, alteration, loss, destruction and other unlawful
                  processing.
                </p>

                <p className="mt-3">
                  Such measures may include access controls, authentication,
                  secure communications, backups, monitoring, confidentiality
                  obligations and other safeguards appropriate to the nature and
                  risks of the information processed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  10. Data Retention
                </h2>

                <p>
                  We retain personal data only for as long as reasonably
                  necessary for the purposes for which it was collected or as
                  required or permitted by law.
                </p>

                <p className="mt-3">
                  When personal data is no longer required and there is no lawful
                  reason to retain it, it may be securely deleted, anonymised or
                  otherwise disposed of in accordance with applicable
                  requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  11. Your Data Protection Rights
                </h2>

                <p>
                  Subject to applicable legal limitations, you may have rights
                  including:
                </p>

                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>The right to be informed about the use of your data.</li>
                  <li>The right to access your personal data.</li>
                  <li>The right to object to certain processing.</li>
                  <li>The right to request correction of inaccurate data.</li>
                  <li>The right to request deletion where legally applicable.</li>
                  <li>The right to request restriction of processing where applicable.</li>
                  <li>The right to data portability where applicable.</li>
                  <li>The right to withdraw consent where consent is the basis of processing.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  12. Cookies and Technical Information
                </h2>

                <p>
                  The website may use cookies or similar technologies where
                  necessary to provide functionality, security, analytics or
                  improve the user experience.
                </p>

                <p className="mt-3">
                  Where consent is required for a particular cookie or
                  technology, the appropriate consent mechanism will be provided.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  13. Children's Data
                </h2>

                <p>
                  Where personal data relating to a child is processed, the
                  Hospital will apply appropriate safeguards and comply with
                  applicable requirements concerning parental or guardian
                  consent and the best interests of the child.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  14. Data Breaches
                </h2>

                <p>
                  We maintain procedures for identifying, assessing and
                  responding to personal data security incidents. Where
                  notification is required by applicable law, we will make the
                  required notifications within the applicable periods.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  15. Changes to this Privacy Policy
                </h2>

                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our services, systems, legal requirements or data
                  processing practices. The updated version will be published on
                  this page with an updated revision date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">
                  16. Contact Us
                </h2>

                <p>
                  If you have questions about this Privacy Policy or wish to
                  exercise a data protection right, please contact the Hospital
                  using the following details:
                </p>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p>
                    <strong>Nyahururu Hospital</strong>
                  </p>
                  <p>Nyeri-Nyahururu Road, Kenya</p>
                  <p>Telephone: 0758 722 031</p>
                  <p>Email: nyahururuhospital@gmail.com</p>
          
                </div>

                <p className="mt-4">
                  You may also have the right to lodge a complaint with the
                  Office of the Data Protection Commissioner where you believe
                  your data protection rights have been infringed.
                </p>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
import React from "react";
import { Header, Footer } from "../components/layouts";

const ReportFraud = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="body">
        {" "}
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="px-6 md:px-12 py-8 space-y-10 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
            Whistleblower Services/ Report Fraud
          </h2>
          <p>
            We work continuously to promote high ethical standards and combat
            corruption, and other serious irregularities. We are cognizant of
            the inherent risks a whistle-blower may face, which may include
            victimization e.g. in the case of company employees or threat to
            life in extreme cases. To protect the whistle-blower from such
            risks, we have provided a reporting channel in which individuals
            anonymously report suspected irregularities. If you wish to report
            serious irregularities anonymously use the form below :
          </p>
          <div className="form max-w-2xl mx-auto w-full">
            <h3 className="text-xl font-bold mb-4 text-center">
              Describe your issue
            </h3>
            <form action="" className="space-y-4">
              <div>
                <label className="block mb-1">What is your concern?</label>
                <input
                  type="text"
                  name="issue"
                  id=""
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>
              <div>
                <label className="block mb-1">When did this happen ?</label>
                <input
                  type="text"
                  name="issue"
                  id=""
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>

              <div>
                <label className="block mb-1">Where did it happen ?</label>
                <input
                  type="text"
                  name="issue"
                  id=""
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                />
              </div>

              <div>
                <label className="block mb-1">Details of the Case:</label>
                <textarea
                  name=""
                  id=""
                  cols={10}
                  rows={10}
                  className="border border-gray-400 p-2 w-full rounded-lg outline-none 
                           focus:border-blue-500
                           "
                  placeholder="Please describe what has happened and why you are submmit this report. If you wish to be anonymous make sure that you do not include information in the report that can reveal your identity."
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 hover:cursor-pointer"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ReportFraud;

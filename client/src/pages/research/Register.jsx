import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerResearcher } from "../../api/auth"; 

const INSTITUTIONS = [
  "Egerton University",
  "University of Nairobi",
  "Kenyatta University",
  "Mount Kenya University",
  "Laikipia University",
  "Technical University of Kenya",
  "Dedan Kimathi University of Technology",
  "Kenya Medical Training College",
  "Nyahururu County Referral Hospital",
  "Other",
];

const DISCIPLINES = [
  "Agriculture",
  "Economics",
  "Education",
  "Environment",
  "Health & Medicine",
  "Urban Planning",
  "Engineering",
  "Social Sciences",
  "Information Technology",
  "Other",
];


const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-gray-700 mb-1.5 font-semibold text-sm">
      {label}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const InputIcon = ({ children }) => (
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
    {children}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1); // 1 = personal, 2 = academic, 3 = security
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName:       "",
    lastName:        "",
    email:           "",
    phone:           "",
    institution:     "",
    otherInstitution:"",
    discipline:      "",
    otherDiscipline: "",
    qualification:   "",
    bio:             "",
    password:        "",
    confirmPassword: "",
    agreeTerms:      false,
  });

  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ── validation per step ── */
  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim())  e.firstName = "First name is required";
      if (!form.lastName.trim())   e.lastName  = "Last name is required";
      if (!form.email.trim())      e.email     = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
      if (!form.phone.trim())      e.phone     = "Phone number is required";
      else if (!/^(07|01|2547|2541)\d{8,}$/.test(form.phone.replace(/\s/g, "")))
        e.phone = "Enter a valid Kenyan phone number";
    }
    if (s === 2) {
      if (!form.institution)    e.institution  = "Select your institution";
      if (form.institution === "Other" && !form.otherInstitution.trim())
        e.otherInstitution = "Please specify your institution";
      if (!form.discipline)     e.discipline   = "Select your discipline";
      if (form.discipline === "Other" && !form.otherDiscipline.trim())
        e.otherDiscipline = "Please specify your discipline";
      if (!form.qualification)  e.qualification = "Select your qualification";
    }
    if (s === 3) {
      if (!form.password)          e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
      if (!form.confirmPassword)   e.confirmPassword = "Please confirm your password";
      else if (form.password !== form.confirmPassword)
        e.confirmPassword = "Passwords do not match";
      if (!form.agreeTerms) e.agreeTerms = "You must accept the terms to register";
    }
    return e;
  };

  const nextStep = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const prevStep = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e3 = validateStep(3);
    if (Object.keys(e3).length) { setErrors(e3); return; }

    setLoading(true);
    try {
    
      const payload = {
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        email:        form.email.trim(),
        phone:        form.phone.trim(),
        institution:  form.institution === "Other" ? form.otherInstitution : form.institution,
        discipline:   form.discipline  === "Other" ? form.otherDiscipline  : form.discipline,
        qualification: form.qualification,
        bio:          form.bio.trim(),
        password:     form.password,
      };

      const response = await registerResearcher(payload);

      toast.success("Account created! Redirecting to login...");

      setTimeout(() => {
        navigate("/hmis");
      }, 3000);

    } catch (err) {
      
      const errorMessage = err.response?.data?.message || err.message || "Registration failed. Try again.";
      
      if (err.response?.status === 409) {
        setErrors({ email: "Email already registered. Please log in instead." });
        toast.error("Email already registered");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ["Personal Info", "Academic Details", "Security"];

  const EyeIcon = ({ visible }) =>
    visible ? (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    );

  const inputBase =
    "w-full py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-800 placeholder-gray-400 text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 py-5">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

     
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Researcher Registration</h2>
            <p className="text-blue-100 text-sm">Join the Nyahururu Research Repository</p>
          </div>

          
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between relative">
             
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
                style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
              />

              {STEPS.map((label, i) => {
                const idx     = i + 1;
                const done    = step > idx;
                const current = step === idx;
                return (
                  <div key={label} className="flex flex-col items-center z-10 gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                      done    ? "bg-blue-600 border-blue-600 text-white"
                      : current ? "bg-white border-blue-600 text-blue-600"
                      :           "bg-white border-gray-300 text-gray-400"
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : idx}
                    </div>
                    <span className={`text-xs font-semibold ${current ? "text-blue-600" : done ? "text-blue-500" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

           
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" error={errors.firstName}>
                    <div className="relative">
                      <InputIcon>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </InputIcon>
                      <input
                        type="text" placeholder="First name" value={form.firstName}
                        onChange={set("firstName")} required
                        className={`${inputBase} pl-10 pr-4 ${errors.firstName ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                      />
                    </div>
                  </Field>

                  <Field label="Last Name" error={errors.lastName}>
                    <div className="relative">
                      <InputIcon>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </InputIcon>
                      <input
                        type="text" placeholder="Last name" value={form.lastName}
                        onChange={set("lastName")} required
                        className={`${inputBase} pl-10 pr-4 ${errors.lastName ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Email Address" error={errors.email}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                      </svg>
                    </InputIcon>
                    <input
                      type="email" placeholder="you@example.com" value={form.email}
                      onChange={set("email")} required
                      className={`${inputBase} pl-10 pr-4 ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                  </div>
                </Field>

                <Field label="Phone Number" error={errors.phone}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </InputIcon>
                    <input
                      type="tel" placeholder="0712 345 678" value={form.phone}
                      onChange={set("phone")} required
                      className={`${inputBase} pl-10 pr-4 ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                  </div>
                </Field>
              </>
            )}

         
            {step === 2 && (
              <>
                <Field label="Institution / Organization" error={errors.institution}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </InputIcon>
                    <select
                      value={form.institution} onChange={set("institution")} required
                      className={`${inputBase} pl-10 pr-4 appearance-none ${errors.institution ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select institution…</option>
                      {INSTITUTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </Field>

                {form.institution === "Other" && (
                  <Field label="Specify Institution" error={errors.otherInstitution}>
                    <input
                      type="text" placeholder="Enter your institution name"
                      value={form.otherInstitution} onChange={set("otherInstitution")}
                      className={`${inputBase} px-4 ${errors.otherInstitution ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                  </Field>
                )}

                <Field label="Research Discipline" error={errors.discipline}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </InputIcon>
                    <select
                      value={form.discipline} onChange={set("discipline")} required
                      className={`${inputBase} pl-10 pr-4 appearance-none ${errors.discipline ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select discipline…</option>
                      {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </Field>

                {form.discipline === "Other" && (
                  <Field label="Specify Discipline" error={errors.otherDiscipline}>
                    <input
                      type="text" placeholder="Enter your discipline"
                      value={form.otherDiscipline} onChange={set("otherDiscipline")}
                      className={`${inputBase} px-4 ${errors.otherDiscipline ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                  </Field>
                )}

                <Field label="Highest Qualification" error={errors.qualification}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                      </svg>
                    </InputIcon>
                    <select
                      value={form.qualification} onChange={set("qualification")} required
                      className={`${inputBase} pl-10 pr-4 appearance-none ${errors.qualification ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    >
                      <option value="">Select qualification…</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD / Doctorate">PhD / Doctorate</option>
                      <option value="Postdoctoral">Postdoctoral</option>
                    </select>
                  </div>
                </Field>

                <Field label="Short Bio (optional)">
                  <textarea
                    rows={3} placeholder="Brief description of your research interests and background…"
                    value={form.bio} onChange={set("bio")}
                    className={`${inputBase} px-4 resize-none border-gray-300`}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
             
                {form.password && (
                  <div className="mb-1">
                    {(() => {
                      const p = form.password;
                      const score =
                        (p.length >= 8 ? 1 : 0) +
                        (/[A-Z]/.test(p) ? 1 : 0) +
                        (/[0-9]/.test(p) ? 1 : 0) +
                        (/[^A-Za-z0-9]/.test(p) ? 1 : 0);
                      const labels = ["", "Weak", "Fair", "Good", "Strong"];
                      const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
                      const textColors = ["", "text-red-500", "text-yellow-600", "text-blue-600", "text-green-600"];
                      return (
                        <div>
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-semibold ${textColors[score]}`}>
                            {labels[score]} password
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </InputIcon>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters" value={form.password}
                      onChange={set("password")} required
                      className={`${inputBase} pl-10 pr-12 ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Use 8+ characters with uppercase, numbers, and symbols for a strong password.
                  </p>
                </Field>

                <Field label="Confirm Password" error={errors.confirmPassword}>
                  <div className="relative">
                    <InputIcon>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </InputIcon>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password" value={form.confirmPassword}
                      onChange={set("confirmPassword")} required
                      className={`${inputBase} pl-10 pr-12 ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400
                       hover:text-gray-600 cursor-pointer">
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </Field>

               
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox" checked={form.agreeTerms} onChange={set("agreeTerms")}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded
                       focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
                        Terms of Use
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
                        Privacy Policy
                      </a>
                      . I understand that a submission fee is required for research proposals.
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-red-500 text-xs mt-1.5 ml-7">{errors.agreeTerms}</p>
                  )}
                </div>

          
                {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Registration Summary
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Name:</span> {form.firstName} {form.lastName}</p>
                    <p><span className="font-medium text-gray-800">Email:</span> {form.email}</p>
                    <p><span className="font-medium text-gray-800">Institution:</span> {form.institution === "Other" ? form.otherInstitution : form.institution}</p>
                    <p><span className="font-medium text-gray-800">Discipline:</span> {form.discipline === "Other" ? form.otherDiscipline : form.discipline}</p>
                    <p><span className="font-medium text-gray-800">Qualification:</span> {form.qualification}</p>
                  </div>
                </div> */}
              </>
            )}


            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button" onClick={prevStep}
                  className="flex-1 border-2 border-blue-500 text-blue-500 py-3 rounded-lg font-semibold
                   hover:bg-blue-50 transition duration-200 cursor-pointer"
                >
                   Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button" onClick={nextStep}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700
                   transform hover:scale-[1.02] transition duration-200 shadow-lg cursor-pointer "
                >
                  Continue 
                </button>
              ) : (
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700
                   transform hover:scale-[1.02] transition duration-200 shadow-lg hover:shadow-md 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              )}
            </div>
          </form>

    
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/hmis")}
                className="text-blue-500 hover:text-blue-600 font-semibold cursor-pointer transition duration-200 
                hover:underline underline-offset-2"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Register;
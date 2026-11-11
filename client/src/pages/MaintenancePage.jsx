import { Link } from "react-router-dom";

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-20 text-center text-ink">
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">System maintenance</p>
        <h1 className="mt-3 text-3xl font-bold">We’ll be back shortly</h1>
        <p className="mt-4 text-ink-muted">The hospital system is temporarily unavailable while maintenance is in progress. Please try again later.</p>
        <Link className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white" to="/">Return to the website</Link>
      </div>
    </main>
  );
}

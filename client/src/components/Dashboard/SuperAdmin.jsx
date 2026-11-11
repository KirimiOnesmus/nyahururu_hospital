import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeartbeat, FaUsers, FaPowerOff, FaSyncAlt, FaTint } from "react-icons/fa";
import api from "../../api/axios";
import notify from "../../common/utils/notify";

export default function SuperAdmin() {
  const [health, setHealth] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [settingsAvailable, setSettingsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [healthResult, settingsResult] = await Promise.allSettled([
        api.get("/system/health"), api.get("/system/settings"),
      ]);
      if (healthResult.status === "fulfilled") setHealth(healthResult.value.data);
      if (settingsResult.status === "fulfilled") {
        setMaintenance(settingsResult.value.data.maintenanceMode);
        setSettingsAvailable(settingsResult.value.data.settingsAvailable !== false);
      }
      if (healthResult.status === "rejected" && settingsResult.status === "rejected") {
        notify.error("Unable to load system status");
      }
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load system status");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleMaintenance = async () => {
    setSaving(true);
    try {
      const result = await api.put("/system/settings/maintenance", { enabled: !maintenance });
      setMaintenance(result.data.maintenanceMode);
      notify.success(result.data.maintenanceMode ? "Maintenance mode enabled" : "System is back online");
      refresh();
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to update system mode");
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">System oversight</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Superadmin dashboard</h1>
          <p className="mt-2 text-ink-muted">Monitor system health, manage user accounts, and control maintenance availability.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="System overview">
          <article className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3"><FaHeartbeat className="text-primary" /><h2 className="font-semibold text-ink">System health</h2></div>
            <p className="mt-4 text-2xl font-bold text-ink">{loading ? "Checking…" : health?.status || "Unavailable"}</p>
            <p className="mt-1 text-sm text-ink-muted">API: {health?.api || "—"} · Database: {health?.database || "—"}</p>
            {health?.timestamp && <p className="mt-2 text-xs text-ink-muted">Checked {new Date(health.timestamp).toLocaleString()}</p>}
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary" onClick={refresh} disabled={loading}><FaSyncAlt /> Refresh status</button>
          </article>

          <article className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3"><FaPowerOff className="text-primary" /><h2 className="font-semibold text-ink">System availability</h2></div>
            <p className="mt-4 text-2xl font-bold text-ink">{maintenance ? "Maintenance mode" : "Online"}</p>
            <p className="mt-1 text-sm text-ink-muted">Maintenance mode pauses normal API access while preserving sign-in and system controls.</p>
            {!settingsAvailable && <p className="mt-2 text-sm font-medium text-amber-700">Run the database migrations to enable maintenance controls.</p>}
            <button className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={toggleMaintenance} disabled={saving || !settingsAvailable}>
              {saving ? "Updating…" : maintenance ? "Bring system online" : "Enable maintenance mode"}
            </button>
          </article>

          <article className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3"><FaUsers className="text-primary" /><h2 className="font-semibold text-ink">User accounts</h2></div>
            <p className="mt-4 text-sm text-ink-muted">Review staff accounts and add users. The protected superadmin account is excluded from editing and deletion.</p>
            <Link className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-white" to="/dashboard/users">Open user management</Link>
          </article>

          <article className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3"><FaTint className="text-primary" /><h2 className="font-semibold text-ink">Blood donation</h2></div>
            <p className="mt-4 text-sm text-ink-muted">Review donor contact, appointment, and consent records. Health screening and identity-document details are excluded.</p>
            <Link className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-white" to="/dashboard/donations">Open read-only donor overview</Link>
          </article>
        </section>

        <p className="text-xs text-ink-muted">Module pages are available for monitoring. Changes to operational records are disabled for the superadmin account.</p>
      </div>
    </main>
  );
}

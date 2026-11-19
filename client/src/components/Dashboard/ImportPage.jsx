import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaDownload, FaFileCsv, FaHistory, FaRedo, FaUpload } from "react-icons/fa";
import {
  commitImport, discardImport, downloadImportErrors, downloadImportTemplate,
  getImportBatch, getImportEntities, getImportHistory, rollbackImport, validateImport,
} from "../../api/imports";

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50";
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ImportPage() {
  const [entities, setEntities] = useState([]);
  const [entity, setEntity] = useState("");
  const [mode, setMode] = useState("upsert");
  const [file, setFile] = useState(null);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedEntity = useMemo(() => entities.find((item) => item.key === entity), [entities, entity]);
  const refreshHistory = useCallback(async () => {
    const { data } = await getImportHistory({ page: 1, limit: 20 });
    setHistory(data.data || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getImportEntities(), getImportHistory({ page: 1, limit: 20 })]).then(([entityResponse, historyResponse]) => {
      if (!active) return;
      const available = entityResponse.data.data || [];
      setEntities(available); setEntity(available[0]?.key || "");
      setHistory(historyResponse.data.data || []);
    }).catch((err) => { if (active) setError(err.response?.data?.error?.message || "Could not load import tools."); });
    return () => { active = false; };
  }, []);

  const onTemplate = async () => {
    setError("");
    try { const response = await downloadImportTemplate(entity); saveBlob(response.data, `${entity}-template.csv`); }
    catch { setError("Could not download the CSV template."); }
  };

  const onValidate = async (event) => {
    event.preventDefault();
    if (!file || !entity) return;
    setLoading(true); setError(""); setBatch(null);
    try {
      const response = await validateImport(entity, file, mode);
      setBatch(response.data.data);
      await refreshHistory();
    } catch (err) {
      const data = err.response?.data?.data;
      if (data?.batchId) setBatch(data);
      setError(err.response?.data?.error?.message || err.response?.data?.error?.code || "CSV validation failed.");
      await refreshHistory().catch(() => {});
    } finally { setLoading(false); }
  };

  const selectBatch = async (id) => {
    setError(""); setLoading(true);
    try { const response = await getImportBatch(id); setBatch(response.data.data); }
    catch (err) { setError(err.response?.data?.error?.message || "Could not load the import batch."); }
    finally { setLoading(false); }
  };

  const onCommit = async () => {
    if (!batch?.batchId && !batch?.id) return;
    const id = batch.batchId || batch.id;
    if (!window.confirm(`Commit ${batch.summary?.rows ?? batch.rowCount} service rows?`)) return;
    setLoading(true); setError("");
    try {
      await commitImport(id);
      await selectBatch(id); await refreshHistory();
    } catch (err) { setError(err.response?.data?.error?.message || "Could not commit the import."); }
    finally { setLoading(false); }
  };

  const onRollback = async () => {
    const id = batch?.batchId || batch?.id;
    if (!id || !window.confirm("Roll back this import? This restores the previous service data.")) return;
    setLoading(true); setError("");
    try { await rollbackImport(id); await selectBatch(id); await refreshHistory(); }
    catch (err) { setError(err.response?.data?.error?.message || "Could not roll back the import."); }
    finally { setLoading(false); }
  };

  const onDiscard = async () => {
    const id = batch?.batchId || batch?.id;
    if (!id || !window.confirm("Discard this validated import batch?")) return;
    setLoading(true); setError("");
    try { await discardImport(id); await selectBatch(id); await refreshHistory(); }
    catch (err) { setError(err.response?.data?.error?.message || "Could not discard the import."); }
    finally { setLoading(false); }
  };

  const onErrors = async () => {
    const id = batch?.batchId || batch?.id;
    if (!id) return;
    try { const response = await downloadImportErrors(id); saveBlob(response.data, `import-${id}-errors.csv`); }
    catch { setError("Could not download the error report."); }
  };

  const batchId = batch?.batchId || batch?.id;
  const summary = batch?.summary || batch;
  const canCommit = batch?.status === "validated" && !(summary?.errors > 0);

  return <main className="min-h-screen bg-canvas px-4 py-8 text-ink sm:px-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Superadmin tools</p>
        <h1 className="mt-1 text-3xl font-bold">Bulk data import</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">Validate a CSV preview before changing published service and department information. Imports are audited and can be rolled back if the data has not changed since commit.</p>
      </header>

      {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {!entities.length && <div className="rounded-xl bg-surface p-6 text-sm text-ink-muted">No import entities are enabled for this deployment.</div>}

      {selectedEntity && <section className="rounded-xl bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-bold">Import {selectedEntity.label}</h2><p className="mt-1 text-sm text-ink-muted">Tier {selectedEntity.tier} · Up to {selectedEntity.maxRows} rows · CSV only</p></div>
          <button type="button" className={secondaryClass} onClick={onTemplate}><FaDownload /> Download template</button>
        </div>
        <form onSubmit={onValidate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Entity
            <select className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-surface px-3" value={entity} onChange={(e) => setEntity(e.target.value)}>
              {entities.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Update mode
            <select className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-surface px-3" value={mode} onChange={(e) => setMode(e.target.value)}>
              {selectedEntity.modes.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2 text-sm font-semibold">CSV file
            <input className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-surface p-2 text-sm" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="sm:col-span-2"><button className={buttonClass} type="submit" disabled={!file || loading}><FaUpload /> {loading ? "Working…" : "Validate and preview"}</button></div>
        </form>
        <div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold">CSV fields</h3><div className="mt-2 flex flex-wrap gap-2">{selectedEntity.columns.map((col) => <span key={col.name} title={col.required ? "Required" : "Optional"} className="rounded-md bg-canvas px-2 py-1 font-mono text-xs">{col.name}{col.required ? " *" : ""}</span>)}</div><p className="mt-2 text-xs text-ink-muted">Unknown columns and HTML are rejected. Leave blank values unchanged in update mode; use [clear] to clear an optional text value.</p></div>
      </section>}

      {batch && <section className="rounded-xl bg-surface p-5 sm:p-6" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Batch {batchId}</p><h2 className="mt-1 text-xl font-bold capitalize">{batch.status?.replaceAll("_", " ")}</h2></div><div className="flex flex-wrap gap-2">
          {batch.errorCount > 0 || summary?.errors > 0 ? <button className={secondaryClass} onClick={onErrors} type="button"><FaFileCsv /> Error CSV</button> : null}
          {canCommit && <button className={buttonClass} onClick={onCommit} disabled={loading} type="button"><FaCheckCircle /> Commit import</button>}
          {["validated", "failed", "awaiting_approval"].includes(batch.status) && <button className={secondaryClass} onClick={onDiscard} disabled={loading} type="button">Discard</button>}
          {batch.status === "committed" && <button className={secondaryClass} onClick={onRollback} disabled={loading} type="button"><FaRedo /> Roll back</button>}
        </div></div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">{[["Rows", summary?.rows ?? batch.rowCount], ["Create", summary?.create ?? batch.createdCount], ["Update", summary?.update ?? batch.updatedCount], ["Unchanged", summary?.unchanged ?? batch.unchangedCount], ["Errors", summary?.errors ?? batch.errorCount], ["Warnings", summary?.warnings ?? batch.warningCount]].map(([label, value]) => <div className="rounded-lg bg-canvas p-3" key={label}><p className="text-xs text-ink-muted">{label}</p><p className="text-xl font-bold">{value ?? 0}</p></div>)}</div>
        {batch.errors?.length > 0 && <div className="mt-5 overflow-auto"><h3 className="mb-2 text-sm font-bold">Validation errors</h3><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-line text-ink-muted"><th className="py-2">Row</th><th>Column</th><th>Issue</th></tr></thead><tbody>{batch.errors.map((item, index) => <tr className="border-b border-line" key={`${item.row}-${item.column}-${index}`}><td className="py-2">{item.row}</td><td>{item.column}</td><td>{item.message}</td></tr>)}</tbody></table></div>}
        {batch.preview?.length > 0 && <div className="mt-5 overflow-auto"><h3 className="mb-2 text-sm font-bold">Preview (first 100 rows)</h3><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-line text-ink-muted"><th className="py-2">Row</th><th>Action</th><th>Service</th><th>Changed fields</th></tr></thead><tbody>{batch.preview.map((item) => <tr className="border-b border-line" key={item.row}><td className="py-2">{item.row}</td><td className="capitalize">{item.action}</td><td>{item.key}</td><td>{item.changedFields?.join(", ") || "—"}</td></tr>)}</tbody></table></div>}
      </section>}

      <section className="rounded-xl bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Recent imports</h2><p className="mt-1 text-sm text-ink-muted">CSV hashes, counts and batch history are retained for audit.</p></div><button onClick={() => refreshHistory().catch(() => {})} className={secondaryClass} type="button"><FaHistory /> Refresh</button></div>
        {history.length ? <div className="overflow-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-line text-ink-muted"><th className="py-2">Batch</th><th>Entity</th><th>Status</th><th>Rows</th><th>Uploaded</th><th></th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-b border-line"><td className="py-3">#{item.id}</td><td>{item.entity}</td><td className="capitalize">{item.status.replaceAll("_", " ")}</td><td>{item.rowCount}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td><td><button type="button" onClick={() => selectBatch(item.id)} className="font-semibold text-primary underline">Review</button></td></tr>)}</tbody></table></div> : <p className="text-sm text-ink-muted">No import batches yet.</p>}
      </section>
    </div>
  </main>;
}

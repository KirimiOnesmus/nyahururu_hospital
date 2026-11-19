import api from "./axios";

const requestHeaders = { "X-Import-Request": "true" };

export const getImportEntities = () => api.get("/admin/imports/entities");
export const getImportHistory = (params) => api.get("/admin/imports", { params });
export const getImportBatch = (id) => api.get(`/admin/imports/${id}`);
export const validateImport = (entity, file, mode) => {
  const body = new FormData();
  body.append("file", file);
  return api.post(`/admin/imports/${entity}/validate?mode=${encodeURIComponent(mode)}`, body, { headers: requestHeaders });
};
export const commitImport = (id) => api.post(`/admin/imports/${id}/commit`, { confirm: true }, { headers: requestHeaders });
export const rollbackImport = (id) => api.post(`/admin/imports/${id}/rollback`, {}, { headers: requestHeaders });
export const discardImport = (id) => api.delete(`/admin/imports/${id}`, { headers: requestHeaders });
export const downloadImportTemplate = (entity) => api.get(`/admin/imports/entities/${entity}/template`, { responseType: "blob" });
export const downloadImportErrors = (id) => api.get(`/admin/imports/${id}/errors.csv`, { responseType: "blob" });

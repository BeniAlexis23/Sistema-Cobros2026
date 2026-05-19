import { request } from "./http.js";

export const clientsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/clients${query ? `?${query}` : ""}`);
  },
  get: (id) => request(`/clients/${id}`),
  shares: (id) => request(`/clients/${id}/shares`),
  share: (id, payload) => request(`/clients/${id}/shares`, { method: "POST", body: JSON.stringify(payload) }),
  removeShare: (id, shareId) => request(`/clients/${id}/shares/${shareId}`, { method: "DELETE" }),
  payments: (id, year) => request(`/clients/${id}/payments${year ? `?year=${year}` : ""}`),
  paymentYears: (id) => request(`/clients/${id}/payment-years`),
  create: (payload) => request("/clients", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  confirmPayment: (id, payload) => request(`/clients/${id}/payment`, { method: "POST", body: JSON.stringify(payload) }),
  remove: (id) => request(`/clients/${id}`, { method: "DELETE" }),
  import: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/clients/import", { method: "POST", body: form });
  }
};

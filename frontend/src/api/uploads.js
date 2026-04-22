import { request } from "./http.js";

export const uploadsApi = {
  invoice: ({ clientId, file }) => {
    const form = new FormData();
    if (clientId) form.append("client_id", clientId);
    form.append("file", file);
    return request("/uploads/invoice", { method: "POST", body: form });
  }
};

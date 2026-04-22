import { request } from "./http.js";

export const dashboardApi = {
  get: () => request("/dashboard")
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");

  return data;
}

export const apiOrigin = import.meta.env.VITE_PUBLIC_API_ORIGIN || "http://localhost:4000";

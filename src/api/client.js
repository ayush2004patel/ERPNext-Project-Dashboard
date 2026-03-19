import axios from "axios";

// ─── Axios Instance ────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

// ─── Request Interceptor — Inject Auth Token ──────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiSecret = import.meta.env.VITE_API_SECRET;

    if (apiKey && apiSecret) {
      config.headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    // For multipart uploads, let the browser set Content-Type automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Normalise ERPNext Errors ─────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network / timeout error
      return Promise.reject({
        message: "Network error — please check your connection.",
        status: null,
        original: error,
      });
    }

    const { status, data } = error.response;

    // ERPNext wraps errors in `exc_type` / `message` / `exception`
    const serverMessage =
      data?.message ||
      data?.exception ||
      data?.exc_type ||
      "An unexpected error occurred.";

    const normalised = {
      message: serverMessage,
      status,
      exc_type: data?.exc_type || null,
      original: error,
    };

    switch (status) {
      case 401:
        normalised.message =
          "Unauthorised — check your API key and secret.";
        break;
      case 403:
        normalised.message =
          "Forbidden — you don't have permission to perform this action.";
        break;
      case 404:
        normalised.message = "Resource not found.";
        break;
      case 409:
        normalised.message =
          serverMessage || "Conflict — duplicate or constraint violation.";
        break;
      case 417: // ERPNext validation errors
        normalised.message =
          serverMessage || "Validation error.";
        break;
      case 500:
        normalised.message =
          serverMessage || "Server error — please try again later.";
        break;
      default:
        normalised.message = serverMessage;
    }

    return Promise.reject(normalised);
  }
);

export default client;
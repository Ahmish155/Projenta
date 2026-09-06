import axios from "axios";
import { auth } from "../firebase.js";

const api = axios.create({ baseURL: "/api" });

// Attach a fresh Firebase ID token on every request — Firebase handles
// refreshing it under the hood, so we always grab the current one.
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;

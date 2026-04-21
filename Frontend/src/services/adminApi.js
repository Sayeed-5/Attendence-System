import api from "./api";

export const adminApi = {
  listUsers: (params) => api.get("/user/admin/users", { params }),
  createUser: (payload) => api.post("/user/admin/users", payload),
  updateUser: (id, payload) => api.patch(`/user/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/user/admin/users/${id}`),

  listSessions: (params) => api.get("/session/admin/sessions", { params }),
  createSession: (payload) => api.post("/session/admin/sessions", payload),
  updateSession: (id, payload) => api.patch(`/session/admin/sessions/${id}`, payload),
  deleteSession: (id) => api.delete(`/session/admin/sessions/${id}`),

  listAttendance: (params) => api.get("/attendance/admin/records", { params }),
  createAttendance: (payload) => api.post("/attendance/admin/records", payload),
  updateAttendance: (id, payload) => api.patch(`/attendance/admin/records/${id}`, payload),
  deleteAttendance: (id) => api.delete(`/attendance/admin/records/${id}`),
};


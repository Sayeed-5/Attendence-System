export function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeOnly(value) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

export function getInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "ST";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

export function clampPercentage(value) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

export function getSessionStatus(session) {
  const now = Date.now();
  const start = session?.startTime ? new Date(session.startTime).getTime() : null;
  const end = session?.endTime ? new Date(session.endTime).getTime() : null;

  if (session?.isActive && start && end && now >= start && now <= end) {
    return "In Progress";
  }
  if (session?.isActive && start && now < start) {
    return "Starting Soon";
  }
  if (end && now > end) {
    return "Completed";
  }
  if (start && now < start) {
    return "Scheduled";
  }
  if (session?.isActive === false) {
    return "Closed";
  }
  return "Scheduled";
}

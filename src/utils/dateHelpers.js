export const GRACE_MS = 3 * 60 * 60 * 1000;
export const MONTH_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
export const WEEKDAY_SHORT = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export const startOfWeekDate = (d, weekStart = "MON") => {
  const dd = new Date(d);
  const day = dd.getDay();
  const offset = weekStart === "MON" ? (day + 6) % 7 : day;
  dd.setDate(dd.getDate() - offset);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

export const adjustedDateKey = (d, resetHour = 0) => {
  const dd = new Date(d);
  if (dd.getHours() < resetHour) dd.setDate(dd.getDate() - 1);
  return dateKey(dd);
};

export const formatGrace = (msLeft) => {
  if (msLeft <= 0) return "expired";
  const hours = Math.floor(msLeft / (60 * 60 * 1000));
  const mins = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${String(mins).padStart(2,"0")}m`;
  return `${mins}m`;
};


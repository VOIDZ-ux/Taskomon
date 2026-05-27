import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { initSleepDebug } from "./utils/debugState.js";

const _search = window.location.search;
if (_search.includes("debug=sleep")) {
  localStorage.clear();
  initSleepDebug();
} else if (_search.includes("debug=1")) {
  const isEmpty =
    !localStorage.getItem("taskomon_state") &&
    !localStorage.getItem("taskomonState") &&
    !localStorage.getItem("taskomonHabits");
  if (isEmpty) initSleepDebug();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

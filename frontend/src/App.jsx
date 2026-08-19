import { useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/LoginPage";

function navigate(path, replace = false) {
  window.history[replace ? "replaceState" : "pushState"]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("sccAdminToken"));
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (token && path !== "/admin") navigate("/admin", true);
    if (!token && path !== "/login") navigate("/login", true);
  }, [token, path]);

  function login(nextToken) {
    sessionStorage.setItem("sccAdminToken", nextToken);
    setToken(nextToken);
    navigate("/admin", true);
  }

  function logout() {
    sessionStorage.removeItem("sccAdminToken");
    setToken(null);
    navigate("/login", true);
  }

  return token ? <AdminDashboard token={token} onLogout={logout} /> : <LoginPage onLogin={login} />;
}

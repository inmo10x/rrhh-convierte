import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rrhh_token");
    const nombre = localStorage.getItem("rrhh_nombre");
    const user_id = localStorage.getItem("rrhh_user_id");
    if (token && nombre) {
      setUser({ token, nombre, user_id });
    }
    setLoading(false);
  }, []);

  const login = ({ access_token, nombre, user_id }) => {
    localStorage.setItem("rrhh_token", access_token);
    localStorage.setItem("rrhh_nombre", nombre);
    localStorage.setItem("rrhh_user_id", String(user_id));
    setUser({ token: access_token, nombre, user_id });
  };

  const logout = () => {
    localStorage.removeItem("rrhh_token");
    localStorage.removeItem("rrhh_nombre");
    localStorage.removeItem("rrhh_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

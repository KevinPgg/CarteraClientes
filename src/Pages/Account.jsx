// src/Pages/Account.jsx
import AccountModal from "../Components/AccountModal";
import { useAuth } from "../contexts/AuthContext";

export default function Account() {
  const auth = useAuth();

  return (
    <div className="account-page">
      {auth.isAuthenticated ? (
        <AccountModal />
      ) : (
        <p>
          No has iniciado sesión. <a href="/login">Inicia sesión</a> para ver tu cuenta.
        </p>
      )}
    </div>
  );
}
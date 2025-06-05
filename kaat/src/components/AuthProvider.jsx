

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import "../styles/Login.css";               

export default function AuthProvider({ setUser, setIsLoggedIn }) {
  const [error, setError] = useState(null);

  /* helpers unchanged … */
  const extractUser = (payload, email) => {
    if (!payload) return null;
    if (payload.results) payload = payload.results;

    if (Array.isArray(payload)) {
      return payload.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    }
    return payload.email?.toLowerCase() === email.toLowerCase() ? payload : null;
  };

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const jwtPayload = JSON.parse(atob(credential.split(".")[1]));
      const email = jwtPayload.email;

      const res = await fetch(
        `http://127.0.0.1:8000/api/users/?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error("Server error while looking up user");

      const payload = await res.json();
      const dbUser = extractUser(payload, email);
      if (!dbUser)
        throw new Error("Email not recognised by the department database");

      setUser(dbUser);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <h1 className="brand-line">
        Welcome to <span className="brand">Code&nbsp;Review&nbsp;by&nbsp;KAAT</span>
      </h1>
      <h2 className="subtitle">Please sign in below</h2>

      <div className="gsi-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google sign-in cancelled")}
          theme="outline"        /* white button */
          size="large"
          width="350"
        />
      </div>

      {error && (
        <p className="error" data-testid="login-error">
          {error}
        </p>
      )}
    </div>
  );
}

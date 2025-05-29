// AuthProvider.js
import { GoogleLogin } from '@react-oauth/google';

export default function AuthProvider({ setIsLoggedIn, setUser }) {
  
  return (
    <div className="login-page">
      <h1>Please sign in</h1>

      <GoogleLogin
        onSuccess={({ credential }) => {
          const payload = JSON.parse(atob(credential.split('.')[1]));
          setUser(payload);
          setIsLoggedIn(true);
        }}
        onError={() => console.log('Login failed')}
        theme="outline"
        size="large"
      />
    </div>
  );
}

import React, { useState } from 'react';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (data: { email: string; password: string }) => void;
  ssoOptions?: Array<{ provider: string; onClick: () => void }>;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, ssoOptions }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    onSubmit({ email, password });
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{type === 'login' ? 'Login' : 'Sign Up'}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit">{type === 'login' ? 'Login' : 'Sign Up'}</button>
      </form>
      {ssoOptions && ssoOptions.length > 0 && (
        <div className="sso-section">
          <hr />
          <span>Or continue with</span>
          <div className="sso-buttons">
            {ssoOptions.map(opt => (
              <button key={opt.provider} onClick={opt.onClick} className={`sso-btn sso-${opt.provider}`}>{opt.provider}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;

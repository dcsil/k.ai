import AuthForm from '../../components/AuthForm';

export default function LoginPage() {
  const handleLogin = async (data: { email: string; password: string }) => {
    // TODO: Integrate with backend API for login
    // Example: const res = await fetch('/api/auth/login', ...)
    // On success, store token and redirect
    console.log('Login data:', data);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AuthForm type="login" onSubmit={handleLogin} />
    </div>
  );
}

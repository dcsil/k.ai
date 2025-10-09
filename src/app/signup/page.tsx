import AuthForm from '../../components/AuthForm';

export default function SignupPage() {
  const handleSignup = async (data: { email: string; password: string }) => {
    // TODO: Integrate with backend API for signup
    // Example: const res = await fetch('/api/auth/signup', ...)
    // On success, store token and redirect
    console.log('Signup data:', data);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AuthForm type="signup" onSubmit={handleSignup} />
    </div>
  );
}

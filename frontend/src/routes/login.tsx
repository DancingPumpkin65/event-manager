import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Card, Input, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Lock, LogIn, ShieldUser } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use AuthContext login which will update state and verify session
      await login({ username, password });

      // Navigate after successful authentication
      navigate({ to: '/admin/dashboard' });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-balance">Admin Login</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center justify-center">
          <Input
            id="username"
            type="text"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoFocus
            required
            fullWidth
            leftIcon={<ShieldUser className="w-5 h-5 mr-2" />}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            fullWidth
            leftIcon={<Lock className="w-5 h-5 mr-2" />}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            leftIcon={<LogIn className="w-5 h-5 mr-2" />}
            className="!py-2 !px-6"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}


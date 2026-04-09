import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, id, username, role, fullName } = response.data.data;
      
      setAuth(accessToken, { id, username, role, fullName });
      toast.success(`Welcome back, ${fullName}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      const msg = error.response?.status === 403 || error.response?.status === 429
          ? error.response?.data?.message || 'Account locked or rate limited. Try again later.'
          : error.response?.data?.message || 'Invalid username or password';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Please authorize your identity."
    >
      <form className="space-y-7" onSubmit={handleSubmit(onSubmit)}>
        
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-5">
          <Input
            label="Username"
            type="text"
            autoComplete="username"
            autoFocus
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('username')}
            error={errors.username?.message}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full py-4 text-base rounded-xl font-bold tracking-wide bg-indigo-600 hover:bg-indigo-700 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] active:scale-[0.98] transition-all" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <span className="text-slate-500 font-medium">Don't have clearance? </span>
        <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-bold ml-1 transition-colors relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-indigo-600 after:left-0 after:-bottom-1 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
          Request access
        </Link>
      </div>
    </AuthLayout>
  );
}

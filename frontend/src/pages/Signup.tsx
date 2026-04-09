import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export function Signup() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/auth/signup', {
        fullName: data.fullName,
        username: data.username,
        password: data.password
      });
      const { accessToken, id, username, role, fullName } = response.data.data;
      
      setAuth(accessToken, { id, username, role, fullName });
      toast.success(`Welcome to Angadia Pedhi, ${fullName}!`);
      navigate('/', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to register account';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Request Authorization" 
      subtitle="Create an account to access ledgers."
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
            label="Full Name"
            type="text"
            autoComplete="name"
            autoFocus
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('fullName')}
            error={errors.fullName?.message}
          />

          <Input
            label="Username"
            type="text"
            autoComplete="username"
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('username')}
            error={errors.username?.message}
          />

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('password')}
            error={errors.password?.message}
          />

          <PasswordInput
            label="Confirm Password"
            autoComplete="new-password"
            className="py-3.5 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-base shadow-sm transition-colors"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
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
                <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <span className="text-slate-500 font-medium">Already have clearance? </span>
        <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold ml-1 transition-colors relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-indigo-600 after:left-0 after:-bottom-1 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

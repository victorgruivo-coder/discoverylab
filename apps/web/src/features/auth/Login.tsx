import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { loginInput, type LoginInput } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/api-client';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInput),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setServerError(null);

    try {
      await login(values);
      await navigate('/', { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const submit = handleSubmit(onSubmit);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500">
          Sign in to continue your discovery work.
        </p>
      </div>

      {serverError === null ? null : (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email?.message ? (
            <p id="login-email-error" className="text-xs text-red-600">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            {...register('password')}
          />
          {errors.password?.message ? (
            <p id="login-password-error" className="text-xs text-red-600">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { signupInput, type SignupInput } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/api-client';

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupInput),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignupInput): Promise<void> => {
    setServerError(null);

    try {
      await signup(values);
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
          Create your account
        </h1>
        <p className="text-sm text-slate-500">
          Start turning problems into prioritized opportunities.
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
          <Label htmlFor="signup-name">Name</Label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'signup-name-error' : undefined}
            {...register('name')}
          />
          {errors.name?.message ? (
            <p id="signup-name-error" className="text-xs text-red-600">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            {...register('email')}
          />
          {errors.email?.message ? (
            <p id="signup-email-error" className="text-xs text-red-600">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'signup-password-error' : 'signup-password-hint'
            }
            {...register('password')}
          />
          {errors.password?.message ? (
            <p id="signup-password-error" className="text-xs text-red-600">
              {errors.password.message}
            </p>
          ) : (
            <p id="signup-password-hint" className="text-xs text-slate-500">
              Use 10 characters or more.
            </p>
          )}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

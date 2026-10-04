// HTTP-boundary shapes for auth. The shared package already owns the request
// and response schemas; this module re-exports them so the auth module imports
// from one place, and adds the type attached to request.user.
export { loginInput, signupInput, userOutput } from '@discoverylab/shared';
export type { LoginInput, SignupInput, UserOutput } from '@discoverylab/shared';

/** The minimum a request needs to know about the caller. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

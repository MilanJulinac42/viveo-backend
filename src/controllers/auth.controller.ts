import type { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export async function register(req: Request, res: Response) {
  const { fullName, email, password, accountType } = req.body as RegisterInput;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    error(res, authError.message, 'AUTH_ERROR');
    return;
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    role: accountType,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    error(res, 'Greška pri kreiranju profila', 'PROFILE_ERROR');
    return;
  }

  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    error(res, 'Nalog kreiran, ali prijava nije uspela. Pokušajte da se prijavite.', 'SIGN_IN_ERROR');
    return;
  }

  success(res, {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      fullName,
      role: accountType,
    },
    session: {
      accessToken: session.session?.access_token,
      refreshToken: session.session?.refresh_token,
    },
  }, undefined, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    error(res, 'Pogrešan email ili lozinka', 'INVALID_CREDENTIALS', 401);
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', data.user.id)
    .single();

  success(res, {
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.full_name,
      role: profile?.role,
      avatarUrl: profile?.avatar_url,
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7);

  if (token) {
    await supabase.auth.signOut();
  }

  success(res, { message: 'Uspešno ste se odjavili' });
}

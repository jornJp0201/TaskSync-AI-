'use client';

import { getSupabaseBrowser } from '@/lib/supabase-browser';

const supabase = getSupabaseBrowser();

function getFunctionUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  return `${supabaseUrl}/functions/v1/google-calendar-sync`;
}

async function callEdgeFunction(action: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(getFunctionUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return await res.json();
}

export interface GCalStatus {
  connected: boolean;
  email: string | null;
}

export async function getGCalStatus(): Promise<GCalStatus> {
  return (await callEdgeFunction('status')) as unknown as GCalStatus;
}

export async function disconnectGCal(): Promise<void> {
  await callEdgeFunction('disconnect');
}

export async function syncFromGoogle(): Promise<{ imported: number }> {
  return (await callEdgeFunction('sync')) as unknown as { imported: number };
}

export async function exportEventToGoogle(eventId: string): Promise<{ google_event_id: string }> {
  return (await callEdgeFunction('export-event', { eventId })) as unknown as { google_event_id: string };
}

export async function exportTaskToGoogle(
  taskId: string,
  startTime: string,
  endTime: string
): Promise<{ google_event_id: string }> {
  return (await callEdgeFunction('export-task', { taskId, startTime, endTime })) as unknown as {
    google_event_id: string;
  };
}

export async function deleteFromGoogle(googleEventId: string): Promise<void> {
  await callEdgeFunction('delete-from-google', { googleEventId });
}

export async function storeGCalTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<{ success: boolean; email: string | null }> {
  return (await callEdgeFunction('store-tokens', {
    accessToken,
    refreshToken,
    expiresIn,
  })) as unknown as { success: boolean; email: string | null };
}

// ===== OAuth flow helpers =====

export function buildOAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google Client ID not configured');

  const redirectUri = `${window.location.origin}/auth/google-callback`;
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeOAuthCode(code: string): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials not configured');

  const redirectUri = `${window.location.origin}/auth/google-callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();
  await storeGCalTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
}

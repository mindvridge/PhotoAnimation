import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        // Local development: use origin directly
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // Production with load balancer: use forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Production: use origin
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

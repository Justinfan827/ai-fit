import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/create-server-client";
import type { NextRequest } from "next/server";

/**
 * This endpoint handles the code exchange in the supabase auth flow:
 * https://supabase.com/docs/guides/auth/auth-helpers/nextjs#code-exchange-route
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Handle errors sent via query params
  // from the supabase auth server. E.g. expired magic link.
  const err = searchParams.get("error");
  if (err) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: "Supabase auth server error",
      errorCode: "supabase_auth_server_error",
      errorDescription:
        "Supabase called auth callback with error query parameter",
    });
  }

  const original = searchParams.get("original_path");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!token_hash || !type) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: "Missing token hash or type",
      errorCode: "missing_token_hash_or_type",
      errorDescription: "Missing token hash or type in the query params.",
    });
  }
  const supabase = createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });
  if (error) {
    return redirectToSigninWithErrors(request.nextUrl, {
      errorTitle: error.name,
      errorCode: error.code || "unknown_supabase_error",
      errorDescription: error.message,
    });
  }

  if (original) {
    return NextResponse.redirect(`${origin}${original}`);
  }
  return NextResponse.redirect(`${origin}/home/customers/segments`);
}

type errorSearchParams = {
  errorTitle: string;
  errorCode: string;
  errorDescription: string;
};

function redirectToSigninWithErrors(
  requestUrl: URL,
  { errorTitle, errorCode, errorDescription }: errorSearchParams,
) {
  requestUrl.searchParams.set("error", errorTitle);
  requestUrl.searchParams.set("error_code", errorCode);
  requestUrl.searchParams.set("error_description", errorDescription);
  const redirectErrorURL =
    `${requestUrl.origin}/signin?` + requestUrl.searchParams;

  return NextResponse.redirect(redirectErrorURL);
}

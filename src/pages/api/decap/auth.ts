export const prerender = false;

import type { APIRoute } from "astro";

/**
 * Step 1 of the Decap CMS GitHub OAuth dance. The CMS opens a popup to this
 * route; we redirect it straight to GitHub's own authorize screen. GitHub
 * then redirects the popup back to /api/decap/callback with a `code`.
 */
export const GET: APIRoute = ({ redirect, url }) => {
  const clientId = import.meta.env.DECAP_GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("DECAP_GITHUB_CLIENT_ID is not configured.", { status: 500 });
  }

  const redirectUri = `${url.origin}/api/decap/callback`;
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  // `repo` is the only scope Decap needs to read/write content in this repo.
  authorizeUrl.searchParams.set("scope", "repo,user");

  return redirect(authorizeUrl.toString());
};

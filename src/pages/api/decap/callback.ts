export const prerender = false;

import type { APIRoute } from "astro";

/**
 * Step 2 of the Decap CMS GitHub OAuth dance. GitHub redirects here with a
 * `code`; we exchange it server-side for an access token (needs the client
 * secret, so this must happen off the client) and hand the token back to the
 * CMS popup's opener window via the postMessage handshake Decap/Netlify CMS
 * expects: the popup announces itself, waits for the opener to acknowledge,
 * then sends the token.
 */
function renderMessagePage(status: "success" | "error", payload: string) {
  const html = `<!doctype html>
<html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:${status}:${payload}',
        e.origin
      );
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.DECAP_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.DECAP_GITHUB_CLIENT_SECRET;
  const code = url.searchParams.get("code");

  if (!clientId || !clientSecret) {
    return renderMessagePage("error", JSON.stringify({ message: "OAuth app not configured on the server." }));
  }
  if (!code) {
    return renderMessagePage("error", JSON.stringify({ message: "GitHub did not return an authorization code." }));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/decap/callback`,
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenJson.access_token) {
      return renderMessagePage(
        "error",
        JSON.stringify({ message: tokenJson.error_description ?? tokenJson.error ?? "No access_token in GitHub's response." })
      );
    }

    return renderMessagePage("success", JSON.stringify({ token: tokenJson.access_token, provider: "github" }));
  } catch (error) {
    return renderMessagePage("error", JSON.stringify({ message: (error as Error).message }));
  }
};

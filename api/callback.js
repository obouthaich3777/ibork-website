export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `https://${host}/api/callback`;

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return res.status(400).send(`Auth Error: ${data.error_description || data.error || 'No token returned'}`);
    }

    const content = JSON.stringify({
      token: data.access_token,
      provider: 'github',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Authenticating...</p>
        <script>
          (function() {
            function receiveMessage(e) {
              window.opener.postMessage(
                'authorization:github:success:${content}',
                e.origin
              );
              window.removeEventListener("message", receiveMessage, false);
              window.close();
            }
            window.addEventListener("message", receiveMessage, false);
            if (window.opener) {
              window.opener.postMessage("authorizing:github", "*");
            }
          })();
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send(`Server Error: ${err.message}`);
  }
}
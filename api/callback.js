export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

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
    }),
  });

  const data = await response.json();
  const token = data.access_token;
  const payload = JSON.stringify({ token, provider: 'github' });

  const html = `
    <script>
      window.opener.postMessage('authorization:github:success:${payload}', '*');
      window.close();
    </script>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
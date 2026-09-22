const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const https = require('https');

const SECRET_KEY = process.env.JWT_SECRET || 'a-very-secure-secret-key-2025';

// Helper to build a standard session token + user response
const buildSessionResponse = async (res, userToLog) => {
  if (userToLog.locked === 'true' || userToLog.status === 'false' || userToLog.activeStatus === 'false') {
    return res.status(403).json({ error: 'Account is deactivated. Please contact HR.' });
  }

  const token = jwt.sign(
    { id: userToLog.id, username: userToLog.userName, role: userToLog.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  const empRecord = await prisma.employee.findFirst({
    where: { userId: userToLog.id },
    select: { profileImageUrl: true }
  });

  return res.status(200).json({
    token,
    user: { ...userToLog, profileImageUrl: empRecord?.profileImageUrl || null }
  });
};

// Helper to resolve a User from an email address
const resolveUserByEmail = async (email) => {
  const emp = await prisma.employee.findFirst({
    where: { email },
    include: { user: true }
  });
  if (emp?.user) return emp.user;

  // Fallback to raw User table (for admins not linked to an employee record)
  const rawUser = await prisma.user.findFirst({ where: { email } });
  return rawUser || null;
};

//
// ── Google SSO ──────────────────────────────────────────────────────────────
// Receives an access_token from @react-oauth/google and fetches the user's
// profile from Google's own userinfo endpoint to extract the verified email.
//
const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Missing Google access_token' });

    // Fetch user info from Google's userinfo endpoint (does NOT require a Client Secret)
    const googleProfileUrl = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(access_token)}`;

    https.get(googleProfileUrl, (googleRes) => {
      let data = '';
      googleRes.on('data', (chunk) => { data += chunk; });
      googleRes.on('end', async () => {
        try {
          const profile = JSON.parse(data);
          const email = profile?.email;

          if (!email || !profile.email_verified) {
            return res.status(401).json({ error: 'Could not verify Google account email.' });
          }

          const user = await resolveUserByEmail(email);
          if (!user) {
            return res.status(404).json({ error: 'This Google account is not registered in the EES system. Please contact HR.' });
          }

          return buildSessionResponse(res, user);
        } catch (parseErr) {
          console.error('[SSO] Google profile parse error:', parseErr);
          return res.status(500).json({ error: 'Google SSO login failed' });
        }
      });
    }).on('error', (err) => {
      console.error('[SSO] Google userinfo fetch error:', err);
      return res.status(500).json({ error: 'Could not reach Google servers.' });
    });
  } catch (err) {
    console.error('[SSO] Google Login Error:', err);
    res.status(500).json({ error: 'Google SSO Login Failed' });
  }
};

//
// ── Microsoft SSO ────────────────────────────────────────────────────────────
// Receives the MSAL AccountInfo object from @azure/msal-react after a
// successful loginPopup(). The username field in MSAL AccountInfo IS the
// user's confirmed email address.
//
const microsoftLogin = async (req, res) => {
  try {
    const { account } = req.body;
    const email = account?.username;

    if (!email) return res.status(400).json({ error: 'Invalid Microsoft account payload. Missing username.' });

    const user = await resolveUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'This Microsoft account is not registered in the EES system. Please contact HR.' });
    }

    return buildSessionResponse(res, user);
  } catch (err) {
    console.error('[SSO] Microsoft Login Error:', err);
    res.status(500).json({ error: 'Microsoft SSO Login Failed' });
  }
};

module.exports = { googleLogin, microsoftLogin };

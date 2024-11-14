import { google } from 'googleapis';
import crypto from 'crypto';
import type { RequestHandler } from '@sveltejs/kit';
import { checkEmailRegistered } from '../../../lib/auth';

const gmailConfig = {
    clientId: import.meta.env.VITE_GMAIL_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET,
    refreshToken: import.meta.env.VITE_GMAIL_REFRESH_TOKEN,
    redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI
};

// Convert the ENCRYPTION_KEY and IV to Uint8Array
const key = new Uint8Array(Buffer.from(import.meta.env.VITE_ENCRYPTION_KEY as string, 'hex')); // 32-byte key
const iv = new Uint8Array(Buffer.from(import.meta.env.VITE_IV as string, 'hex')); // 16-byte IV
const baseUrl = import.meta.env.VITE_BASE_URL

function encryptEmail(email: string): string {
    const algorithm = 'aes-256-cbc';

    // Ensure the IV is exactly 16 bytes
    if (iv.length !== 16) {
        throw new Error('Invalid IV length. IV must be 16 bytes.');
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(email, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export const POST: RequestHandler = async ({ request }) => {
    const { email } = await request.json();

    // check if email already exists in system
    const exists = await checkEmailRegistered(email);

    if (exists) {
        // if email already exists, return Response with message to switch to log in experience
        return new Response(JSON.stringify({ success: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // otherwise send verification email

    const oauth2Client = new google.auth.OAuth2(
        gmailConfig.clientId,
        gmailConfig.clientSecret,
        gmailConfig.redirectUri
    );

    oauth2Client.setCredentials({ refresh_token: gmailConfig.refreshToken });

    const senderName = 'tincann.ing';
    const senderEmail = 'imgood@tincann.ing';
    const sender = `"${senderName}" <${senderEmail}>`;

    const encryptedEmail = encryptEmail(email);

    const subject = 'tincann.ing | Verify your email address';
    const message = `
		<html>
			<body>
				<p><strong>Thanks for signing up! <a href='${baseUrl}/verify/${encryptedEmail}'>Click here to verify your email address.</a></strong></p>
				<p>If you didn't enter your email at <a href='https://tincann.ing'>tincann.ing</a>, you can still click the link above to try it out, or just ignore this message entirely!</p>
				<p><a href='https://tincann.ing'>tincann.ing</a> is a place to chat openly and anonymously with people outside your normal life. It is not social media, just one-on-one conversations for a low-pressure chance to connect with someone.</p>
				<p style='font-size: small; color: grey; margin-top: 3rem;'>217 E 7th Street, New York, NY 10009 USA</p>
			</body>
		</html>
	`;

    const emailData = [
        `To: ${email}`,
        `From: ${sender}`,
        'Subject: ' + subject,
        'Content-Type: text/html; charset=utf-8',
        '',
        message
    ].join('\n');

    console.log(emailData)

    const encodedMessage = Buffer.from(emailData).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: unknown) {
        // Type-check to safely access the error message
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error sending email:', errorMessage);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

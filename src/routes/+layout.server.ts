import type { LayoutServerLoad } from './$types';
import crypto from 'crypto';
import { validateEmail } from '../lib/utils';
import { checkEmailRegistered } from '../lib/auth';

const key = new Uint8Array(Buffer.from(process.env.VITE_ENCRYPTION_KEY as string, 'hex')); // 32-byte key
const iv = new Uint8Array(Buffer.from(process.env.VITE_IV as string, 'hex')); // 16-byte IV

function decryptEmail(encryptedEmail: string): string {
    const algorithm = 'aes-256-cbc';

    // Create the decipher with algorithm, key, and iv
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedEmail, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export const load: LayoutServerLoad = async ({ params, url }) => {
    let email: string | null = null;
    let registered: boolean | null = null;

    // Optionally, access query params or params here to get email if available.
    const token = url.searchParams.get('token') || params.token;

    if (token) {
        try {
            email = decryptEmail(token); // Assume decryptEmail is a function that decrypts the token to email

            // validate email
            if (validateEmail(email)) {
                // check if email already exists in system
                const exists = await checkEmailRegistered(email);
                if (exists) {
                    registered = true;
                }
            } else {
                console.warn("Invalid email")
                email = null;
            }
        } catch (err) {
            console.error('Decryption error:', err);
        }
    }

    return { email, registered };
};
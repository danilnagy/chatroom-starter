import sgMail, { type ClientResponse, type MailDataRequired } from '@sendgrid/mail';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const SENDER_EMAIL = process.env['SENDGRID_SENDER_EMAIL'];
const SENDER_NAME = process.env['SENDGRID_SENDER_NAME'];
const API_KEY = process.env['SENDGRID_API_KEY'];

sgMail.setApiKey(API_KEY as string);

export const POST: RequestHandler = async ({ request }) => {
	const { to } = await request.json();
	const success = await sendEmail(to);
	return json({ success });
};

async function sendEmail(to: string) {
	const message = {
		to,
		// from: SENDER_EMAIL,
		from: 'danilnagy@gmail.com',
		subject: 'Message from SendGrid',
		text: 'Test message from SendGrid',
		html: '<h1>HTML Message from SendGrid</h1>'
	};

	try {
		const response: [ClientResponse, {}] = await sgMail.send(message as MailDataRequired);
		return response[0]?.statusCode === 202;
	} catch (error) {
		if (error.response) {
			console.error('Error response from SendGrid:', error.response.body.errors);
		} else {
			console.error('Error response from SendGrid:', error);
		}
		return false;
	}
}

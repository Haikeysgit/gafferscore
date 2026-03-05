import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { message, email } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'GafferScore <onboarding@resend.dev>', // Use a verified domain if available, or onboarding for testing
            to: 'haikeysfpl@gmail.com',
            subject: 'New Feedback from GafferScore',
            html: `
        <h2>New Feedback Received</h2>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
        <br/>
        <p><strong>User Email (optional):</strong> ${email || 'Not provided'}</p>
      `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Contact API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

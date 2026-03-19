import crypto from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { logError, logSecurityWarn } from '$lib/server/logging';

function secureCompare(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function computeSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export async function POST({ request, locals }) {
    const secret = privateEnv.BILLING_WEBHOOK_SECRET;
    if (!secret) {
        logError({
            message: 'billing_webhook_secret_missing',
            requestId: locals.requestId,
            path: '/api/billing/webhook'
        });
        return json({ ok: false, error: 'Webhook secret is not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-billing-signature');
    if (!signature) {
        logSecurityWarn({
            message: 'billing_webhook_missing_signature',
            requestId: locals.requestId,
            path: '/api/billing/webhook'
        });
        return json({ ok: false, error: 'Missing webhook signature' }, { status: 401 });
    }

    const rawBody = await request.text();
    const expected = computeSignature(rawBody, secret);
    if (!secureCompare(signature, expected)) {
        logSecurityWarn({
            message: 'billing_webhook_invalid_signature',
            requestId: locals.requestId,
            path: '/api/billing/webhook'
        });
        return json({ ok: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    let event: unknown;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Skeleton handler: wire business actions in dedicated handlers per event type.
    return json({
        ok: true,
        requestId: locals.requestId,
        received: typeof event === 'object' && event ? true : false
    });
}

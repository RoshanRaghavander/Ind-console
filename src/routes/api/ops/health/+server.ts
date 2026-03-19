import { json } from '@sveltejs/kit';

export function GET({ locals }) {
    return json(
        {
            ok: true,
            status: 'healthy',
            service: 'ind-console',
            requestId: locals.requestId,
            timestamp: new Date().toISOString()
        },
        {
            headers: {
                'cache-control': 'no-store'
            }
        }
    );
}

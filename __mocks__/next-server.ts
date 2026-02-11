// __mocks__/next-server.ts — Helpers for testing Next.js Route Handlers

/**
 * Create a mock Request object for testing route handlers
 */
export function createMockRequest(
    url: string,
    options: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
        cookies?: Record<string, string>;
    } = {}
): Request {
    const { method = 'GET', body, headers = {}, cookies = {} } = options;

    // Build cookie header string
    const cookieStr = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

    if (cookieStr) {
        headers['cookie'] = cookieStr;
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && method !== 'GET') {
        init.body = JSON.stringify(body);
    }

    return new Request(url, init);
}

/**
 * Parse the JSON response from a NextResponse
 */
export async function parseResponse(response: Response) {
    const status = response.status;
    const data = await response.json();
    return { status, data };
}

/**
 * Mock cookies() from next/headers
 * Returns a mock cookie store with get/set/delete methods
 */
export function createMockCookieStore(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));

    return {
        get: jest.fn((name: string) => {
            const value = store.get(name);
            return value ? { name, value } : undefined;
        }),
        set: jest.fn((name: string, value: string, _options?: any) => {
            store.set(name, value);
        }),
        delete: jest.fn((name: string) => {
            store.delete(name);
        }),
        has: jest.fn((name: string) => store.has(name)),
        getAll: jest.fn(() =>
            Array.from(store.entries()).map(([name, value]) => ({ name, value }))
        ),
    };
}

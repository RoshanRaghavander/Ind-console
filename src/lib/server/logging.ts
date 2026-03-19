type LogLevel = 'info' | 'warn' | 'error';

type LogEvent = {
    level: LogLevel;
    message: string;
    requestId?: string;
    method?: string;
    path?: string;
    status?: number;
    durationMs?: number;
    tenantId?: string | null;
    details?: Record<string, unknown>;
};

function emit(payload: LogEvent): void {
    const line = JSON.stringify({
        ts: new Date().toISOString(),
        ...payload
    });

    if (payload.level === 'error') {
        console.error(line);
        return;
    }
    if (payload.level === 'warn') {
        console.warn(line);
        return;
    }
    console.log(line);
}

export function logRequest(log: Omit<LogEvent, 'level' | 'message'>): void {
    emit({
        level: 'info',
        message: 'http_request',
        ...log
    });
}

export function logSecurityWarn(log: Omit<LogEvent, 'level' | 'message'> & { message: string }): void {
    emit({
        level: 'warn',
        ...log
    });
}

export function logError(log: Omit<LogEvent, 'level' | 'message'> & { message: string }): void {
    emit({
        level: 'error',
        ...log
    });
}

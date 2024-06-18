export function parseEnvEntry(entry: string, previous: Record<string, string>): Record<string, string> {
    const delimiterIndex = entry.indexOf('=');
    const key = entry.slice(0, delimiterIndex);
    const value = entry.slice(delimiterIndex + 1);

    return {
        ...previous,
        [key]: value,
    };
}

export function serializeEnv(env: Record<string, string>): string {
    return Object.entries(env)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');
}

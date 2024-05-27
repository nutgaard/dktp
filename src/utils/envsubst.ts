const envsubPattern = /\$\{\s*([^-}]+(?:-[^}]+)?)\s*\}/g;

export function envsubst(content: string, env: NodeJS.ProcessEnv, delimiter: string = '-'): string {
    return content.replaceAll(envsubPattern, (_, match) => {
        let key: string = match;
        let defaultValue: string = `\${${match}}`;
        if (match.includes(delimiter)) {
            [key, defaultValue] = match.split(delimiter);
        }
        return env[key] ?? defaultValue;
    });
}

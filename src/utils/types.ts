import { exitInvariant } from './invariant';

export function requireNotNull<T>(value: T | null | undefined, errorMessage: string): T {
    exitInvariant(value != null, errorMessage);
    return value;
}

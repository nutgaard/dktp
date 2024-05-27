import logger from './logger';

export function invariant(condition: boolean, message: string | (() => string)): asserts condition {
    if (condition) return;

    const errorMessage = typeof message === 'string' ? message : message();
    throw new Error(errorMessage);
}

export function exitInvariant(condition: any, message: string | (() => string)): asserts condition {
    if (condition) return;

    const errorMessage = typeof message === 'string' ? message : message();

    logger.fatal(errorMessage);
    process.exit(1);
}

import type { Program } from '@caporal/core';
import { ActionParameters, Logger, ParsedArgumentsObject, ParsedOptions } from 'types';

export function registerTestCmd(program: Program) {
    program
        .command('test', 'Testing setup')
        .argument('<src>', 'source folder')
        .option('-f, --format <format>', 'output format', {
            default: 'formatting',
            validator: ['formatting', 'other'],
        })
        .action(test);
}

function test({ logger, args, options }: ActionParameters) {
    logger.info(`Testing: ${args.src}`);
    logger.info(`Testing: ${options.format}`);
}

import type { Program } from '@caporal/core';
import { ActionParameters } from 'types';

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

async function test({ logger, args, options }: ActionParameters) {
    const src: string = args.src.toString();
    const file = Bun.file(src);

    logger.info(`Length of ${file.name} is ${file.length}`);
    const content = await file.text();
    const lines = content.split('\n');
    const preamble = lines.slice(0, 5).join('\n');
    logger.info('-'.repeat(20));
    logger.info(preamble);
    logger.info('-'.repeat(20));
}

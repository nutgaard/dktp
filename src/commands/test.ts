import { ArgumentsCamelCase, CommandModule } from 'yargs';

type Args = { source: string; format?: string };
export const testCommand: CommandModule<{}, Args> = {
    command: 'test <source>',
    describe: 'Testing setup',
    builder(yargs) {
        return yargs
            .positional('source', {
                describe: 'Source folder to read',
                type: 'string',
                demandOption: true,
            })
            .option('format', {
                type: 'string',
                default: 'formatting',
                description: 'output format',
                alias: 'f',
                choices: ['formatting', 'other'],
            });
    },
    async handler(args: ArgumentsCamelCase<Args>) {
        const src: string = args.source.toString();
        const file = Bun.file(src);

        console.info(`Length of ${file.name} is ${file.size}`);
        const content = await file.text();
        const lines = content.split('\n');
        const preamble = lines.slice(0, 5).join('\n');
        console.info('-'.repeat(20));
        console.info(preamble);
        console.info('-'.repeat(20));
    },
};

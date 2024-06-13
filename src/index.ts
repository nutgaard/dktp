import { program } from 'commander';
import { wrapCommand } from './commands/wrap';
import { runCommand } from './commands/run';
import { inspectCommand } from './commands/inspect';

program
    .name('dktp')
    .description('CLI to help working dktp apps')
    .addCommand(wrapCommand)
    .addCommand(runCommand)
    .addCommand(inspectCommand)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .parse();

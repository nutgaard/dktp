import { program } from 'commander';
import { wrapCommand } from './commands/wrap';
import { runCommand } from './commands/run';

program
    .name('dktp')
    .description('CLI to help working dktp apps')
    .addCommand(wrapCommand)
    .addCommand(runCommand)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .parse();

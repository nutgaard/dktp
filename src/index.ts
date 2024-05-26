import { program } from 'commander';
import { wrapCommand } from './commands/wrap';

program
    .name('dktp')
    .description('CLI to help working dktp apps')
    .addCommand(wrapCommand)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .parse();

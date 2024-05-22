import 'bun';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { testCommand } from './commands/test';

yargs(hideBin(process.argv)).scriptName('dktp').command(testCommand).help().demandCommand().parse();

import 'bun';
import { program } from '@caporal/core';
import { registerTestCmd } from './commands/test';

program
    .name('dktp')
    .bin('dktp')
    .description('A simple cli to interact with Azure ContainerApps with arm/yaml templates');

registerTestCmd(program);

program.run();

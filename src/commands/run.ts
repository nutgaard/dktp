import { Command, program } from 'commander';
import dotenv from 'dotenv';
import { getExec } from '../utils/exec';
import { getFS } from '../utils/ifs';
import { promptPassword } from '../prompts/promptPassword';
import { Encryption } from '../utils/encryption';

export const runCommand: Command = program
    .createCommand('run')
    .option('-e, --env <env_file>', 'Envfile to use for interpolation')
    .argument('<command...>', 'The command to run')
    .action(async (cmds, options) => {
        const vaultFile = await getFS().file(options.env).json();
        const password = await promptPassword();
        const content = await Encryption.decrypt(password, vaultFile);

        const env = dotenv.parse(content);
        dotenv.populate(process.env as dotenv.DotenvPopulateInput, env, { override: true });

        getExec().spawn(cmds);
    });

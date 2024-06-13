import { Command, program } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { getExec } from '../utils/exec';
import { getFS } from '../utils/ifs';
import { CipherData, Encryption } from '../utils/encryption';
import { getKeyVerifier } from '../utils/persistent-unlock';

export const runCommand: Command = program
    .createCommand('run')
    .option('-e, --env <env_file>', 'Envfile to use for interpolation')
    .argument('<command...>', 'The command to run')
    .action(async (cmds, options) => {
        const fs = getFS();
        const dirname = path.dirname(options.env);
        const unlockfile = path.join(dirname, '.dktp.unlocked');
        const vaultFile: CipherData = await fs.file(options.env).json();

        const { keyVerifier, updatedValue } = await getKeyVerifier(unlockfile, vaultFile);
        const [key, verifier] = keyVerifier;
        const content = await Encryption.decryptWithKey(key, verifier, vaultFile);

        if (updatedValue) {
            await fs.write(unlockfile, Buffer.from(updatedValue));
        }

        const env = dotenv.parse(content);
        dotenv.populate(process.env as dotenv.DotenvPopulateInput, env, { override: true });

        getExec().spawn(cmds);
    });

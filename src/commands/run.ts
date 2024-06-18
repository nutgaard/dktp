import { Command, program } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { getExec } from '../utils/exec';
import { getFS } from '../utils/ifs';
import { CipherData, Encryption } from '../utils/encryption';
import { getKeyVerifier } from '../utils/persistent-unlock';
import { parseEnvEntry } from '../utils/env-utils';

export const runCommand: Command = program
    .createCommand('run')
    .argument('<env_file>', 'Envfile to use for process')
    .argument('<command...>', 'The command to run')
    .option(
        '-o, --override [keyvalue...]',
        'Override or pass extra environment variable, e.g MY_VAR=abba',
        parseEnvEntry,
        {},
    )
    .action(async (envFile, cmds, options) => {
        const fs = getFS();
        const dirname = path.dirname(envFile);
        const unlockfile = path.join(dirname, '.dktp.unlocked');
        const vaultFile: CipherData = await fs.file(envFile).json();

        const { keyVerifier, updatedValue } = await getKeyVerifier(unlockfile, vaultFile);
        const [key, verifier] = keyVerifier;
        const content = await Encryption.decryptWithKey(key, verifier, vaultFile);

        if (updatedValue) {
            await fs.write(unlockfile, Buffer.from(updatedValue));
        }

        const env = dotenv.parse(content);
        dotenv.populate(env, options.override, { override: true });
        dotenv.populate(process.env as dotenv.DotenvPopulateInput, env, { override: true });

        getExec().spawn(cmds);
    });

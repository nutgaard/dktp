import { Command, program } from 'commander';
import path from 'path';
import { getFS } from '../utils/ifs';
import { CipherData, Encryption } from '../utils/encryption';
import { getKeyVerifier } from '../utils/persistent-unlock';
import { parseEnvEntry, serializeEnv } from '../utils/env-utils';
import dotenv from 'dotenv';

export const inspectCommand: Command = program
    .createCommand('inspect')
    .description('Print content of encrypted lock-file')
    .argument('<env_file>', 'File to inspect')
    .option(
        '-o, --override [keyvalue...]',
        'Override or pass extra environment variable, e.g MY_VAR=abba',
        parseEnvEntry,
        {},
    )
    .action(async (envFile, options) => {
        const fs = getFS();
        const dirname = path.dirname(envFile);
        const unlockfile = path.join(dirname, '.dktp.unlocked');
        const vaultFile: CipherData = await fs.file(envFile).json();

        const { keyVerifier, updatedValue } = await getKeyVerifier(unlockfile, vaultFile);
        const [key, verifier] = keyVerifier;
        const content = await Encryption.decryptWithKey(key, verifier, vaultFile);

        const env = dotenv.parse(content);
        dotenv.populate(env, options.override, { override: true });

        if (updatedValue) {
            await fs.write(unlockfile, Buffer.from(updatedValue));
        }

        console.log(serializeEnv(env));
    });

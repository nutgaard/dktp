import { Command, program } from 'commander';
import path from 'path';
import { getFS } from '../utils/ifs';
import { CipherData, Encryption } from '../utils/encryption';
import { getKeyVerifier } from '../utils/persistent-unlock';

export const inspectCommand: Command = program
    .createCommand('inspect')
    .option('-e, --env <env_file>', 'View content of envview')
    .action(async (options) => {
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

        console.log(content);
    });

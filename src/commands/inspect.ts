import { Command, program } from 'commander';
import path from 'path';
import { getFS } from '../utils/ifs';
import { CipherData, Encryption } from '../utils/encryption';
import { getKeyVerifier } from '../utils/persistent-unlock';

export const inspectCommand: Command = program
    .createCommand('inspect')
    .argument('<env_file>', 'File to inspect')
    .action(async (envFile) => {
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

        console.log(content);
    });

import { Command, program } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { getExec } from '../utils/exec';
import { getFS } from '../utils/ifs';
import { promptPassword } from '../prompts/promptPassword';
import { CipherData, Encryption, KeyAndVerifier, PasswordVerifier } from '../utils/encryption';
import { Duration } from '../utils/duration';

export const runCommand: Command = program
    .createCommand('run')
    .option('-e, --env <env_file>', 'Envfile to use for interpolation')
    .argument('<command...>', 'The command to run')
    .action(async (cmds, options) => {
        const fs = getFS();
        const dirname = path.dirname(options.env);
        const unlockfile = path.join(dirname, '.dktp.unlocked');
        const vaultFile: CipherData = await fs.file(options.env).json();

        const unlockdata: KeyAndVerifier | null = await getUnlockData(unlockfile, vaultFile.verifier);

        let key;
        let verifier;
        let expandedPassword;
        if (unlockdata) {
            [key, verifier] = unlockdata;
        } else {
            const salt = new Uint8Array(Buffer.from(vaultFile.salt, 'base64'));
            const password = await promptPassword();
            expandedPassword = await Encryption.expandPasswordWithSalt(password, salt);
            [key, verifier] = await Encryption.createKeyVerifier(expandedPassword);
        }

        const content = await Encryption.decryptWithKey(key, verifier, vaultFile);

        if (expandedPassword) {
            await fs.write(unlockfile, Buffer.from(expandedPassword));
        }

        const env = dotenv.parse(content);
        dotenv.populate(process.env as dotenv.DotenvPopulateInput, env, { override: true });

        getExec().spawn(cmds);
    });

const MAX_DURATION_UNLOCK_FILE = Duration.ofHours(8);
async function getUnlockData(path: string, vaultVerifier: PasswordVerifier): Promise<KeyAndVerifier | null> {
    const fs = getFS();
    const file = fs.file(path);

    const exists = await file.exists();
    if (!exists) return null;

    const now = new Date().getTime();
    const lastModified = file.lastModified;
    if (now - lastModified > MAX_DURATION_UNLOCK_FILE.asWholeMilliseconds()) {
        await fs.unlink(path);
        return null;
    }

    const content = await file.arrayBuffer();
    const [key, verifier] = await Encryption.createKeyVerifier(content);

    if (verifier !== vaultVerifier) {
        await fs.unlink(path);
        return null;
    }

    return [key, verifier];
}

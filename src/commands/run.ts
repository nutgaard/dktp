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

async function getKeyVerifier(
    unlockfile: string,
    data: CipherData,
): Promise<{ keyVerifier: KeyAndVerifier; updatedValue?: ArrayBuffer }> {
    const unlockdata: KeyAndVerifier | null = await getUnlockData(unlockfile, data.verifier);
    if (unlockdata != null) {
        return {
            keyVerifier: unlockdata,
            updatedValue: undefined,
        };
    }

    const salt = new Uint8Array(Buffer.from(data.salt, 'base64'));
    const password = await promptPassword();
    const expandedPassword = await Encryption.expandPasswordWithSalt(password, salt);
    const keyVerifier = await Encryption.createKeyVerifier(expandedPassword);

    return { keyVerifier, updatedValue: expandedPassword };
}

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

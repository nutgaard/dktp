import { CipherData, Encryption, KeyAndVerifier, PasswordVerifier } from './encryption';
import { promptPassword } from '../prompts/promptPassword';
import { Duration } from './duration';
import { getFS } from './ifs';

export async function getKeyVerifier(
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

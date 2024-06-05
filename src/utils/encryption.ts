import { webcrypto as crypto } from 'node:crypto';
import { exitInvariant } from './invariant';

export type Password = string & { __type: 'password' };
export type PasswordVerifier = string & { __type: 'password_verifier' };
export type Ciphertext = string & { __type: 'ciphertext' };
export type CipherData = {
    ciphertext: Ciphertext;
    salt: string;
    iv: string;
    verifier: PasswordVerifier;
};
export type KeyAndVerifier = [CryptoKey, PasswordVerifier];

export class Encryption {
    static asPassword(password: string): Password {
        return password as Password;
    }

    static async expandPasswordWithSalt(
        password: Password,
        salt: NodeJS.TypedArray,
        iterations: number = 100_000,
    ): Promise<ArrayBuffer> {
        const encoder = new TextEncoder();

        const key: CryptoKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
            'deriveBits',
        ]);

        return crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-512',
                salt,
                iterations,
            },
            key,
            512,
        );
    }

    static async createKeyVerifier(derivedBits: ArrayBuffer): Promise<KeyAndVerifier> {
        const firstHalf = derivedBits.slice(0, 32);
        const lastHalf = derivedBits.slice(32);

        const cryptokey: CryptoKey = await createCryptoKey(firstHalf, ['encrypt', 'decrypt']);
        const verifier: PasswordVerifier = Buffer.from(lastHalf).toString('base64') as PasswordVerifier;

        return [cryptokey, verifier];
    }

    static async encrypt(password: Password, data: string): Promise<CipherData> {
        const salt = getRandomBits(128);
        const expandedPassword = await Encryption.expandPasswordWithSalt(password, salt);
        const [key, verifier] = await Encryption.createKeyVerifier(expandedPassword);
        return Encryption.encryptWithKey(key, verifier, salt, data);
    }

    static async encryptWithKey(
        key: CryptoKey,
        verifier: PasswordVerifier,
        salt: NodeJS.TypedArray,
        data: string,
    ): Promise<CipherData> {
        const encoder = new TextEncoder();
        const iv = getRandomBits(256);
        const params: AesGcmParams = {
            name: 'AES-GCM',
            iv,
        };

        const ciphertext = await crypto.subtle.encrypt(params, key, encoder.encode(data));

        return {
            ciphertext: Buffer.from(ciphertext).toString('base64') as Ciphertext,
            salt: Buffer.from(salt).toString('base64'),
            iv: Buffer.from(iv).toString('base64'),
            verifier,
        };
    }

    static async decrypt(password: Password, data: CipherData): Promise<string> {
        const salt = new Uint8Array(Buffer.from(data.salt, 'base64'));
        const expandedPassword = await Encryption.expandPasswordWithSalt(password, salt);
        const [key, verifier] = await Encryption.createKeyVerifier(expandedPassword);

        return Encryption.decryptWithKey(key, verifier, data);
    }

    static async decryptWithKey(key: CryptoKey, verifier: PasswordVerifier, data: CipherData): Promise<string> {
        exitInvariant(verifier === data.verifier, 'Wrong password');

        const decoder = new TextDecoder();
        const ciphertext = new Uint8Array(Buffer.from(data.ciphertext, 'base64'));
        const iv = new Uint8Array(Buffer.from(data.iv, 'base64'));

        const params: AesGcmParams = {
            name: 'AES-GCM',
            iv,
        };

        const plaintext = await crypto.subtle.decrypt(params, key, ciphertext);

        return decoder.decode(plaintext);
    }
}

function getRandomBits(bits: number): NodeJS.TypedArray {
    const data = new Uint8Array(bits / 8);
    crypto.getRandomValues(data);
    return data;
}

async function createCryptoKey(data: ArrayBuffer, keyUsages: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', data, { name: 'AES-GCM', length: data.byteLength * 8 }, false, keyUsages);
}

import { describe, expect, test, it } from 'vitest';
import { Encryption } from './encryption';

describe('encryption', () => {
    const password = Encryption.asPassword('password1231');
    const plaintext = Encryption.asPlaintext(`
          this is some text
          over multiple lines!!
    `);

    test('encryption should produce cipherdata', async () => {
        const cipherdata = await Encryption.encrypt(password, plaintext);
    });

    test('multiple encryption should not reuse iv or salt', async () => {
        const first = await Encryption.encrypt(password, plaintext);
        const second = await Encryption.encrypt(password, plaintext);

        expect(first.iv).not.toEqual(second.iv);
        expect(first.salt).not.toEqual(second.salt);
    });

    test('decryption using same password should return content', async () => {
        const cipherdata = await Encryption.encrypt(password, plaintext);
        const decrypted = await Encryption.decrypt(password, cipherdata);

        expect(decrypted).toEqual(plaintext);
    });

    test('larger amount of data should work', async () => {
        const longline =
            'ENVIRONMENT_VARIABLE=https://url-to-random-subdomain.with-multiple-subdomains.awesomecloudplattform.io\n';
        const plaintext = Encryption.asPlaintext(longline.repeat(1000));
        const cipherdata = await Encryption.encrypt(password, plaintext);
        const decrypted = await Encryption.decrypt(password, cipherdata);

        expect(decrypted).toEqual(plaintext);
    });
});

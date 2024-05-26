import { Encryption, Password } from '../utils/encryption';
import { DEBUG } from '../utils/targetPlatform';

export async function promptPassword(): Promise<Password> {
    if (DEBUG) return Encryption.asPassword('1234');

    const inquirer = await import('inquirer');
    const response = await inquirer.default.prompt([
        {
            message: 'Password?',
            name: 'password',
            type: 'password',
        },
    ]);

    return Encryption.asPassword(response.password);
}

import { Encryption, Password } from '../utils/encryption';

export async function promptPassword(): Promise<Password> {
    const inquirer = await import('inquirer');
    const prompt = inquirer.createPromptModule({
        output: process.stderr,
    });
    const response = await prompt([
        {
            message: 'Password?',
            name: 'password',
            type: 'password',
        },
    ]);

    return Encryption.asPassword(response.password);
}

import { getExec } from './exec';
import { ARMYamlSecret } from './arm-yaml-config.types';
import { DEBUG } from './targetPlatform';

export class AZCli {
    static async assertLogin(): Promise<void> {
        if (DEBUG) return;

        await getExec().run('az account show');
    }
    static async fetchSecret(secret: ARMYamlSecret): Promise<{ value: string }> {
        if (DEBUG) return { value: secret.name.toUpperCase() };

        return getExec().run(`az keyvault secret show --id ${secret.keyVaultUrl}`).json();
    }
}

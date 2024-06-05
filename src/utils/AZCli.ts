import { getExec } from './exec';
import { ARMYamlSecret } from './arm-yaml-config.types';
import { AZ_MOCK } from './targetPlatform';

export class AZCli {
    static async assertLogin(): Promise<boolean> {
        if (AZ_MOCK) return true;

        try {
            await getExec().run('az account show').text();
            return true;
        } catch (e) {
            return false;
        }
    }
    static async fetchSecret(secret: ARMYamlSecret): Promise<{ value: string }> {
        if (AZ_MOCK) return { value: secret.name.toUpperCase().split('').reverse().join('') };

        return getExec().run(`az keyvault secret show --id ${secret.keyVaultUrl}`).json();
    }
}

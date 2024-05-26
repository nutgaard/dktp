import { program, Command } from 'commander';
import dotenv from 'dotenv';
import { ArmYamlConfig } from '../utils/arm-yaml-config';
import { getFS } from '../utils/ifs';
import { AZCli } from '../utils/AZCli';
import { ARMYamlEnv, isEnvSecretRef } from '../utils/arm-yaml-config.types';
import { promptPassword } from '../prompts/promptPassword';
import { Encryption } from '../utils/encryption';

export const wrapCommand: Command = program
    .createCommand('wrap')
    .description('Download secrets, and encrypt environment')
    .argument('configfile', 'Path to dktp yaml file')
    .option('-c, --container <container_name>', 'Container name to process (defaults to create a combined env file)')
    .option('-e, --env <env_file>', 'Envfile to use for interpolation')
    .action(async (configfile, options) => {
        await AZCli.assertLogin();
        const password = await promptPassword();
        console.log('options', options);

        const config = await ArmYamlConfig.from(configfile);
        if (options.env) {
            const envContent = await getFS().file(options.env).text();
            config.interpolateWithEnvValues(dotenv.parse(envContent));
        }
        const secrets = config.getConfig().properties.configuration.secrets;
        let containerEnvs: ARMYamlEnv[] = [];
        if (!options.container) {
            containerEnvs = config.getConfig().properties.template.containers.flatMap((it) => it.env);
        } else {
            const container = config
                .getConfig()
                .properties.template.containers.find((it) => it.name === options.container);
            if (!container) throw new Error(`Could not find container: ${options.container}`);
            containerEnvs = container.env;
        }

        const keyvaultValues: Record<string, string> = {};
        for (const secret of secrets) {
            const secretValue = await AZCli.fetchSecret(secret);
            keyvaultValues[secret.name] = secretValue.value;
        }

        const output: Record<string, string> = {};
        for (const envElement of containerEnvs) {
            if (isEnvSecretRef(envElement)) {
                output[envElement.name] = keyvaultValues[envElement.secretRef];
            } else {
                output[envElement.name] = envElement.value;
            }
        }

        const envFileContent = Object.entries(output)
            .map(([key, value]) => `${key}="${value}"`)
            .join('\n');

        const encryptedContent = await Encryption.encrypt(password, envFileContent);

        console.log(JSON.stringify(encryptedContent, null, 2));
    });

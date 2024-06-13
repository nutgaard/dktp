import { program, Command } from 'commander';
import dotenv from 'dotenv';
import { ArmYamlConfig } from '../utils/arm-yaml-config';
import { getFS } from '../utils/ifs';
import { AZCli } from '../utils/AZCli';
import { ARMYamlEnv, isEnvSecretRef } from '../utils/arm-yaml-config.types';
import { promptPassword } from '../prompts/promptPassword';
import { Encryption } from '../utils/encryption';
import { exitInvariant } from '../utils/invariant';
import logger from '../utils/logger';

export const wrapCommand: Command = program
    .createCommand('wrap')
    .description('Download secrets, and encrypt environment')
    .argument('<configfile>', 'Path to dktp yaml file')
    .argument('[outputfile]', 'Path to encrypted vault file')
    .option('-c, --container <container_name>', 'Container name to process (defaults to create a combined env file)')
    .option('-e, --env <env_file>', 'Envfile to use for interpolation')
    .action(async (configfile, outputfile, options) => {
        logger.info('Verifying AZ CLI status');
        const azcli = await AZCli.assertLogin();
        exitInvariant(azcli, `Could not resolve AZ cli, or you're not logged in`);
        logger.info('AZ CLI verified');

        logger.info('Resolving container configuration');
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
            exitInvariant(container, `Could not find container: ${options.container}`);
            containerEnvs = container.env;
        }
        logger.info(
            `Found container environment with ${containerEnvs.length} variables, and ${secrets.length} secrets to resolve`,
        );

        const password = await promptPassword();
        const keyvaultValues: Record<string, string> = {};
        logger.info(`Resolving ${secrets.length} secrets...`);
        for (const secret of secrets) {
            logger.info(`Resolving ${secret.name}`);
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

        logger.info(`Creating vault-env content`);
        const encryptedContent = await Encryption.encrypt(password, envFileContent);

        if (outputfile) {
            getFS().write(outputfile, JSON.stringify(encryptedContent, null, 2));
        } else {
            console.log(JSON.stringify(encryptedContent, null, 2));
        }
    });

import * as YAML from 'yaml';
import { ARMYamlTemplate } from './arm-yaml-config.types';

export class ArmYamlConfig {
    static async from(file: string): Promise<ArmYamlConfig> {
        const content = await Bun.file(file).text();
        return new ArmYamlConfig(content);
    }
    private content: string;
    private config: ARMYamlTemplate | null;

    constructor(yamlContent: string) {
        this.content = yamlContent;
        this.config = null;
    }

    getConfig(): ARMYamlTemplate {
        if (this.config == null) {
            this.config = YAML.parse(this.content) as ARMYamlTemplate;
        }
        return this.config;
    }

    interpolateWithEnvValues(env: NodeJS.ProcessEnv): ArmYamlConfig {
        this.config = null;
        this.content = this.content.replaceAll(/\$\{\s*([^-}]+(?:-[^}]+)?)\s*\}/g, (_, match) => {
            let key: string = match;
            let defaultValue: string | undefined = match;
            if (match.includes('-')) {
                [key, defaultValue] = match.split('-');
            }

            return env[key] ?? defaultValue ?? key;
        });

        return this;
    }
}

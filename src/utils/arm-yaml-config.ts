import * as YAML from 'yaml';
import { ARMYamlTemplate } from './arm-yaml-config.types';
import { getFS } from './ifs';
import { envsubst } from './envsubst';

export class ArmYamlConfig {
    static async from(file: string): Promise<ArmYamlConfig> {
        const content = await getFS().file(file).text();
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
        this.content = envsubst(this.content, env, '-');
        return this;
    }
}

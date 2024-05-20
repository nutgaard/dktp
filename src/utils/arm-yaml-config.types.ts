export type ARMYamlTemplate = {
    properties: {
        configuration: {
            secrets: ARMYamlSecret[];
        };
        template: {
            containers: ARMYamlContainer[];
        };
    };
};

export type ARMYamlSecret = {
    name: string;
    keyVaultUrl: string;
    identity: string;
};

export type ARMYamlContainer = {
    name: string;
    env: ARMYamlEnv[];
    resources?: {
        cpu?: string;
        memory?: string;
    };
};

export type ARMYamlEnv = ARMYamlEnvValue | ARMYamlEnvSecretRef;
export type ARMYamlEnvValue = {
    name: string;
    value: string;
};
export type ARMYamlEnvSecretRef = {
    name: string;
    secretRef: string;
};

export function isEnvValue(value: ARMYamlEnv): value is ARMYamlEnvValue {
    return 'value' in value;
}
export function isEnvSecretRef(value: ARMYamlEnv): value is ARMYamlEnvSecretRef {
    return 'secretRef' in value;
}

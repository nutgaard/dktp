import { describe, expect, it } from 'vitest';
import { ArmYamlConfig } from './arm-yaml-config';

const yaml = `
properties:
  configuration:
    secrets:
      - name: secret-name
        keyVaultUrl: https://\${KEYVAULT_NAME}.url-to-keyvault.com
        identity: System
  template:
    containers:
      - name: first-container
        resources:
          cpu: \${cpu-0.5}
          memory: \${memory-1.0Gi}
        env:
          - name: ENV
            value: testing
          - name: PASSWORD
            secretRef: secret-name
`;

describe('arm-yaml-test', () => {
    it('should return parsed config', () => {
        const config = new ArmYamlConfig(yaml);
        expectMatchSnapshot(config.getConfig());
    });

    it('should inject values into string, and use default values if needed', () => {
        const config = new ArmYamlConfig(yaml)
            .interpolateWithEnvValues({
                KEYVAULT_NAME: 'mysecrets',
            })
            .getConfig();

        const cpu = config.properties.template.containers.at(0)?.resources?.cpu;
        const memory = config.properties.template.containers.at(0)?.resources?.memory;
        const keyvaultUrl = config.properties.configuration.secrets.at(0)?.keyVaultUrl;
        expect(cpu).toBe(0.5);
        expect(memory).toBe('1.0Gi');
        expect(keyvaultUrl).toBe('https://mysecrets.url-to-keyvault.com');
        expectMatchSnapshot(config);
    });

    it('should inject values into string, and prefer provided values', () => {
        const config = new ArmYamlConfig(yaml)
            .interpolateWithEnvValues({
                cpu: '1.0',
                memory: '1.5Gi',
                KEYVAULT_NAME: 'mysecrets',
            })
            .getConfig();

        const cpu = config.properties.template.containers.at(0)?.resources?.cpu;
        const memory = config.properties.template.containers.at(0)?.resources?.memory;
        const keyvaultUrl = config.properties.configuration.secrets.at(0)?.keyVaultUrl;
        expect(cpu).toBe(1.0);
        expect(memory).toBe('1.5Gi');
        expect(keyvaultUrl).toBe('https://mysecrets.url-to-keyvault.com');
        expectMatchSnapshot(config);
    });

    it('should variable name as default if not specified with a default', () => {
        const config = new ArmYamlConfig(yaml).interpolateWithEnvValues({}).getConfig();

        const keyvaultUrl = config.properties.configuration.secrets.at(0)?.keyVaultUrl;
        expect(keyvaultUrl).toBe('https://${KEYVAULT_NAME}.url-to-keyvault.com');
        expectMatchSnapshot(config);
    });

    it('should work with process.env', () => {
        const yaml = `value: \${PATH}`;
        const config = new ArmYamlConfig(yaml).interpolateWithEnvValues(process.env).getConfig() as any;

        expect(config.value.length).toBeGreaterThan(20);
    });
});

/**
 * Due to bug in bun
 * https://github.com/oven-sh/bun/issues/5272
 */
function expectMatchSnapshot(value: any) {
    const serialized = JSON.stringify(value, null, 2);
    const sanitized = serialized.replaceAll('$', '~');
    expect(sanitized).toMatchSnapshot();
}

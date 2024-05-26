import { exec as execCallback } from 'node:child_process';
import { promisify } from 'util';
import { TARGET_PLATFORM, TargetPlatform } from './targetPlatform';

type Exec = {
    json(): Promise<any>;
    text(): Promise<string>;
};

export function getExec(type: TargetPlatform = TARGET_PLATFORM) {
    if (type === 'node') {
        return {
            run: (cmd: string) => node(cmd),
        };
    } else {
        return {
            run: (cmd: string) => bun(cmd),
        };
    }
}

function bun(cmd: string): Exec {
    // @ts-ignore
    return Bun.$`cmd`;
}

function node(cmd: string): Exec {
    const exec = promisify(execCallback);
    const result = exec(cmd);
    return {
        async json(): Promise<any> {
            return result.then((it) => {
                if (it.stderr) throw new Error(it.stderr);
                return JSON.parse(it.stdout);
            });
        },
        async text(): Promise<string> {
            return result.then((it) => {
                if (it.stderr) throw new Error(it.stderr);
                return it.stdout;
            });
        },
    };
}

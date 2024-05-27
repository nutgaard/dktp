import { exec as execCallback } from 'node:child_process';
import { promisify } from 'util';
import spawn from 'cross-spawn';
import { TARGET_PLATFORM, TargetPlatform } from './targetPlatform';
import { requireNotNull } from './types';

type Exec = {
    json(): Promise<any>;
    text(): Promise<string>;
};

export function getExec(type: TargetPlatform = TARGET_PLATFORM) {
    if (type === 'node') {
        return {
            run: (cmd: string) => nodeCmd(cmd),
            spawn: (cmds: string[]) => nodeSpawn(cmds),
        };
    } else {
        return {
            run: (cmd: string) => bunCmd(cmd),
            spawn: (cmds: string[]) => bunSpawn(cmds),
        };
    }
}

function bunCmd(cmd: string): Exec {
    // @ts-ignore
    return Bun.$`cmd`;
}
function bunSpawn(cmd: string[]) {
    // @ts-ignore
    Bun.spawnSync(cmd, {
        stdio: ['inherit', 'inherit', 'inherit'],
        // @ts-ignore
        onExit(proc, exitCode, signalCode, error) {
            proc.kill(exitCode ?? signalCode ?? 1);
        },
        env: { ...process.env },
    });
}

function nodeCmd(cmd: string): Exec {
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

const signals: NodeJS.Signals[] = [
    'SIGINT',
    'SIGTERM',
    'SIGPIPE',
    'SIGHUP',
    'SIGBREAK',
    'SIGWINCH',
    'SIGUSR1',
    'SIGUSR2',
];
function nodeSpawn(cmd: string[]) {
    const program = requireNotNull(cmd.at(0), `Invalid command: ${cmd.join(' ')}`);
    const args = cmd.slice(1);
    const child = spawn(program, args, { stdio: 'inherit' }).on('exit', (exitCode, signal) => {
        if (typeof exitCode === 'number') {
            process.exit(exitCode);
        } else if (signal) {
            process.kill(process.pid, signal);
        } else {
            process.exit(1);
        }
    });

    for (const signal of signals) {
        process.on(signal, () => child.kill(signal));
    }
}

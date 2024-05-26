import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import filePath from 'node:path';
import { TARGET_PLATFORM, TargetPlatform } from './targetPlatform';

type IFs = {
    name?: string;
    size: number;
    text(): Promise<string>;
};

export function getFS(type: TargetPlatform = TARGET_PLATFORM) {
    if (type === 'node') {
        return {
            file: nodeRead,
            write: nodeWrite,
        };
    } else {
        return {
            file: bunRead,
            write: bunWrite,
        };
    }
}

function bunRead(path: string): IFs {
    // @ts-ignore
    return Bun.file(path);
}
function bunWrite(path: string, content: string): Promise<number> {
    // @ts-ignore
    return Bun.write(path, content);
}

function nodeRead(path: string): IFs {
    return {
        name: filePath.basename(path),
        size: fsSync.statSync(path).size,
        async text(): Promise<string> {
            return fs.readFile(path, 'utf-8').then((it) => it.toString());
        },
    };
}
async function nodeWrite(path: string, content: string): Promise<number> {
    await fs.mkdir(filePath.dirname(path), { recursive: true });
    await fs.writeFile(path, content, 'utf-8');
    return content.length;
}

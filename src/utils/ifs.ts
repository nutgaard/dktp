import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import filePath from 'node:path';
import { TARGET_PLATFORM, TargetPlatform } from './targetPlatform';

type IFs = {
    name?: string;
    size: number;
    lastModified: number;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json(): Promise<any>;
    exists(): Promise<boolean>;
};

export function getFS(type: TargetPlatform = TARGET_PLATFORM) {
    if (type === 'node') {
        return {
            file: nodeRead,
            write: nodeWrite,
            unlink: nodeUnlink,
        };
    } else {
        return {
            file: bunRead,
            write: bunWrite,
            // Not implemented in bun; https://bun.sh/guides/write-file/unlink
            unlink: nodeUnlink,
        };
    }
}

function bunRead(path: string): IFs {
    // @ts-ignore
    return Bun.file(path);
}
function bunWrite(path: string, content: string | Buffer): Promise<number> {
    // @ts-ignore
    return Bun.write(path, content);
}

function nodeRead(path: string): IFs {
    const stats = nodeStats(path);
    return {
        name: filePath.basename(path),
        size: stats.size,
        lastModified: stats.mtimeMs,
        async arrayBuffer(): Promise<ArrayBuffer> {
            return fs.readFile(path);
        },
        async text(): Promise<string> {
            return fs.readFile(path, 'utf-8').then((it) => it.toString());
        },
        async json(): Promise<any> {
            const content = await fs.readFile(path, 'utf-8').then((it) => it.toString());
            return JSON.parse(content);
        },
        async exists(): Promise<boolean> {
            return stats.exists;
        },
    };
}

async function nodeWrite(path: string, content: string | Buffer): Promise<number> {
    await fs.mkdir(filePath.dirname(path), { recursive: true });
    await fs.writeFile(path, content, 'utf-8');
    return content.length;
}

function nodeUnlink(path: string): Promise<void> {
    return fs.unlink(path);
}

function nodeStats(path: string) {
    try {
        const stats = fsSync.statSync(path);
        return {
            ...stats,
            exists: true,
        };
    } catch {
        return {
            exists: false,
            size: 0,
            mtimeMs: 0,
        };
    }
}

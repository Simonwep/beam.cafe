import {action, computed, observable} from 'mobx';
import {socket}                       from '../../socket';

export type ListedFileStatus = 'loading' | 'ready' | 'removing';

export type ListedFile = {
    status: ListedFileStatus;
    file: File;
    id: null | string;

    /**
     * Timestamp of last status-update. Used to improve
     * perceived performance.
     */
    updated: number;
};

export type Keys = Array<{
    id: string;
    name: string;
    key: string;
}>;

const remainingWaitingTime = (ts: number): number => {
    const diff = performance.now() - ts;
    const remaining = (Math.random() * 500 + 250) - diff;
    return Math.max(0, remaining);
};

/* eslint-disable no-console */
export class Files {
    @observable private readonly internalFiles: Array<ListedFile> = [];

    @computed
    public get listedFiles() {
        return this.internalFiles;
    }

    @computed
    public get isEmpty() {
        return this.internalFiles.length === 0;
    }

    @action
    public add(...files: Array<File>) {

        // Read and save files
        const keysToRequest = [];
        for (const file of files) {

            // Skip duplicates
            if (this.internalFiles.find(ef => ef.file.name === file.name)) {
                continue;
            }

            this.internalFiles.push({
                updated: performance.now(),
                status: 'loading',
                id: null,
                file
            });

            keysToRequest.push({
                name: file.name,
                size: file.size
            });
        }

        // Request first set of download-keys
        socket.send(JSON.stringify({
            type: 'download-keys',
            payload: keysToRequest
        }));
    }

    @action
    public removeFile(id: string) {
        const fileIndex = this.internalFiles.findIndex(
            value => value.id === id
        );

        if (~fileIndex) {
            const file = this.internalFiles[fileIndex];
            file.updated = performance.now();
            file.status = 'removing';

            socket.send(JSON.stringify({
                type: 'remove-file',
                payload: file.id
            }));

            setTimeout(() => {
                const currentIndex = this.internalFiles.findIndex(value => value.id === id);
                this.internalFiles.splice(currentIndex, 1);
            }, remainingWaitingTime(file.updated));
        } else {
            console.warn('File not registered yet.');
        }
    }

    @action
    public enableFiles(idPairs: Keys) {
        for (const {name, id} of idPairs) {
            const target = this.internalFiles.find(
                value => value.file.name === name
            );

            if (target) {
                setTimeout(() => {
                    target.updated = performance.now();
                    target.status = 'ready';
                    target.id = id;
                }, remainingWaitingTime(target.updated));
            } else {
                console.warn(`[LF] File ${name} not longer available`);
            }
        }
    }
}

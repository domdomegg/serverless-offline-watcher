import chokidar from 'chokidar';
import { exec, ChildProcess } from 'child_process';

export type Config = {
  path: string | string[];
  command: string;
}[];

export interface Watcher {
  start: () => void;
  stop: () => Promise<void>;
}

export const makeWatcher = (config: Config): Watcher => {
  const internalWatchers: chokidar.FSWatcher[] = [];
  const processes: { [pid: number]: ChildProcess } = {};

  return {
    start: () => {
      config.forEach((c) => {
        const internalWatcher = chokidar.watch(c.path, { ignoreInitial: true });

        internalWatcher.on('all', () => {
          const call = exec(c.command, () => {
            if (call.pid) {
              delete processes[call.pid];
            }
          });
          call.stdout?.pipe(process.stdout);
          call.stderr?.pipe(process.stderr);
          if (!call.pid) {
            // Failed to start, make sure it's killed
            call.kill();
          } else {
            processes[call.pid] = call;
          }
        });

        internalWatchers.push(internalWatcher);
      });
    },
    stop: async () => {
      await Promise.all(internalWatchers.map((w) => w.close()));
      await Promise.all(Object.values(processes).map((p) => new Promise<void>((resolve) => {
        p.on('close', () => resolve());
        p.kill();
      })));
    },
  };
};

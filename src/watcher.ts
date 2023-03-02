import chokidar from 'chokidar';
import { exec, ChildProcess } from 'child_process';
import type Serverless from 'serverless';

type ConfigItem = {
  path: string | string[];
  command?: string;
  hooks?: string | string[];
};

export type Config = ConfigItem[];

export interface Watcher {
  start: () => void;
  stop: () => Promise<void>;
}

export const makeWatcher = (config: Config, serverless: Serverless): Watcher => {
  const internalWatchers: chokidar.FSWatcher[] = [];
  const processes: { [pid: number]: ChildProcess } = {};

  const runCommand = (command: string, eventType: string, eventPath: string) => new Promise<void>((resolve) => {
    const env = {
      ...process.env,
      WATCHER_EVENT_TYPE: eventType,
      WATCHER_EVENT_PATH: eventPath,
    };
    const call = exec(command, { env }, () => {
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
    call.on('close', () => resolve());
  });

  const runHook = (hookName: string) => {
    serverless.pluginManager.spawn(hookName);
  };

  return {
    start: () => {
      config.forEach((c) => {
        const internalWatcher = chokidar.watch(c.path, { ignoreInitial: true });

        internalWatcher.on('all', async (eventType, eventPath) => {
          if (c.command) {
            await runCommand(c.command, eventType, eventPath);
          }
          const hooks: string[] = ([] as string[]).concat(c.hooks || []);
          hooks.forEach(runHook);
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

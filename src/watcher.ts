import chokidar from 'chokidar';
import {exec, type ChildProcess} from 'child_process';
import type Serverless from 'serverless';

type ConfigItem = {
	path: string | string[];
	command?: string | string[];
	hook?: string | string[];
};

export type Config = ConfigItem[];

export type Watcher = {
	start: () => void;
	stop: () => Promise<void>;
};

export const makeWatcher = (config: Config, serverless: Serverless): Watcher => {
	const internalWatchers: chokidar.FSWatcher[] = [];
	const processes = new Map<number, ChildProcess>();

	const runCommand = async (command: string, eventType: string, eventPath: string) => new Promise<void>((resolve) => {
		const env = {
			...process.env,
			WATCHER_EVENT_TYPE: eventType,
			WATCHER_EVENT_PATH: eventPath,
		};
		const call = exec(command, {env}, () => {
			if (call.pid) {
				processes.delete(call.pid);
			}
		});
		call.stdout?.pipe(process.stdout);
		call.stderr?.pipe(process.stderr);
		if (!call.pid) {
			// Failed to start, make sure it's killed
			call.kill();
		} else {
			processes.set(call.pid, call);
		}

		call.on('close', () => {
			resolve();
		});
	});

	const runHook = (hookName: string) => {
		void serverless.pluginManager.spawn(hookName);
	};

	return {
		start() {
			config.forEach((c) => {
				const internalWatcher = chokidar.watch(c.path, {ignoreInitial: true});

				internalWatcher.on('all', async (eventType, eventPath) => {
					for (const command of normalizeStringArray(c.command)) {
						// eslint-disable-next-line no-await-in-loop
						await runCommand(command, eventType, eventPath);
					}

					normalizeStringArray(c.hook).forEach(runHook);
				});

				internalWatchers.push(internalWatcher);
			});
		},
		async stop() {
			await Promise.all(internalWatchers.map(async (w) => w.close()));
			await Promise.all([...processes.values()].map(async (p) => new Promise<void>((resolve) => {
				p.on('close', () => {
					resolve();
				});
				p.kill();
			})));
		},
	};
};

const normalizeStringArray = (valueOrValues: void | string | string[]): string[] => ([] as string[]).concat(valueOrValues || []);

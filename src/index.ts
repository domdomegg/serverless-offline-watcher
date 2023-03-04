import type Serverless from 'serverless';
import type Plugin from 'serverless/classes/Plugin';
import { Watcher, Config, makeWatcher } from './watcher';

const PLUGIN_NAME = 'serverless-offline-watcher';

class ServerlessOfflineWatcherPlugin implements Plugin {
  readonly hooks: Record<string, () => Promise<unknown>>;

  private readonly config: Config;

  private readonly watcher: Watcher;

  constructor(private serverless: Serverless) {
    this.config = this.serverless.service?.custom?.[PLUGIN_NAME] ?? [];

    if (!Array.isArray(this.config)) {
      throw new Error(`${PLUGIN_NAME}: config must be array`);
    }

    this.config.forEach((v, i) => {
      if (typeof v !== 'object') throw new Error(`${PLUGIN_NAME}: config entries must be objects, but the entry at index ${i} was a ${typeof v}`);
      validateStringOrStringArray(v, i, 'command', true);
      validateStringOrStringArray(v, i, 'hook', true);
      validateStringOrStringArray(v, i, 'path', false);
    });

    this.watcher = makeWatcher(this.config, serverless);

    if (this.config.length === 0) {
      this.serverless.cli.log(`${PLUGIN_NAME}: no entries in configuration, not doing anything`);
      this.hooks = {};
      return;
    }

    this.hooks = {
      'before:offline:start:init': this.start,
      'before:offline:start:end': this.stop,
    };
  }

  private start = async () => {
    this.serverless.cli.log(`${PLUGIN_NAME}: starting watchers...`);

    this.watcher.start();

    this.serverless.cli.log(`${PLUGIN_NAME}: started watchers`);
  };

  private stop = async () => {
    this.serverless.cli.log(`${PLUGIN_NAME}: stopping watchers...`);

    await this.watcher.stop();

    this.serverless.cli.log(`${PLUGIN_NAME}: stopped watchers`);
  };
}

function validateStringOrStringArray(config: Config[number], configIndex: number, configProperty: keyof Config[number], isOptional: boolean) {
  const value: void | string | string[] = config[configProperty];
  if (!value) {
    if (!isOptional) {
      throw new Error(`${PLUGIN_NAME}: config entry ${configProperty} is required, but for the entry at index ${configIndex} it was missing`);
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.some((p) => typeof p !== 'string')) {
      throw new Error(`${PLUGIN_NAME}: config entry path ${configProperty} must be a string or string array, but the entry at index ${configIndex} has an array containing something else`);
    }
    return;
  }

  if (typeof value !== 'string') {
    throw new Error(`${PLUGIN_NAME}: config entry path ${configProperty} must be a string or string array, but the entry at index ${configIndex} has a ${configProperty} with type ${typeof value}`);
  }
}

// NB: export default (as opposed to export =) does not work here with Serverless
export = ServerlessOfflineWatcherPlugin;

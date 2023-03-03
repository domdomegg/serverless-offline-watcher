# serverless-offline-watcher

Run arbitrary commands when files are changed while running serverless-offline

## Install

```
npm install --save-dev serverless-offline-watcher
```

## Usage

### Serverless configuration

Add it to your list of plugins, and custom config for what you want to do on files being changed.

The `path` property may be a string, or array of strings. They be file paths, directory paths or glob patterns. Under the hood this library uses [chokidar](https://github.com/paulmillr/chokidar) for file watching and [picomatch](https://github.com/micromatch/picomatch) for glob patterns, so you can see there documentation for more details about supported patterns.

The event type and the changed file path are available in environment variables `WATCHER_EVENT_TYPE` and `WATCHER_EVENT_PATH` respectively. The event type comes from chokidar and is one of `"add" | "addDir" | "change" | "unlink" | "unlinkDir"`.

serverless.yaml:

```yaml
plugins:
  - serverless-offline
  - serverless-offline-watcher

custom:
  serverless-offline-watcher:
    - path: src/index.ts
      command: echo "index.ts was modified!"
    - path:
        - src/api
        - src/cow/*.js
      command:
        - echo "api folder or js file in cow folder was modified!"
        - echo "the command-option can also be an array of commands"
    - path:
        - src/**/**
      # this prints for example "received change event for src/path/to/file.ts"
      command: "echo received $WATCHER_EVENT_TYPE event for $WATCHER_EVENT_PATH"
```

serverless.js / serverless.ts:

```ts
export default {
  plugins: [
    "serverless-offline",
    "serverless-offline-watcher",
  ],
  custom: {
    'serverless-offline-watcher': [
      {
        path: "src/index.ts",
        command: `echo "index.ts was modified!"`,
      },
      {
        path: ["src/api", "src/cow/*.js"],
        command: `echo "api folder or js file in cow folder was modified!"`,
      },
    ],
  },
}
```

In addition to running arbitrary shell commands, the plugin can also invoke a hook in some other
serverless plugin, with the `hook` option. The following will ask `serverless-offline` to
clear its Worker cache when a file in the `src` directory is changed:

```yaml
    - path:
        - src/**/*
      hook:
        - offline:functionsUpdated
```

### Running serverless-offline

Use `serverless offline start` instead of `serverless offline`, if you aren't already. This is necessary for serverless-offline to fire off `init` and `end` lifecycle hooks so that we can start and stop the watch server correctly.

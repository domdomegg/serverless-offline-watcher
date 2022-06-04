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
      command: echo "api folder or js file in cow folder was modified!"
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

### Running serverless-offline

Use `serverless offline start` instead of `serverless offline`, if you aren't already. This is necessary for serverless-offline to fire off `init` and `end` lifecycle hooks so that we can start and stop the watch server correctly.

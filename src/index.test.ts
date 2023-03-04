import type Serverless from 'serverless';
import { makeWatcher, Watcher } from './watcher';
import Plugin from './index';

jest.mock('../src/watcher');

const mockMakeWatcher = makeWatcher as jest.MockedFunction<typeof makeWatcher>;

test('serverless-offline-watcher', async () => {
  // given... a configuration and a mock of makeWatcher
  const serverlessMock = {
    service: {
      custom: {
        'serverless-offline-watcher': [
          {
            path: 'some/path',
            command: 'echo "hi"',
          },
          {
            path: 'other/path',
            command: [
              'echo "hi"',
            ],
            hook: [
              'test',
            ],
          },
        ],
        'some-other-plugin-that-should-not-interfere': {
          port: 2222,
        },
      },
    },
    cli: {
      log: jest.fn(),
    },
  } as unknown as Serverless;
  let s: Watcher | undefined;
  mockMakeWatcher.mockImplementation(() => {
    s = {
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
    };
    return s;
  });

  // when... we create a plugin
  const plugin = new Plugin(serverlessMock);

  // then... we have a mock watcher created
  expect(mockMakeWatcher).toHaveBeenCalledTimes(1);
  expect(mockMakeWatcher).toHaveBeenCalledWith(serverlessMock.service.custom['serverless-offline-watcher'], serverlessMock);

  // then... we provide init and end hooks
  expect(plugin.hooks).toHaveProperty('before:offline:start:init', expect.any(Function));
  expect(plugin.hooks).toHaveProperty('before:offline:start:end', expect.any(Function));
  expect(s?.start).not.toHaveBeenCalled();
  expect(s?.stop).not.toHaveBeenCalled();

  // when... we call the init hook
  await plugin.hooks['before:offline:start:init']?.();

  // then... the watcher is started
  expect(s?.start).toHaveBeenCalledTimes(1);
  expect(s?.stop).not.toHaveBeenCalled();

  // when... we call the end hook
  await plugin.hooks['before:offline:start:end']?.();

  // then... the server is closed
  expect(s?.start).toHaveBeenCalledTimes(1);
  expect(s?.stop).toHaveBeenCalledTimes(1);
});

'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {expect} = require('chai');
const io = require('socket.io-client');

const serverPath = path.join(__dirname, '..', '..', 'server', 'server.js');
const feederPath = path.join(__dirname, 'fakes', 'source-feeder.js');

const STATUS = 297;
const TIME_000001 = 296;

const children = [];
const sockets = [];

function startServer(env) {
  const {SOURCE, DATA_DIR, SNAPSHOT_SECONDS, ...inherited} = process.env;
  const child = childProcess.spawn(process.execPath, ['-r', feederPath, serverPath], {
    env: {...inherited, PORT: '0', SOURCE: 'none', ...env},
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  children.push(child);
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({code, signal})));
  return new Promise((resolve, reject) => {
    let output = '';
    child.once('exit', code => reject(new Error('server exited with ' + code + ': ' + output)));
    child.stderr.on('data', chunk => {
      output += chunk;
    });
    child.stdout.on('data', chunk => {
      output += chunk;
      const listening = /port: (\d+)/.exec(output);
      if (listening) {
        resolve({child, exited, url: 'http://localhost:' + listening[1]});
      }
    });
  });
}

function feed(child, records) {
  return new Promise(resolve => {
    child.once('message', resolve);
    child.send(records);
  });
}

function nextMessage(socket, channel) {
  return new Promise(resolve => socket.once(channel, resolve));
}

async function connect(url) {
  const socket = io(url, {forceNew: true});
  sockets.push(socket);
  const status = await nextMessage(socket, STATUS);
  return {socket, status};
}

async function subscribe(url, channel, intervalAgo, count) {
  const {socket} = await connect(url);
  const reply = nextMessage(socket, channel);
  socket.emit(channel, intervalAgo, count);
  return reply;
}

function snapshotHolding(file, channel) {
  const holds = () => {
    try {
      return channel in JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      return false;
    }
  };
  return new Promise(resolve => {
    const watcher = fs.watch(path.dirname(file), () => {
      if (holds()) {
        watcher.close();
        resolve();
      }
    });
    if (holds()) {
      watcher.close();
      resolve();
    }
  });
}

describe('server restart', function () {
  this.timeout(10000);
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-restart-'));
  });

  afterEach(() => {
    sockets.splice(0).forEach(socket => socket.disconnect());
    children.splice(0).forEach(child => child.kill('SIGKILL'));
    fs.rmSync(dataDir, {recursive: true, force: true});
  });

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    it(`serves the records it held before ${signal} after a restart`, async () => {
      const first = await startServer({DATA_DIR: dataDir});
      await feed(first.child, [
        {k: 20, v: 1, cv: '1', t: 1789211880, s: 24, sid: 1},
        {k: 20, v: 2, cv: '2', t: 1789211890, s: 24, sid: 1}
      ]);
      first.child.kill(signal);
      await first.exited;

      const second = await startServer({DATA_DIR: dataDir});
      const reply = await subscribe(second.url, 20, 0, 150);

      expect(reply.map(record => [record.v, record.t])).to.deep.equal([[1, 1789211880], [2, 1789211890]]);
    });
  });

  it('replaces the snapshot file rather than writing into it on SIGTERM', async () => {
    const file = path.join(dataDir, 'buffer.json');
    fs.writeFileSync(file, '{}');
    const replaced = fs.statSync(file).ino;
    const {child, exited} = await startServer({DATA_DIR: dataDir});

    child.kill('SIGTERM');
    await exited;

    expect(fs.statSync(file).ino).to.not.equal(replaced);
  });

  [['SIGINT', 130], ['SIGTERM', 143]].forEach(([signal, code]) => {
    it(`exits with code ${code} on ${signal}`, async () => {
      const {child, exited} = await startServer({DATA_DIR: dataDir});

      child.kill(signal);

      expect((await exited).code).to.equal(code);
    });
  });

  it('serves the records of its last periodic snapshot after being killed', async () => {
    const first = await startServer({DATA_DIR: dataDir, SNAPSHOT_SECONDS: '0.1'});
    await feed(first.child, [{k: 237, v: 23.26, cv: '23.26', t: 1789211895, s: 24, sid: 1}]);
    await snapshotHolding(path.join(dataDir, 'buffer.json'), 237);
    first.child.kill('SIGKILL');
    await first.exited;

    const second = await startServer({DATA_DIR: dataDir});
    const reply = await subscribe(second.url, 237, 0, 150);

    expect(reply.map(record => [record.v, record.t])).to.deep.equal([[23.26, 1789211895]]);
  });

  it('sends STATUS disconnected on connection after a restart while connected', async () => {
    const first = await startServer({DATA_DIR: dataDir});
    await feed(first.child, [{k: TIME_000001, v: 1789211888, cv: '1789211888', t: 1789211888, s: 24, sid: 1}]);
    first.child.kill('SIGTERM');
    await first.exited;

    const second = await startServer({DATA_DIR: dataDir});
    const {status} = await connect(second.url);

    expect(status.map(record => [record.v, record.s])).to.deep.equal([[0, 2]]);
  });

  it('sends STATUS disconnected on connection when started with no snapshot and no source', async () => {
    const {url} = await startServer({DATA_DIR: dataDir});

    const {status} = await connect(url);

    expect(status.map(record => [record.v, record.s])).to.deep.equal([[0, 2]]);
  });
});

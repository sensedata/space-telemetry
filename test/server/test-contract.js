'use strict';

// The surface the client bundle in public/index.js depends on; the bundle cannot be rebuilt.

const Module = require('module');
const path = require('path');
const {expect} = require('chai');
const {mock} = require('node:test');
const io = require('socket.io-client');

const createFakeLightstreamer = require('./fakes/lightstreamer-client');

const serverDir = path.join(__dirname, '..', '..', 'server');
const dd = require(path.join(serverDir, 'data_dictionary'));

const STATUS = 297;
const TIME_000001 = 296;

const feed = createFakeLightstreamer();
let serverUrl;
let serverIo;
const savedEnv = {};
const sockets = [];

function installModule(filename, exports) {
  const module = new Module(filename);
  module.filename = filename;
  module.exports = exports;
  module.loaded = true;
  require.cache[filename] = module;
}

function nowSeconds() {
  return Date.now() / 1000 | 0;
}

// The ISS feed's TimeStamp counts decimal hours from 00:00 UTC on 1 January of the current
// year, starting at 24. Half a second keeps the server's truncation on the intended second.
function feedTimestamp(unixSeconds) {
  const yearStart = Date.UTC(new Date().getUTCFullYear(), 0) / 1000;
  return String((unixSeconds - yearStart + 0.5) / 3600 + 24);
}

function feedTelemetry(channel, unixSeconds, value, statusClass) {
  feed.update(dd.list[channel], {
    TimeStamp: feedTimestamp(unixSeconds),
    Value: value,
    'Status.Class': statusClass,
    CalibratedData: value
  });
}

function feedTime() {
  feedTelemetry(TIME_000001, nowSeconds(), '0', '24');
}

function nextMessage(socket, channel) {
  return new Promise(resolve => socket.once(channel, resolve));
}

async function connect() {
  const socket = io(serverUrl, {forceNew: true});
  sockets.push(socket);
  const status = await nextMessage(socket, STATUS);
  return {socket, status};
}

async function subscribe(channel, intervalAgo, count) {
  const {socket} = await connect();
  const reply = nextMessage(socket, channel);
  socket.emit(channel, intervalAgo, count);
  return reply;
}

describe('socket.io contract', () => {
  before(done => {
    savedEnv.PORT = process.env.PORT;
    savedEnv.SOURCE = process.env.SOURCE;
    process.env.PORT = '0';
    delete process.env.SOURCE;

    mock.timers.enable({apis: ['setTimeout', 'Date'], now: Date.now()});

    installModule(require.resolve('lightstreamer-client', {paths: [serverDir]}), feed.module);
    const server = require(path.join(serverDir, 'server'));

    serverIo = server.io;
    const listening = () => {
      serverUrl = `http://localhost:${server.server.address().port}`;
      feedTime();
      done();
    };
    if (server.server.listening) {
      listening();
    } else {
      server.server.once('listening', listening);
    }
  });

  afterEach(() => {
    sockets.splice(0).forEach(socket => socket.disconnect());
  });

  after(() => {
    serverIo.close();
    mock.timers.reset();
    Object.keys(savedEnv).forEach(name => {
      if (savedEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = savedEnv[name];
      }
    });
  });

  describe('subscription', () => {
    it('replies on the channel number with the records in ascending time order', async () => {
      const now = nowSeconds();
      feedTelemetry(20, now - 10, '3', '24');
      feedTelemetry(20, now - 100, '1', '24');
      feedTelemetry(20, now - 50, '2', '24');

      const reply = await subscribe(20, 450, 150);

      expect(reply.map(record => record.t)).to.deep.equal([now - 100, now - 50, now - 10]);
    });

    it('leaves out records older than intervalAgo seconds', async () => {
      const now = nowSeconds();
      feedTelemetry(21, now - 500, '1', '24');
      feedTelemetry(21, now - 400, '2', '24');

      const reply = await subscribe(21, 450, 150);

      expect(reply.map(record => record.t)).to.deep.equal([now - 400]);
    });

    it('replies with at most count records, the latest ones', async () => {
      const now = nowSeconds();
      feedTelemetry(22, now - 30, '1', '24');
      feedTelemetry(22, now - 20, '2', '24');
      feedTelemetry(22, now - 10, '3', '24');

      const reply = await subscribe(22, 450, 2);

      expect(reply.map(record => record.t)).to.deep.equal([now - 20, now - 10]);
    });

    it('replies with the single latest record when the window is empty', async () => {
      const now = nowSeconds();
      feedTelemetry(23, now - 1000, '1', '24');
      feedTelemetry(23, now - 900, '2', '24');

      const reply = await subscribe(23, 450, 150);

      expect(reply.map(record => [record.t, record.v])).to.deep.equal([[now - 900, 2]]);
    });

    it('replies with the single latest record when count is -1', async () => {
      const now = nowSeconds();
      feedTelemetry(24, now - 20, '1', '24');
      feedTelemetry(24, now - 10, '2', '24');

      const reply = await subscribe(24, null, -1);

      expect(reply.map(record => [record.t, record.v])).to.deep.equal([[now - 10, 2]]);
    });
  });

  describe('record shape', () => {
    it('sends backfill records with exactly the fields k, v, t, s, lm, ld, vc, vm, vd', async () => {
      feedTelemetry(30, nowSeconds() - 10, '1.5', '24');

      const [record] = await subscribe(30, 450, 150);

      expect(Object.keys(record).sort()).to.deep.equal(
        ['k', 'ld', 'lm', 's', 't', 'v', 'vc', 'vd', 'vm']);
    });

    it('sends live records with exactly the fields k, v, t, s, lm, ld, vc, vm, vd', async () => {
      const {socket} = await connect();
      const message = nextMessage(socket, 31);

      feedTelemetry(31, nowSeconds(), '1.5', '24');
      const [record] = await message;

      expect(Object.keys(record).sort()).to.deep.equal(
        ['k', 'ld', 'lm', 's', 't', 'v', 'vc', 'vd', 'vm']);
    });

    it('carries the channel number, value, unix time and status class of the feed update', async () => {
      const now = nowSeconds();
      feedTelemetry(32, now - 10, '-12.25', '17');

      const [record] = await subscribe(32, 450, 150);

      expect([record.k, record.v, record.t, record.s]).to.deep.equal([32, -12.25, now - 10, 17]);
    });

    it('sends backfill records with vm, the mean of the values the channel holds', async () => {
      const now = nowSeconds();
      feedTelemetry(33, now - 30, '1', '24');
      feedTelemetry(33, now - 20, '2', '24');
      feedTelemetry(33, now - 10, '6', '24');

      const reply = await subscribe(33, 450, 150);

      expect(reply.map(record => record.vm)).to.deep.equal([3, 3, 3]);
    });

    it('sends live records with vm, the mean of the values the channel holds', async () => {
      feedTelemetry(34, nowSeconds() - 10, '2', '24');
      const {socket} = await connect();
      const message = nextMessage(socket, 34);

      feedTelemetry(34, nowSeconds(), '4', '24');
      const [record] = await message;

      expect(record.vm).to.equal(3);
    });

    it('sends vm as the mean of the numeric values when the feed sends an empty Value', async () => {
      const now = nowSeconds();
      feedTelemetry(35, now - 30, '2', '24');
      feedTelemetry(35, now - 20, '', '24');
      feedTelemetry(35, now - 10, '4', '24');

      const reply = await subscribe(35, 450, 150);

      expect(reply.map(record => record.vm)).to.deep.equal([3, 3, 3]);
    });
  });

  describe('status channel', () => {
    it('sends STATUS connected on connection while TIME_000001 is updating', async () => {
      feedTime();

      const {status} = await connect();

      expect(status.map(record => [record.k, record.v, record.s])).to.deep.equal([['297', 1, 24]]);
    });

    it('sends STATUS disconnected on connection once TIME_000001 has stopped', async () => {
      feedTime();
      mock.timers.tick(10000);

      const {status} = await connect();

      expect(status.map(record => [record.v, record.s])).to.deep.equal([[0, 2]]);
    });

    it('sends STATUS disconnected to connected sockets after 10 seconds without TIME_000001', async () => {
      feedTime();
      const {socket} = await connect();
      const message = nextMessage(socket, STATUS);

      mock.timers.tick(10000);

      expect((await message).map(record => [record.k, record.v, record.s]))
        .to.deep.equal([['297', 0, 2]]);
    });

    it('sends STATUS connected to connected sockets when TIME_000001 resumes', async () => {
      feedTime();
      mock.timers.tick(10000);
      const {socket} = await connect();
      const message = nextMessage(socket, STATUS);

      feedTime();

      expect((await message).map(record => [record.v, record.s])).to.deep.equal([[1, 24]]);
    });
  });

  describe('rss feed', () => {
    it('reports STATUS Connected once TIME_000001 resumes', async () => {
      feedTime();
      mock.timers.tick(10000);
      feedTime();

      const response = await fetch(serverUrl + '/rss.xml');

      expect(await response.text()).to.include('STATUS: Connected');
    });
  });

  describe('static files', () => {
    ['/', '/index.js'].forEach(file => {
      it(`serves ${file} cacheable for five minutes`, async () => {
        const response = await fetch(serverUrl + file);

        expect([response.status, response.headers.get('cache-control')])
          .to.deep.equal([200, 'public, max-age=300']);
      });
    });

    // fetch adds cache-control: no-cache to a conditional request, which forbids a 304, so
    // this request goes through http as a browser reload sends it.
    it('answers a conditional request with 304 and keeps serving', async () => {
      const first = await fetch(serverUrl + '/index.js');
      const conditional = await new Promise((resolve, reject) => {
        require('http').get(serverUrl + '/index.js', {
          headers: {'if-modified-since': first.headers.get('last-modified')}
        }, response => {
          response.resume();
          resolve(response.statusCode);
        }).on('error', reject);
      });
      const again = await fetch(serverUrl + '/');

      expect([conditional, again.status]).to.deep.equal([304, 200]);
    });
  });

  describe('live fan-out', () => {
    it('sends an ingested record to every connected socket on its channel number', async () => {
      const now = nowSeconds();
      const first = await connect();
      const second = await connect();
      const messages = Promise.all([
        nextMessage(first.socket, 40),
        nextMessage(second.socket, 40)
      ]);

      feedTelemetry(40, now, '7.5', '24');

      const received = (await messages).map(([record]) => [record.k, record.v, record.t, record.s]);
      expect(received).to.deep.equal([[40, 7.5, now, 24], [40, 7.5, now, 24]]);
    });
  });
});

'use strict';

// The surface the client bundle in public/index.js depends on; the bundle cannot be rebuilt.

const Module = require('module');
const path = require('path');
const {expect} = require('chai');
const {mock} = require('node:test');
const io = require('socket.io-client');

const createFakeLightstreamer = require('./fakes/lightstreamer-client');
const {groups} = require('./fixtures/contract-rows.json');

const serverDir = path.join(__dirname, '..', '..', 'server');

const STATUS = 297;

const captured = Object.fromEntries(groups.map(({rows}) => [rows[0].item, rows]));
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

// The subscription window counts back from now, so the row is fed stamped `unixSeconds`
// rather than its recorded time.
function feedRow(row, unixSeconds) {
  feed.update(row.item, {
    TimeStamp: feedTimestamp(unixSeconds),
    Value: row.value,
    'Status.Class': String(row.status),
    CalibratedData: row.value_calibrated
  });
}

function feedTime() {
  feedRow(captured.TIME_000001[0], nowSeconds());
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
      const [first, second, third] = captured.AIRLOCK000021;
      feedRow(third, now - 10);
      feedRow(first, now - 100);
      feedRow(second, now - 50);

      const reply = await subscribe(20, 450, 150);

      expect(reply.map(record => record.t)).to.deep.equal([now - 100, now - 50, now - 10]);
    });

    it('leaves out records older than intervalAgo seconds', async () => {
      const now = nowSeconds();
      const [older, newer] = captured.AIRLOCK000022;
      feedRow(older, now - 500);
      feedRow(newer, now - 400);

      const reply = await subscribe(21, 450, 150);

      expect(reply.map(record => record.t)).to.deep.equal([now - 400]);
    });

    it('replies with at most count records, the latest ones', async () => {
      const now = nowSeconds();
      const [first, second, third] = captured.AIRLOCK000023;
      feedRow(first, now - 30);
      feedRow(second, now - 20);
      feedRow(third, now - 10);

      const reply = await subscribe(22, 450, 2);

      expect(reply.map(record => record.t)).to.deep.equal([now - 20, now - 10]);
    });

    it('replies with the single latest record when the window is empty', async () => {
      const now = nowSeconds();
      const [older, newer] = captured.AIRLOCK000024;
      feedRow(older, now - 1000);
      feedRow(newer, now - 900);

      const reply = await subscribe(23, 450, 150);

      expect(reply.map(record => [record.t, record.v])).to.deep.equal([[now - 900, 0]]);
    });

    it('replies with the single latest record when count is -1', async () => {
      const now = nowSeconds();
      const [older, newer] = captured.AIRLOCK000025;
      feedRow(older, now - 20);
      feedRow(newer, now - 10);

      const reply = await subscribe(24, null, -1);

      expect(reply.map(record => [record.t, record.v])).to.deep.equal([[now - 10, 0]]);
    });
  });

  describe('record shape', () => {
    it('sends backfill records with exactly the fields k, v, t, s, lm, ld, vc, vm, vd', async () => {
      feedRow(captured.AIRLOCK000031[1], nowSeconds() - 10);

      const [record] = await subscribe(30, 450, 150);

      expect(Object.keys(record).sort()).to.deep.equal(
        ['k', 'ld', 'lm', 's', 't', 'v', 'vc', 'vd', 'vm']);
    });

    it('sends live records with exactly the fields k, v, t, s, lm, ld, vc, vm, vd', async () => {
      const {socket} = await connect();
      const message = nextMessage(socket, 31);

      feedRow(captured.AIRLOCK000032[1], nowSeconds());
      const [record] = await message;

      expect(Object.keys(record).sort()).to.deep.equal(
        ['k', 'ld', 'lm', 's', 't', 'v', 'vc', 'vd', 'vm']);
    });

    it('carries the channel number, value, unix time and status class of the feed update', async () => {
      const now = nowSeconds();
      const [, , resend] = captured.NODE3000009;
      feedRow(resend, now - 10);

      const [record] = await subscribe(75, 450, 150);

      expect([record.k, record.v, record.t, record.s]).to.deep.equal(
        [75, 87.87999725341797, now - 10, 9]);
    });

    it('sends backfill records with vm, the mean of the values the channel holds', async () => {
      const now = nowSeconds();
      const [first, second, third] = captured.USLAB000084;
      feedRow(first, now - 30);
      feedRow(second, now - 20);
      feedRow(third, now - 10);

      const reply = await subscribe(262, 450, 150);

      expect(reply.map(record => record.vm)).to.deep.equal([1473247103, 1473247103, 1473247103]);
    });

    it('sends live records with vm, the mean of the values the channel holds', async () => {
      const [held, live] = captured.Z1000013;
      feedRow(held, nowSeconds() - 10);
      const {socket} = await connect();
      const message = nextMessage(socket, 293);

      feedRow(live, nowSeconds());
      const [record] = await message;

      expect(record.vm).to.equal(0.5);
    });

    it('sends vm as the mean of the numeric values when the feed sends an empty Value', async () => {
      const now = nowSeconds();
      const [first, second, , fourth] = captured.USLAB000043;
      feedRow(first, now - 30);
      // Estimated: no captured row has an empty Value.
      feedRow({...second, value: ''}, now - 20);
      feedRow(fourth, now - 10);

      const reply = await subscribe(221, 450, 150);

      expect(reply.map(record => record.vm)).to.deep.equal([7.5, 7.5, 7.5]);
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

      feedRow(captured.AIRLOCK000041[1], now);

      const received = (await messages).map(([record]) => [record.k, record.v, record.t, record.s]);
      expect(received).to.deep.equal([[40, 0, now, 24], [40, 0, now, 24]]);
    });
  });
});

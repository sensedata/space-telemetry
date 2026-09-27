'use strict';

const path = require('path');
const {expect} = require('chai');

const feedTimeToUnix = require(path.join(__dirname, '..', '..', 'server', 'feed-time-to-unix'));

// The conversion subtracts 24 from the feed's hour count and counts from 1 January of the
// year the server's clock is in, whatever year the feed means. These cases pin that
// arithmetic as it stands, including where it is suspect.
describe('feedTimeToUnix', () => {
  [
    {
      name: 'reads hour 24 as midnight on 1 January',
      hours: 24, now: '2026-01-01T00:00:05Z', unix: 1767225600
    },
    {
      name: 'reads half an hour past hour 24 as 00:30 on 1 January',
      hours: 24.5, now: '2026-01-01T00:31:00Z', unix: 1767227400
    },
    {
      name: 'reads an hour count below 24 as a time in the previous year',
      hours: 0.5, now: '2026-01-01T00:31:00Z', unix: 1767141000
    },
    {
      name: 'reads a mid-September hour count as that day and time',
      hours: 24 + 256 * 24 + 12.25, now: '2026-09-14T12:15:30Z', unix: 1789388100
    },
    {
      name: 'truncates a fraction of a second',
      hours: 24.0004, now: '2026-01-01T00:00:05Z', unix: 1767225601
    },
    {
      name: 'counts from the clock year when the feed is still in the previous year',
      hours: 24 + 364 * 24 + 23.75, now: '2027-01-01T00:00:10Z', unix: 1830296700
    }
  ].forEach(row => {
    it(row.name, () => {
      expect(feedTimeToUnix(row.hours, new Date(row.now))).to.equal(row.unix);
    });
  });
});

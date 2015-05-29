# Space Telemetry
This is the source code for <http://www.telemetry.space>. We maintain a Trello
board to track what we're thinking about and working on at
<https://trello.com/b/0c4U0mDg/space-telemetry>.

We welcome pull requests here on GitHub and your ideas over on the
[Trello board](https://trello.com/b/0c4U0mDg/space-telemetry).
Below are the instructions for getting a copy of the source code
setup for development on your computer.

If you have any issues with getting these instructions to work for you, let us know on
[Trello](https://trello.com/b/0c4U0mDg/space-telemetry).

# Automation Status

| Continuous Integration | [![Build Status](https://travis-ci.org/sensedata/space-telemetry.svg?branch=develop)](https://travis-ci.org/sensedata/space-telemetry) |
| --- | --- |
| __Code Review__            | [![Code Climate](https://codeclimate.com/repos/553139d36956806f0b001dd9/badges/0ead9acc990a25b578ff/gpa.svg)](https://codeclimate.com/repos/553139d36956806f0b001dd9/feed) |
| __Testing__ | [![Test Coverage](https://codeclimate.com/repos/553139d36956806f0b001dd9/badges/0ead9acc990a25b578ff/coverage.svg)](https://codeclimate.com/repos/553139d36956806f0b001dd9/coverage) |


# Prerequisites for Development
## Linux

_TBD: if you set this up on Linux, please let us know what else you had to do
or just write it into this README.md and send a pull request._


## Mac

### XCode

Install Xcode <http://developer.apple.com/xcode/> and it's command line tools.


## Windows
_TBD: if you set this up on Windows, please let us know what else you had to do
or just write it into this README.md and send a pull request._


# Development Setup
## io.js

Install io.js from: <https://iojs.org> and Foreman to run the application in the same manner as Heroku, more at <http://strongloop.github.io/node-foreman/>:

        $ npm install foreman --global

## PostgreSQL:

1. Download and install 9.4.x, e.g., <http://postgresapp.com>.
2. Be sure to set your PATH to use the binaries in Postgres.app if using it.
3. Setup a user and two databases in PostgreSQL (the names can be changed if
you like):

        $ createuser --echo --createdb --no-createrole --no-superuser --pwprompt --encrypted space_telemetry_app
        $ createdb --echo --encoding=utf-8 --owner=space_telemetry_app space_telemetry_dev
        $ createdb --echo --encoding=utf-8 --owner=space_telemetry_app space_telemetry_test

4. Run each of the SQL files found in db in order by file name, for example:

        $ psql --dbname space_telemetry_dev --user space_telemetry_app --file db/ddl-001.sql --password
        $ psql --dbname space_telemetry_dev --user space_telemetry_app --file db/ddl-002.sql --password
        $ psql --dbname space_telemetry_dev --user space_telemetry_app --file db/ddl-003.sql --password
        $ psql --dbname space_telemetry_dev --user space_telemetry_app --file db/ddl-004.sql --password

5. Run each of the SQL files found in db in order by file name, this time for
the test DB, for example:

        $ psql --dbname space_telemetry_test --user space_telemetry_app --file db/ddl-001.sql --password

        $ etc…


## Space Telemetry

1. Checkout the "develop" branch.

        $ git checkout develop

2. Copy .env.example to .env _and_ .env.test and change the values as
appropriate, e.g., replace MY_USER, MY_PASSWORD, and MY_DATABASE to those you used above.

3. Install all the libraries and tools:

        $ npm install


## Run Locally
Foreman starts web processes on port 5000; this cannot be changed until a bug
in the node version of Foreman is fixed:
<https://github.com/strongloop/node-foreman/issues/69>

    $ nf start

To automatically recompile the client files whenever you save changes to them,
keep the following running:

    $ npm run-script webpack -- --watch

Omit the watch flag to compile only once.

To run all the tests and generate code coverage (reported in detail in `coverage/lcov-report/index.html`):

    $ npm test


# Making a Great Pull Request
1. Familiarize yourself with GitHub pull requests: <https://help.github.com/articles/using-pull-requests/>

2. Fork this repository.

3. Create a topic branch (in your fork) from the tip of develop for your current work, for
example:

        $ git checkout -b add-some-fancy-feature

4. Add tests to test/client or test/server for all your changes and use the coverage report to hunt for any dead code or missing tests.

5. Write code that passes the jshint and jscs rules:

        $ npm run-script jscs
        $ npm run-script jshint

6. Send a pull request!

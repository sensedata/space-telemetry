import _ from "lodash";
import jsdom from "jsdom";

beforeEach("setup DOM", (done) => {
  jsdom.env("<!doctype html><html><body></body></html>", (e, window) => {
    Object.assign(global, _.pick(window, "document", "navigator"));
    global.window = window;
    window.console = global.console;
    document.body.dataset = {};

    done();
  });
});

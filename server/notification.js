var slack = require('slack-notify')(process.env.SLACK_WEBHOOK_URL);

var utils = require('./utils');

var isProductionEnv = utils.isProductionEnv();

slack.onError = function (err) {

  console.error('Slack Webhook Error:', err);
};

slack.error = slack.extend({
  channel: '#automation',
  icon_emoji: ':bomb:',
  username: 'iss.telemetry.space-error'
});

slack.info = slack.extend({
  channel: '#automation',
  icon_emoji: ':rocket:',
  username: 'iss.telemetry.space-info'
});


exports.error = function (error) {

  var fields = {
    Time: (new Date()).toUTCString()
  };

  if (!(error instanceof Error)) {

    fields.Message = error;

  } else if (error.stack) {

    fields.Stack = error.stack;

  } else {

    fields.Name = error.name || 'N/A';
    fields.Message = error.message || 'N/A';
  }

  if (isProductionEnv) {

    slack.error({
      fallback: fields.Message,
      fields: fields
    });
  }

  return fields;
};

exports.info = function (info) {

  var fields = {
    Time: (new Date()).toUTCString(),
    Message: info
  };

  if (isProductionEnv) {

    slack.info({

      fallback: fields.Message,
      fields: fields
    });
  }

  return fields;
};

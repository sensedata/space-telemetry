import _ from "lodash";
import React from "react";

import ListeningView from "../listening_view.js";

class DecimalReadout extends ListeningView {
  render() {
    let raw;

    if (typeof this.state.data === "undefined" || this.state.data.length === 0) {
      return this.wrap("-", "");
    }

    if (typeof this.props.quaternionId !== "undefined") {
      raw = this.state.data[0][this.props.eulerAxis];

    } else if (this.state.data.length > 1) {
      raw = _.max(this.state.data, "t").v;

    } else {
      raw = this.state.data[0].v;
    }

    // HACK parseFloat should not be required here, but both ES6 (Babel) and
    // lodash isFinite return false for the literal 1234.
    if (!Number.isFinite(parseFloat(raw))) {
      return this.wrap("-", raw);
    }

    let formatted;
    if (typeof this.props.conversion !== "undefined") {
      formatted = raw * parseFloat(this.props.conversion);
    }

    if (typeof this.props.scale !== "undefined") {
      formatted = raw.toFixed(this.props.scale);

    } else {
      formatted = raw.toString();
    }

    if (typeof this.props.precision !== "undefined") {
      const integer = parseInt(formatted);
      const padded = _.padLeft(integer, this.props.precision, "0");
      formatted = formatted.replace(new RegExp("^" + integer), padded);
    }

    if (this.props.negativePad === "true") {
      formatted = formatted.replace(/^([^\-])/, "\u00A0$1");
    }

    return this.wrap(formatted, raw);
  }

  wrap(formatted, raw) {
    return <span data-raw={raw}>{formatted}</span>;
  }
}

export {DecimalReadout as default};

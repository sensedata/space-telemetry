import _ from "lodash";
import Moment from "moment";

import ListeningView from "../listening_view.js";

class HistoricalMicrochart extends ListeningView {
  constructor(props) {
    super(props);

    this.lastUpdate = 0;
    this.state = {data: []};
    this.secondsPerPoint = 3;
    this.availablePoints = Math.floor(props.width / this.secondsPerPoint);
  }

  earliestAcceptable() {
    return Moment().unix() - this.availablePoints;
  }

  // Setup a record with a time equal to the left edge of the chart, so
  // there's always a bar at the "start".
  ensureLeftPoint(data) {
    const earliest = this.earliestAcceptable();
    let starter = _.findLast(data, d => {return d.t <= earliest;});
    if (!starter) {
      starter = Object.assign({}, _.first(data));
      data.unshift(starter);
    }
    starter.t = earliest;
  }

  // Since points are only provided when a change occurs, and not every time
  // the instrument transmits a value: synthesize a current point if the
  // newest is old.
  ensureRightPoint(data) {
    const now = Moment().unix();
    const newest = _.last(data, "t");
    if (now - newest.t > 2) {
      data.push(Object.assign({}, newest, {t: now}));
    }
  }

  storeChanged() {
    const data = this.getStoreState().data.slice();
    this.ensureLeftPoint(data);
    this.ensureRightPoint(data);
    this.setState({data: data});
  }
}

export {HistoricalMicrochart as default};

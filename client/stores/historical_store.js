import Crossfilter from "crossfilter";
import {Store} from "flummox";

class HistoricalStore extends Store {

  constructor(action, props) {
    super();

    this.props = props;
    this.crossfilter = Crossfilter();
    this.indexDimension = this.crossfilter.dimension(d => {return d.i;});
    this.timeDimension = this.crossfilter.dimension(d => {return d.t;});

    this.state = {size: 0};

    this.register(action, this.update);
  }

  update(data) {
    let newSize = this.crossfilter.size();
    this.crossfilter.add(
      data.map(d => {return Object.assign({i: newSize++}, d);})
    );
    this.prune();

    this.setState({size: this.crossfilter.size()});
  }

  get(maxPoints, earliestTime) {
    if (typeof earliestTime !== "undefined") {
      this.timeDimension.filter(t => {return t >= earliestTime;});
    }
    const top = this.timeDimension.top(maxPoints || 1);

    this.timeDimension.filterAll();
    return top;
  }

  prune() {
    this.indexDimension.filter(i => {
      return i < this.crossfilter.size() - this.props.maxSize;
    });
    this.indexDimension.remove();
    this.indexDimension.filterAll();
  }
}

export {HistoricalStore as default};

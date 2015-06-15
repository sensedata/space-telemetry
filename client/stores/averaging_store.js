import CombiningStore from "./combining_store";

class AveragingStore extends CombiningStore {

  update(data) {
    super.update(data, r => {
      return {k: r.keys, v: r.sv / r.n, vm: r.svm / r.n, t: r.t};
    });
  }
}

export {AveragingStore as default};

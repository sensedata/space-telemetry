import CombiningStore from "./combining_store";

class SummingStore extends CombiningStore {

  update(data) {
    super.update(data, r => {
      return {k: r.keys, v: r.sv, vm: r.svm, t: r.t};
    });
  }
}

export {SummingStore as default};

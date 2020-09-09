function Observable() {
    this.observers = [];
}
Observable.prototype.subscribe = function(f) {
    this.observers.push(f)
}
Observable.prototype.unsubscribe = function(f) {
    this.observers = this.observers.filter(subscriber => subscriber !== f);
}
Observable.prototype.notify = function(data) {
    this.observers.forEach(observer => observer(data));
}
const switchPhoto360Observable = new Observable();
const rotationObservable = new Observable();
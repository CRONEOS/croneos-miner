var events = require('events');

class Base_Stream_Provider {

    constructor() {
      if (this.constructor == Base_Stream_Provider) {
        throw new Error("Can't initiate an abstract class!");
      }
      this.emitter = new events.EventEmitter();
    }
  
    insert(x) {
      console.log('[stream] received','INS'.green, 'operation');
      this.emitter.emit('insert', x);
    }

    remove(x) {
      console.log('[stream] received','REM'.red, 'operation');
      this.emitter.emit('remove', x);
    }
  
}

module.exports = {
    Base_Stream_Provider
};
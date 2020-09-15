const CONF = require('../../miner_config.json');
var events = require('events');

class Base_Stream_Provider {

    constructor(provider_name) {
      if (this.constructor == Base_Stream_Provider) {
        throw new Error("Can't initiate an abstract class!");
      }
      this.name = provider_name;
      this.check_if_provider_has_required_name();
      this.emitter = new events.EventEmitter();
    }

    insert(x) {
      console.log('[stream] received','INS'.green, 'operation');

      if(this.gas_threshold_met(x.gas_fee) ){
        this.emitter.emit('insert', x);
      }
      else{
        console.log('[JOB]','ignore'.yellow, 'not enough gas');
      }

    }

    remove(x) {
      console.log('[stream] received','REM'.red, 'operation');
      this.emitter.emit('remove', x);
    }

    check_if_provider_has_required_name(){
      if(!this.name || typeof this.name != "string" || this.name.length < 1){
        throw new Error("Can't initialize a provider without name! Please pass in a string() name in to the super constructor.");
      }
      else{
        console.log(`Initialized Stream Provider ${this.name}`)
      }
    }

    gas_threshold_met(gas_fee){
      let test = true;
      if(CONF.gas_thresholds){
        let [amount, symbol] = gas_fee.split(' ');
        let threshold = CONF.gas_thresholds[symbol];
        if(threshold !== undefined){
          test = Number(amount) >= Number(threshold);
          //console.log(Number(amount), ">=", Number(threshold))
        }
      }
      return test;

    }
  
}

module.exports = {
    Base_Stream_Provider
};
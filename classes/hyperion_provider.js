
const CONF = require('../miner_config.json');
const {Base_Stream_Provider} = require('./abstract/Base_Stream_Provider');

const HyperionSocketClient = require('@eosrio/hyperion-stream-client').default;



class hyperion_provider extends Base_Stream_Provider{

    constructor(){
        super("HYPERION");
        this.endpoints= ["https://api.eossweden.org/"];
        this.client = new HyperionSocketClient(this.endpoints[0], {async: true});
        console.log(this.client)
        
        this.main();
    }


    async main() {

      this.client.onConnect = () => {
        this.client.streamDeltas({
          code: 'croncron1111',
          table: 'cronjobs',
          scope: 'croncron1111',
          payer: '',
          start_from: 0,
          read_until: 0,
        });
      }
      
      // see 3 for handling data
      this.client.onData = async (data, ack) => {
          console.log(data); // process incoming data, replace with your code
          ack(); // ACK when done
      }
      
      this.client.connect(() => {
        console.log('connected!');
      });

    }


}

new hyperion_provider();

/*
module.exports = {
  polling_provider
};

*/
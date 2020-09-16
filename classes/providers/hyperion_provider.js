const CONF = require('../../miner_config.json');
const { Base_Stream_Provider } = require('../abstract/Base_Stream_Provider');
const HyperionSocketClient = require('@eosrio/hyperion-stream-client').default;
const options = CONF.provider_options.hyperion_provider

class hyperion_provider extends Base_Stream_Provider {

  constructor() {
    super("HYPERION");
    this.endpoints = [options.endpoint]
    this.client = new HyperionSocketClient(options.endpoint, { async: true });
    //console.log(this.client)

    this.main();
  }

  async main () {

    this.client.onConnect = () => {
      this.client.streamDeltas({
        code: CONF.croneos_contract,
        table: CONF.scope,
        scope: 'cron.eos',
        payer: '',
        start_from: 0,
        read_until: 0,
      });
    }

    this.client.onData = async (res, ack) => {

      if(res.type == "delta") {
        if(res.content.present === false) {
          this.remove(res.content.data);
        } else {
          res.content.data.due_date = res.content.data.due_date.split(".")[0];
          this.insert(res.content.data);
        }
      }
      ack(); // ACK when done
    }
    this.client.connect(() => {
      console.log('connected!');
    });
  }
}

module.exports = hyperion_provider

const CONF = require('../../miner_config.json');
const {Base_Stream_Provider} = require('../abstract/Base_Stream_Provider');
const HyperionSocketClient = require('@eosrio/hyperion-stream-client').default;


class hyperion_provider extends Base_Stream_Provider{

    constructor(){
        super("HYPERION");
        this.endpoints= ["http://api.eossweden.org"];
        this.client = new HyperionSocketClient(this.endpoints[0], {async: true});
        //console.log(this.client)
        
        this.main();
    }

    async main() {

      this.client.onConnect = () => {
        this.client.streamDeltas({
          code: 'cron.eos',
          table: 'cronjobs',
          scope: 'cron.eos',
          payer: '',
          start_from: 0,
          read_until: 0,
        });
      }

      this.client.onData = async (res, ack) => {

          if(res.type == "delta"){
            if(res.content.present === false){
              this.remove(res.content.data);
            }
            else{
              res.content.data.due_date = res.content.data.due_date.split(".")[0];
              this.insert(res.content.data);
            }
          }
          ack(); // ACK when done
      }
      
      this.client.connect(() => {
        console.log('connected!');
      });

      // this.client.onLIB = async (data) => {
      //   console.log(data);  
      // }
    }
}

module.exports = hyperion_provider





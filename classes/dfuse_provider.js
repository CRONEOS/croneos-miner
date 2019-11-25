const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const {Base_Stream_Provider} = require('./abstract/Base_Stream_Provider');
global.fetch = require("node-fetch");
global.WebSocket = require("ws");
const util = require("util");
const {createDfuseClient} = require("@dfuse/client");

class dfuse_provider extends Base_Stream_Provider{

    constructor(){
        super("DFUSE");
        this.dfuse_api_key = process.env.DFUSE_API_KEY;
        this.dfuse_network = process.env.DFUSE_NETWORK;
        
        this.graphql_query = `subscription ($cursor: String) {
            searchTransactionsForward(
              query: "receiver:${process.env.CRON_CONTRACT} db.table:cronjobs/${process.env.CRON_CONTRACT}", 
              lowBlockNum: 0,
              cursor: $cursor,
              liveMarkerInterval: 0
              ) {
              trace {
                id
                matchingActions {
                  dbOps(code: "${process.env.CRON_CONTRACT}", table: "cronjobs") {
                    operation
                    oldJSON { object error }
                    newJSON { object error }
                  }
                }
              }
            }
          }`;
        this.main().catch(error => console.log("Unexpected error", error));

    }

    async main() {

        const client =  createDfuseClient({
            apiKey: this.dfuse_api_key,
            network: this.dfuse_network
          });
          const stream =  await client.graphql(this.graphql_query, (message) => {
            // console.log(util.inspect(message, { showHidden: false, depth: null }) );
            if(!message.type=="data") return;
            if(!message.data) return;
            const trx_id = message.data.searchTransactionsForward.trace.id;
            const matchingActions = message.data.searchTransactionsForward.trace.matchingActions;
            // console.log(trx_id, 'matchingActions', matchingActions.length);
            for(let i=0; i < matchingActions.length; ++i){
              const dbops = matchingActions[i].dbOps;
              if(dbops && dbops.length){
                for(let j=0; j < dbops.length; ++j){
                  const dbop = dbops[j];
                  switch (dbop.operation) {
                    case 'REM':
                        this.remove(dbop.oldJSON.object);
                        break;
                    case 'INS':
                        // console.log(dbop.newJSON.object);
                        this.insert(dbop.newJSON.object);
                        break;
                  
                    default:
                      console.log(`[stream] received UNKNOWN ${dbop.operation} operation`);
                      break;
                  }
                }
              }
            }
          });
          await stream.join();
          await client.release();
    }
}

module.exports = {
    dfuse_provider
};
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const colors = require('colors');

const { Api, JsonRpc, RpcError } = require("eosjs");
const {JsSignatureProvider}  = require('eosjs/dist/eosjs-jssig');
const fetch = require("node-fetch");
const { TextEncoder, TextDecoder } = require("util");
const signatureProvider = new JsSignatureProvider([process.env.MINER_PRIV_KEY]);
const rpc = new JsonRpc(process.env.RPC_NODE, { fetch });
const api = new Api({
  rpc,
  signatureProvider,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder()
});

class Miner {

    constructor(streamProvider){
        this.streamProvider = new streamProvider();
        this.tries = 10;
        this.attempt_delay = 250;
        this.log_error_attempts = false;
        this.start_listeners();

    }
    start_listeners(){
        this.streamProvider.emitter.on('remove', (data) => {
            // console.log('removed', data);
        });
        this.streamProvider.emitter.on('insert', (data) => {
            // console.log('insert', data);
            this.scheduleExecution(data);
        });
    }

    async scheduleExecution(table_delta_insertion){
        //example
        // { description: '',
        // gas_fee: '0.0001 KASDAC',
        // expiration: '2019-11-24T18:22:49',
        // due_date: '2019-11-24T18:22:39',
        // submitted: '2019-11-24T18:22:09',
        // actions:
        //  [ { data: '0568656c6c6f0000000099043055',
        //      authorization: [Array],
        //      name: 'newperiode',
        //      account: 'dacelections' } ],
        // tag: '',
        // owner: 'piecesnbitss',
        // id: 5 }
        let due_date = Date.parse(table_delta_insertion.due_date + ".000+00:00"); //utc ms ;
        const job_id = table_delta_insertion.id;
    
        const now = new Date().getTime(); //(better use synced chain time)
        if(due_date >= now){
            console.log("[schedule]".yellow, "job_id:", job_id, "due_date:", table_delta_insertion.due_date);
            //store the timer & job_id in a map to clear the timer when table delta received before execution
            return setTimeout(()=>{
                this.attempt_exec_sequence(job_id);
            }, due_date-now-2500);
        }
    }

    async attempt_exec_sequence(id){
        console.log("[exec attempt]".magenta, "job_id:", id);
        let success = false;
        const exec_trx = await this._createTrx(id);
    
        for(let i=0; i < this.tries; ++i){
            if(success) break;
            api.rpc.push_transaction(exec_trx).then(res =>{
                    console.log("[EXECUTED]".green, "job_id:", id,"block_time:", res.processed.block_time, "trx_id:", res.processed.id );
                    success = true;
            })
            .catch(e => {
                if (e instanceof RpcError){
                    if(this.log_error_attempts){
                        console.log('error attempt', i, e.json.error.details[0].message);
                    }
                }
                else{
                    console.log('error');
                }
            });
            await new Promise(resolve=>{
                setTimeout(resolve, this.attempt_delay);
            })
        }
    }

    async _createTrx(jobid){
        try {
            const trx = await api.transact(
              {
                actions: [
                  {
                    account: process.env.CRON_CONTRACT,
                    name: "exec",
                    authorization: [
                      {
                        actor: process.env.MINER_ACC,
                        permission: process.env.MINER_AUTH
                      }
                    ],
                    data: {
                      id: jobid,
                      executer: process.env.MINER_ACC,
                    }
                  }
                ]
              },
              {
                blocksBehind: 3,
                expireSeconds: 300,
                broadcast: false
              }
            );
            console.log('[create transaction]'.grey);
            return trx;
          } catch (e) {
            console.log('\nCaught exception: ' + e);
            if (e instanceof RpcError){
              console.log(JSON.stringify(e.json, null, 2));
            }
          }
    }
    
}

module.exports = {
    Miner
};
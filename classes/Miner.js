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

    constructor(streamProvider, options={}){
        this.opt = {
          max_attempts: 10,
          attempt_delay: 250,
          log_error_attempts: false,
          attempt_early: 2500
        }
        this.timers = new Map([]);
        this.opt = Object.assign(this.opt, options);
        this.streamProvider = new streamProvider();
        this.start_listeners();

    }
    start_listeners(){
        this.streamProvider.emitter.on('remove', (data) => {
            const id = data.id;
            clearTimeout(this.timers.get(id));
            this.timers.delete(id);
        });
        this.streamProvider.emitter.on('insert', (data) => {
            let exec_timer = this.scheduleExecution(data);
            this.timers.set(data.id, exec_timer);
        });
    }

    scheduleExecution(table_delta_insertion){
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

            return setTimeout(()=>{
                this.attempt_exec_sequence(job_id);
            }, due_date-now-this.opt.attempt_early);

        }
    }

    async attempt_exec_sequence(id){
        console.log("[exec attempt]".magenta, "job_id:", id);
        let stop = false;
        const exec_trx = await this._createTrx(id);
    
        for(let i=0; i < this.opt.max_attempts; ++i){
            if(stop) break;
            api.rpc.push_transaction(exec_trx).then(res =>{
                    console.log("[EXECUTED]".green, "job_id:", id,"block_time:", res.processed.block_time, "trx_id:", res.processed.id );
                    stop = true;
            })
            .catch(e => {
                if (e instanceof RpcError){
                    const error_msg = e.json.error.details[0].message;
                    if(this.opt.log_error_attempts){
                        console.log('error attempt', i, error_msg);
                    }
                    if(error_msg.substr(46,3) == '006'){
                      stop = true;
                    }
                }
                else{
                    console.log('error');
                }
            });
            await new Promise(resolve=>{
                setTimeout(resolve, this.opt.attempt_delay);
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
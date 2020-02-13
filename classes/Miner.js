const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const colors = require('colors');

const lt = require('long-timeout');

const { Api, JsonRpc, RpcError, Serialize } = require("eosjs");
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
api.Serialize = Serialize;

const {oracle_parser} = require('./oracle_parser.js');
const oracle = new oracle_parser(api);

class Miner {

    constructor(streamProvider, options={}){
        this.opt = {
          max_attempts: 10,
          attempt_delay: 250,
          log_error_attempts: false,
          attempt_early: 2500,
          process_initial_state: true
        }
        this.timers = new Map([]);
        this.opt = Object.assign(this.opt, options);
        this.init(streamProvider);
    }

    async init(streamProvider){
      if(!this.streamProvider){
        this.streamProvider = new streamProvider();
        this.start_listeners();
      }
      if(this.opt.process_initial_state){
        this.process_initial_table();
      }
    }

    async process_initial_table(){
      this.cronjobs_table_data = [];
      await this.getCronjobsTable();
      console.log(`Process existing cronjobs table (${this.cronjobs_table_data.length})`.grey);
      for(let i = 0; i < this.cronjobs_table_data.length; ++i){
        //need to implement concurrency, especially if few miners
        //await is slower but that may be ok for the initial table state
        await this.scheduleExecution(this.cronjobs_table_data[i]);
      }
      this.cronjobs_table_data = [];
    }

    async getCronjobsTable(next_key=''){
        let res = await api.rpc.get_table_rows({
          json: true,
          code: process.env.CRON_CONTRACT,
          scope: process.env.CRON_CONTRACT,
          table: "cronjobs",
          limit: -1,
          lower_bound : next_key
        }).catch(e => {throw new Error("Error fetching initial table data")});

        if(res && res.rows){
          this.cronjobs_table_data = this.cronjobs_table_data.concat(res.rows);
          if(res.more){
            await this.getCronjobsTable(res.next_key);
          }
        }
    } 

    start_listeners(){
        this.streamProvider.emitter.on('remove', (data) => {
            const id = data.id;
            lt.clearTimeout(this.timers.get(id).timer);
            this.timers.delete(id);
        });
        this.streamProvider.emitter.on('insert', async (data) => {
            let schedule_data = await this.scheduleExecution(data);
            //this.timers.set(data.id, exec_timer);
            this.timers.set(data.id, schedule_data );
        });
        console.log(`Listening for table deltas...`.grey)
    }

    async scheduleExecution(table_delta_insertion){

        let due_date = Date.parse(table_delta_insertion.due_date + ".000+00:00"); //utc ms ;
        const job_id = table_delta_insertion.id;
    
        const now = new Date().getTime(); //(better use synced chain time)

        let oracle_conf = null;
        if(table_delta_insertion.oracle_srcs.length != 0){
          oracle_conf = {
            oracle_srcs: table_delta_insertion.oracle_srcs,
            account: table_delta_insertion.actions[0].account,
            name: table_delta_insertion.actions[0].name
          }
        }
        
        if(due_date > now){
            //future job
            console.log("[schedule]".yellow, "job_id:", job_id, "due_date:", table_delta_insertion.due_date);
            let timer =  lt.setTimeout(()=>{
                this.attempt_exec_sequence(job_id);
            }, due_date-now-this.opt.attempt_early);

            return {timer: timer, oracle_conf: oracle_conf};
        }
        else if(due_date <= now){
          //immediate execution
          await this._createTrx(job_id, true);
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

    async _createTrx(jobid, broadcast=false){
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
                      scope: process.env.SCOPE
                    }
                  }
                ]
              },
              {
                blocksBehind: 3,
                expireSeconds: 300,
                broadcast: broadcast
              }
            );
            if(broadcast){
              console.log(`[immediate execution] job_id: ${jobid} trx_id: ${trx.processed.id}`.grey);
            }
            else{
              console.log(`[create transaction] job_id: ${jobid}`.grey);
            }
            
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
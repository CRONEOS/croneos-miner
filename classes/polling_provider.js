/*
This is a table delta provider for local testing only!
It's not optimized to use as a real

*/


const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const {Base_Stream_Provider} = require('./abstract/Base_Stream_Provider');

const {JsonRpc, RpcError} = require("eosjs");
const fetch = require("node-fetch");
const rpc = new JsonRpc(process.env.RPC_NODE, { fetch });

class polling_provider extends Base_Stream_Provider{

    constructor(){
        super("POLLING");
        this.interval = 1000;
        this.cronjobs_data = [];
        this.main();
    }


    async main() {
        // helper     
        const operation = (list1, list2, isUnion = false) =>
            list1.filter(
                (set => a => isUnion === set.has(a.id))(new Set(list2.map(b => b.id)))
            );
        const inBoth = (list1, list2) => operation(list1, list2, true);
        const inFirstOnly = operation;
        const inSecondOnly = (list1, list2) => inFirstOnly(list2, list1);

        setInterval(async ()=>{
          let new_table_data = await this.getCronjobsTable();
          let new_rows = inFirstOnly(new_table_data, this.cronjobs_data);
          let old_rows = inSecondOnly(new_table_data, this.cronjobs_data);

          //remove old rows
          for(let i = 0; i < old_rows.length; i++){
            this.remove(old_rows[i]);
          }
          //emit new rows
          for(let i = 0; i < new_rows.length; i++){
            this.insert(new_rows[i]);
          }

          this.cronjobs_data = new_table_data;
        }, this.interval);
    }

    async getCronjobsTable(){
      let next_key ='';
      let more = true;
      let jobs = [];
      while(more){
        let res = await rpc.get_table_rows({
          json: true,
          code: process.env.CRON_CONTRACT,
          scope: process.env.CRON_CONTRACT,
          table: "cronjobs",
          limit: -1,
          lower_bound : next_key
        }).catch(e => {throw new Error("Error fetching initial table data")});
  
        if(res && res.rows){
          jobs = jobs.concat(res.rows);
          more = res.more;
        }
      }
      return jobs;

  } 
}

module.exports = {
  polling_provider
};
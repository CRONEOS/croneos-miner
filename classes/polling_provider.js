/*
This is a (mock) table delta provider for local testing only!
A stream of table deltas is mocked by polling the table.
It's not optimized to use in production.
*/

const CONF = require('../miner_config.json');
const {Base_Stream_Provider} = require('./abstract/Base_Stream_Provider');

const {JsonRpc, RpcError} = require("@jafri/eosjs2");
const fetch = require("node-fetch");
const rpc = new JsonRpc(CONF.rpc_nodes, { fetch });

class polling_provider extends Base_Stream_Provider{

    constructor(){
        super("POLLING");
        this.interval = 1000*15;//ms
        this.cronjobs_data = [];
        this.max_job_mem_limit = 250// -1= unlimited;
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
          let new_table_data = await this.getCronjobsTable(); //await this.getCronjobsByDueDate(this.max_job_mem_limit);
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
          code: CONF.croneos_contract,
          scope: CONF.scope,
          table: "cronjobs",
          limit: -1,
          lower_bound : next_key
        }).catch(e => { console.log("Error fetching initial table data"); more = false; } );
  
        if(res && res.rows){
          jobs = jobs.concat(res.rows);
          more = res.more;
          next_key = res.next_key ? res.next_key : "";
        }
      }
      return jobs;
  }
  
  async getCronjobsByDueDate(limit){
    let next_key =''; //todo
    let more = true;
    let jobs = [];

    while(more){
      let res = await rpc.get_table_rows({
        json: true,
        code: CONF.croneos_contract,
        scope: CONF.croneos_contract,
        table: "cronjobs",
        limit: limit,
        reverse: false,
        lower_bound : next_key,
        key_type: `i64`,
        index_position: 3 //by_due_date
      }).catch(e => { console.log("Error fetching initial table data") } );

      if(res && res.rows){
        jobs = jobs.concat(res.rows);
        more = false //res.more; TODO
        next_key = res.next_key ? res.next_key : "";
      }
    }
    return jobs;
  }

}

module.exports = {
  polling_provider
};
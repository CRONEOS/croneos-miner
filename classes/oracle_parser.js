const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const { TextEncoder, TextDecoder } = require("util");
const fetch = require("node-fetch");
var jp = require('jsonpath');


class oracle_parser {

    constructor(eosapi){
        console.log("Oracle parser initialized");
        this.api = eosapi;
    }

    async get(oracle_conf){
        // oracle_conf = {
        //     oracle_srcs: table_delta_insertion.oracle_srcs,
        //     account: table_delta_insertion.actions[0].account,
        //     name: table_delta_insertion.actions[0].name
        //   }
        let source_index = 0;
        console.log("[oracle]".green, "fetching data", oracle_conf.oracle_srcs[source_index].api_url);
        
        let res = this.checkResponseStatus(await fetch(oracle_conf.oracle_srcs[source_index].api_url) );
        if(res === false) return;
        res = await res.json(); // console.log(res );

        if(oracle_conf.oracle_srcs[source_index].json_path != ""){
            res = jp.query(res, oracle_conf.oracle_srcs[source_index].json_path);
        }
        

        if(res.length == 0){
            res = "";
        }
        else if(res.length == 1){
            res = res[0];
        }
        //cast data based on abi and then serialize.
        let fields = await this.getActionFields(oracle_conf.account, oracle_conf.name);

        //TODO better type casting
        let data = {};
        for(let i=0; i< fields.length; i++){
            let field = fields[i];
            switch (field.name) {
                case "executer":
                    data["executer"] = process.env.MINER_ACC;
                    break;
                default:
                    data[field.name] = Number(res);
                    break;
            }
        }
        //end todo

        let serialized_data = await this.serializeActionData(oracle_conf.account, oracle_conf.name, data);
        return serialized_data;
    }

    async serializeActionData(account, name, data) {
        try {
          const contract = await this.api.getContract(account);
          let hex = this.api.Serialize.serializeActionData(
            contract,
            account,
            name,
            data,
            new TextEncoder(),
            new TextDecoder()
          );
          return hex;
        } 
        catch (e) {
          console.log(e);
          return false; 
        }
    }

    async getActionFields(account, name) {
        try {
            const abi = await this.api.getAbi(account);//will be cached by eosjs
            // console.log(abi)
            let {type} = abi.actions.find(aa => aa.name == name);
            // console.log(type)
            let struct = abi.structs.find(st => st.name == name || st.name == type);
            if (struct) {
                return struct.fields;
            } else {
                console.log(`fields not found for ${name}`.red);
            }
        } 
        catch (e) {
          console.log(e);
          return false;
        }
    }

    checkResponseStatus(res) {
        if (res.ok) { // res.status >= 200 && res.status < 300
            return res;
        } else {
            console.log(`${res.statusText}`.red);
            return false;
        }
    }
 
}



module.exports = {
    oracle_parser
};
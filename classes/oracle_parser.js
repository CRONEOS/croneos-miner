//const path = require('path');
//require('dotenv').config({path: path.join(__dirname, '../.env')});
const fetch = require("node-fetch");
var jp = require('jsonpath');


class oracle_parser {

    constructor(eosapi){
        console.log("Oracle parser initialized");
        this.api = eosapi;
        let test = {api_url:"http://dummy.restapiexample.com/api/v1/employees", json_path:"$.data[:1].employee_salary"};
        this.get(test)
    }

    async get(oracle_srcs){

        let res = this.checkResponseStatus(await fetch(oracle_srcs.api_url) );
        if(res === false) return;
        res = await res.json(); // console.log(res );

        let needed = jp.query(res, oracle_srcs.json_path);

        if(needed.length == 0){
            needed = "";
        }
        else if(needed.length == 1){
            needed = needed[0];
        }
        //needed contains the required data, now cast data based on abi and serialize.
        
        console.log(needed)
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
const { Miner } = require("./classes/Miner");
//const { dfuse_provider } = require("./classes/dfuse_provider");

//local use only!
const { polling_provider } = require("./classes/polling_provider");

const options = {
  max_attempts: 10,
  attempt_delay: 300, //ms
  attempt_early: 2500, //ms
  log_error_attempts: true,
  process_initial_state: false

};

const my_croneos_miner = new Miner(polling_provider, options);


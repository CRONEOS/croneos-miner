const { Miner } = require("./classes/Miner");
const { dfuse_provider } = require("./classes/dfuse_provider");

const options = {
  max_attempts: 10,
  attempt_delay: 300, //ms
  attempt_early: 2500, //ms
  log_error_attempts: false,
  process_initial_state: true

};

const my_croneos_miner = new Miner(dfuse_provider, options);

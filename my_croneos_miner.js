const { Miner } = require("./classes/Miner");
//const { dfuse_provider } = require("./classes/dfuse_provider");

const { hyperion_provider } = require("./classes/hyperion_provider");

//local use only!
const { polling_provider } = require("./classes/polling_provider");

const options = {
  max_attempts: 10,
  attempt_delay: 300, //ms
  attempt_early: 2500, //ms
  log_error_attempts: true,
  process_initial_state: false

};

//const my_croneos_miner = new Miner(polling_provider, options);

const my_croneos_miner = new Miner(hyperion_provider, options);



/*pause: the miner will skip execution of jobs. jobs will still be scheduled but the execution is halted.*/
//my_croneos_miner.pause();

/*resume: jobs will be executed*/
//my_croneos_miner.resume();

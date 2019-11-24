const {Miner} = require('./classes/Miner');
const {dfuse_provider} = require('./classes/dfuse_provider');

//at the moment all config is loaded via the .env file. I'll probably change that.
const my_croneos_miner =  new Miner(dfuse_provider);


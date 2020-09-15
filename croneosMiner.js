const { Miner } = require("./classes/Miner");
// const { dfuse_provider } = require("./classes/dfuse_provider");
// const { hyperion_provider } = require("./classes/hyperion_provider");
// const { polling_provider } = require("./classes/polling_provider");

// const providers = [dfuse_provider,hyperion_provider,polling_provider]

//const my_croneos_miner = new Miner(polling_provider, options);

// const my_croneos_miner = new Miner(hyperion_provider, options);



/*pause: the miner will skip execution of jobs. jobs will still be scheduled but the execution is halted.*/
//my_croneos_miner.pause();

/*resume: jobs will be executed*/
//my_croneos_miner.resume();



if (process.argv[2]) {
    console.log("Starting croneos miner with data provider:",process.argv[2])
    var provider 
    try {
      provider = require("./classes/providers/"+process.argv[2])
      console.log(provider)
      if (provider) {
        try {
          const my_croneos_miner = new Miner(provider, {});
        } catch (error) {
          console.log(error)
        }
      }
    } catch (error) {
      console.log(errro)

      console.error(`Error: Not a valid provider name: ${process.argv[2]}`.red)
    }
} else {
  console.error("Error: Must specify valid provider".red)
}
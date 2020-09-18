const { Miner } = require("./classes/Miner");

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
      console.log(error)
      console.error(`Error: Not a valid provider name: ${process.argv[2]}`.red)
    }
} else {
  console.error("Error: Must specify valid provider".red)
}
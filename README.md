# croneos-miner-boid
Basic nodejs miner for croneos. 

## From a Fresh Ubuntu server
Install Nodejs and PM2 
```
curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
npm i -g pm2
npm i -g yarn
```

Install the miner
```
git clone https://github.com/boid-com/croneos-miner-boid.git
cd croneos-miner-boid
yarn
```

Setup the config files
```
cp .env.example .env
cp miner_config.json.example miner_config.json
cp ecosystem.config.js.example ecosystem.config.js
```

## Configuration

It's recommended to create a custom permission on your account and linkauth the exec action from the croneos contract if you plan running a miner on a server. Also you can opt to create a dedicated mining account and delegate CPU and NET to it.

### miner_config.json
**Required**

***miner_account:*** The name of your account running croneos jobs, needs at least 500ms of CPU.

***miner_auth:*** The permission your miner will use, it's more secure to setup a special permission that can only interact with the cron.eos contract. check 'boidcomnodes' validator permission for an example.

**optional**

***attempt_options:*** You can tweak the delay between attempts, number of retries.

***provider_options:*** tweak polling rate (default is 30 sec).

***rpc_nodes:*** a list of RPC EOS nodes, defaults are fine. If you have an rpcProxy running on the same machine you can use 'http://localhost:3051'

***gas_thresholds:*** You can specify the minimum gas fee you will accept, increase these values to reduce CPU costs by ignoring less profitable jobs.

### .env
**Required**

***MINER_PK:*** Provide your miner private key here, the same key assigned tot the miner_auth permission in miner_config.

***DFUSE_API_KEY:*** You need a Dfuse API key, you can get a free key by making an account at dfuse.io and going to the 'API Keys' page.

### .ecosystem.config.js
**optional**
You don't need to modify this file but you can depending on your needs.

This file is a list of jobs to run in parallel. By default, the miner will run two instances for redundancy. One instance uses dfuse for instant streaming data. The second instance uses the polling provider which is not as fast and uses extra bandwidth but provides extra redundancy in case the dfuser miner misses a job or there is a problem with dfuse. By running two miners you have a strong guarantee your miner will always try to run every job. The third job in the list is croneosClaim (with 24 hour repeat). This script simply checks for any claimable Fee tokens (like VIG, BOID, EOS) and claims them to your miner account.

## Start mining
```
pm2 start ecosystem.config.js
```
## Autostart
Ensure the croneos miner will be started again if the computer is rebooted. 

There is a manual step after pm2 startup you need to read the instructions.
```
pm2 startup
pm2 save

```

## Debugging
watch the logs and make sure you don't see too many errors
```
pm2 logs
```

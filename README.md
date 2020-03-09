# Croneos

# Setup
Copy the example config to customize your own.
```
cd croneos
cp ./example.miner_config.json ./miner_config.json
cp ./example.ecosystem.config.js ./ecosystem.config.js

```
Modify the config file by filling in your private key, account name and permission. 
You can also customize your minimum gas fee and interval parameters.

**min_cpu_us:** 

The minium (in microseconds) amount of CPU you would like to maintain on the account. If your available CPU dips below this number then the miner will pause and wait for CPU to be restored.

```
npm i 
pm2 start
```
You might need to run npm i --unsafe-perm=true --allow-root due to one of the dependencies throwing a warning.

This will start the croneos miner and reward claim jobs. By default the claim job will run once per day to claim your gas fee rewards.

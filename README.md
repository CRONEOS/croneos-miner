# croneos-miner
Basic nodejs miner for croneos. Atm there is only one stream provider (dfuse).
The current miner makes use of https://github.com/tellnes/long-timeout to overcome the delay (>  2147483647 (2^31-1) (+-24.8 days) )limitation of the native setTimeout. (see todo)

## Install the dependencies
```bash
yarn
```

### Configuration
Substitute the values in `.env.example` and rename the file to `.env`. It's recommended to create a custom permission on your account and `linkauth` the `exec` action from the croneos contract if you plan running a miner on a server. Also you can opt to create a dedicated mining account and delegate CPU and NET to it.

### Start mining
```bash
node my_croneos_miner.js
```
Or start with a process manager ([see pm2](https://github.com/Unitech/pm2)).
```bash
pm2 start my_croneos_miner.js
```

## Todo
* load initial table state
* add more table delta stream providers
* Abstract out the exec scheduling in a separate class so that different scheduling logic can be used.


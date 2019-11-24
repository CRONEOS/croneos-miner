# croneos-miner
Basic nodejs miner for croneos. Atm there is only one stream provider (dfuse).

## Install the dependencies
```bash
yarn
```

### Configuration
Substitute the values in `.env.example` and rename the file to `.env`

### Start mining
```bash
node my_croneos_miner.js
```
Or start with a process manager See ([see pm2](https://github.com/Unitech/pm2)).
```bash
pm2 start my_croneos_miner.js
```

## Todo
* load initial table state
* respond to "remove" table deltas
* add more table delta stream providers

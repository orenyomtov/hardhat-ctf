# hardhat-ctf-example

This is an example of a solidify CTF challenge built using the `hardhat-ctf` plugin.

## Quickstart

```bash
npm install
```

Make sure everything was properly installed

```bash
npx hardhat compile
npx hardhat test
```

Try to solve the challenge by editing [/challenge/index.ts](./challenge/index.ts) and running

```bash
npx hardhat ctf-try
```

Once you solved it locally, run the following command to obtain the real flag:

```bash
npx hardhat ctf-try --submit
```

## Server Setup

On the server running the CTF node which validates solutions and gives the flag to succesful contestants, run:
```
CTF_FLAG="CTF{real_flag_goes_here}" npx hardhat ctf-node
```

Then, edit the `hardhat.config.ts` file to point the config's `ctfRemoteNode` field to your server running `ctf-node`, and give the folder to anyone who wants to try solving the challenge.

FYI there is also a [Dockerfile](./Dockerfile) present to easily deploy this in a scalable fashion.
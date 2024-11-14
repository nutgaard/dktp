# dktp

A simple cli to interact with Azure ContainerApps with arm/yaml templates

## Usage

```shell
Usage: dktp [options] [command]

CLI to help working dktp apps

Options:
  -h, --help                                display help for command

Commands:
  wrap [options] <configfile> [outputfile]  Download secrets, and encrypt environment
  run [options] <env_file> <command...>     Run command with environment variables from lock-file
  inspect [options] <env_file>              Print content of encrypted lock-file
  help [command]                            display help for command
```

### Wrap: Download and encrypt environment

```shell
Usage: dktp wrap [options] <configfile> [outputfile]

Download secrets, and encrypt environment

Arguments:
  configfile                        Path to dktp yaml file
  outputfile                        Path to encrypted vault file

Options:
  -c, --container <container_name>  Container name to process (defaults to create a combined env file)
  -e, --env <env_file>              Envfile to use for interpolation
  -h, --help                        display help for command
  
  
Example: dktp wrap example/main.yml -e example/prod.env example/prod.env.locked
```

### Run: Start a process with environment variable set

```shell
Usage: dktp run [options] <env_file> <command...>

Run command with environment variables from lock-file

Arguments:
  env_file                      Envfile to use for process
  command                       The command to run

Options:
  -o, --override [keyvalue...]  Override or pass extra environment variable, e.g MY_VAR=abba (default: {})
  -h, --help                    display help for command
  
  
Example: dktp run example/prod.env.locked -o APP_NAME=Hello -- node index.mjs
```

### Inspect: Print the content of a encrypted lock-file

```shell
Usage: dktp inspect [options] <env_file>

Print content of encrypted lock-file

Arguments:
  env_file                      File to inspect

Options:
  -o, --override [keyvalue...]  Override or pass extra environment variable, e.g MY_VAR=abba (default: {})
  -h, --help                    display help for command
  
  
Example: dktp inspect example/prod.env.locked -o APP_NAME=Hello
```



## Contribution
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

To test wrapping of secrets;
1. Update [targetPlatform.ts](src/utils/targetPlatform.ts) to set `AZ_MOCK = true`.
2. Run `bun run src/index.ts wrap example/main.yml -e example/prod.env example/prod.env.locked`


### Commiting changes

This repository uses commitizen and conventional-changelog to determine which new semver-version should be used in a release.
To help with keeping your commits correctly formatted please use `bun commit` / `npm run commit`.
# npm install -g eslint

Please use `eslint` to validate the code format for Jingo.

If you use Sublime Text, take a look at [SublimeLinter-eslint](https://github.com/roadhump/SublimeLinter-eslint). You need to install Sublime-linter first.

## Running

- Run jingo once with the `-s` command line parameter. Redirect the output to a configuration file: `./jingo -s > config.yaml`
- If you don't want to use the Google authentication (which is enabled by default), run `jingo -# something` to create an hash for "something" and use it in the config file for the local authentication mechanism
- Create an empty git repository accessible by jingo and point its configuration file's `repository` to it: `mkdir my-wiki; cd wiki; git init`
- Run jingo in development mode: `npm run start-dev`
- Maybe you want to set the `loggingMode` to 2 (less verbose, more compact output)
- Start hacking :)

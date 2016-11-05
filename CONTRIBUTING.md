# Contributing to Jingo

Jingo is developed primarly by Claudio Cicali but a lot of small and not-so-small pull requests from other contributors have been merged into it over the time. Pull requests are welcome!

Keep in mind that Jingo is used by quite a lot of people and we must be super-sure that we are not introducing bugs on their installations, thus there are just a few things to know before start hacking...

- every PR must address one single problem and should be as small as possible
- if possible, open an issue that will be referenced by the PR (maybe there will be some discussion about what you want to do?)
- if you add or change a configuration option, you must also update the README
- if you want to use an 3rd-party module, be sure that its license is compatible with Jingo's
- add a meaningful description to the PR and possibly some comments in the code as well
- be kind and write a test for your change
- be patient: I will review and merge your PR as soon as I have time and not as soon as you publish it :D

A big PR, even if would add a lot of value to Jingo, would have problems to be merged. I cannot trust you 100% on the regression tests that you may (or many not) have ran, and I want to try my best to always deliver a Jingo which won't break things to people upgrading it. Unfortunately I don't have a set of integration tests to test for regressions (only units tests) and all the tests I need to run I do them manually, which translates in more time to spend on the project.

## Jingo uses standardjs for formatting (npm install -g standard)

Before committing your work, run `standard` in the root directory. If you see no errors, you're good to push :)

## Test

Run `npm test` to ensure that your code hasn't break anything

## Running

- Run jingo once with the `-s` command line parameter. Redirect the output to a configuration file: `./jingo -s > config.yaml`
- If you don't want to use the Google authentication (which is enabled by default), run `jingo -# something` to create an hash for "something" and use it in the config file for the local authentication mechanism
- Create an empty git repository accessible by jingo and point its configuration file's `repository` to it: `mkdir my-wiki; cd wiki; git init`
- Maybe you want to set the `loggingMode` to 2 (less verbose, more compact output) in the config
- Run jingo in development mode (jingo will automatically restart when a file changes): `npm run start-dev`
- Start hacking :)

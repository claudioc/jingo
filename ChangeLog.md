Version 1.2.9, January 26th, 2014
=================================

- Fixes #64 (crash serving favicon)
- Fixes #62 (missing titles on new and edit)
- Fixes #60 (no sidebar on login page)

Version 1.2.8, December 15th, 2014
=================================

- Fixes a bug on the pull git pull (Jon Richter, @almereyda)
- Updates README (Jon Richter, @almereyda)
- Re-enable the baseUrl config option (Jon Richter, @almereyda)
- Upgrade some modules to a newest version

Version 1.2.7, November 16th, 2014
=================================

- Merges #59 (add a validation for Github parameters)

Version 1.2.6, November 4th, 2014
=================================

- Fixes #57 (removes the backdrop from modal)
- Better accessibility for modal boxes
- Better layout and typography for modal boxes

Version 1.2.5, October 28st, 2014
=================================

- Fixes a z-index bug

Version 1.2.4, October 28st, 2014
=================================

- Fixes #56 (unrecognized git version)

Version 1.2.3, October 27st, 2014
=================================

- Fixes #55 (footer links not clickable)

Version 1.2.2, October 21st, 2014
=================================

- Fixes #54 (broken customizations)
- Adds the jingo version to the meta generator
- Better README
- Fixes a potential crash
- Adds missing page titles (regression bug)

Version 1.2.1, October 13, 2014
=================================

- Fixes #41 (inverted diff)

Version 1.2.0, October 9, 2014
=================================

- Adds support for the GitHub logins
- Adds support to be able to serve images and other assets from the repo

Version 1.1.0, September 23, 2014
=================================

The markdown module we use (Marked) tries to overcome some "obscure" problems with the original Perl markdown parser by default. These produces some problems when rendering HTML embedded in a markdown document see also issue #48. By default we now want to use the original parser and not the modified one (pedantic: true).

There is a new option to override this behaviour (application.pedanticMarkdown).

Version 1.0.0, July 31, 2014
=============================

This version introduces a LOT of changes, but it is still compatible with the 0.6.1

To upgrade, just run `npm install`. Please note that you will need `npm` version 1.3 or newer to install the dependencies or we will get the _Error: No compatible version found_ errors. To upgrade npm just run `npm update npm -g` (sudo may be required).

- Upgraded to Bootstrap 3.2
- Upgraded to Express 4
- Upgraded to Codemirror 3.24
- Code refactoring, now easier to maintain and to contribute
- Added some shortcut on the session message ("edit again?")
- New code tag renderer
- Fixed an issue where the sidebar and footer were not rendered
- Code refactoring using another level of abstraction (aka models)
- More mobile friendly
- New look for custom sidebar and footer
- Provides a new `pages` configuration options
- New YAML parser (js-yaml)
- Upgraded markdown parser
- It is now possible to specify a custom binary for git
- The list of documents is now paginated (configurable amount of items)
- Names of the components are now configurable
- Don't show the avatar if there is no email
- Better tests for the validity of the configuration options
- Fixes #39
- Fixes #37
- Fixes #32
- Fixes #27
- Fixes #22

Version 0.6.1, June 24th, 2014
=============================

- Due to an incompatibility with latest versions of Express 3.x (and Connect),
  the Express version in package.json has been frozen
- Removed some deprecation warnings
- Fixed some problems on the welcome page

Version 0.6.0, May 28th, 2014
=============================

- Uses the OAuth 2 authentication instead of the OpenID 2.0
  (see also https://developers.google.com/accounts/docs/OpenID)
  This will require to edit the config file and request Google for
  a client id and client secret (see the README on how to do that)

  The update requires to issue a `npm install`

Version 0.5.2, May 26th, 2014
=============================

- Version bump for the npm package glitch

Version 0.5.1, December 6th, 2013
=============================

- Use of icons (ionicons) instead of the ugly texts for buttons
- Add the quick diff option on the list of pages
- Fixes a bug on the compare button

Version 0.5.0, December 4th, 2013
=============================

- Use of Codemirror (select it from the new config key `features`)
- Adds the last commit comment on the document list

Version 0.4.4, July 23th, 2013
=============================

- Better typography

Version 0.4.3, July 10th, 2013
=============================

- Closes #19
- Better line height for LI
- Refines PR #20

Version 0.4.2, June 29th, 2013
=============================

- Fixed a compatibility issue with node 0.10.12, see #17

Version 0.4.1, June 25th, 2013
=============================

- Fixed a bug on the document list sort

Version 0.4.0, June 11th, 2013
=============================

- The main content is now centered
- Better typography
- Added WideArea support
- Added the ability to specify the branch within the remote

Version 0.3.5, 0.3.6, June 5th, 2013
=============================

- Bug fixes

Version 0.3.4, June 5th, 2013
=============================

- Support for search word highlight
- Makes the "tools" drawer fixed positioned

Version 0.3.3, June 4th, 2013
Version 0.3.2, June 4th, 2013
=============================

- Adds the baseUrl configuration key
- Fixes a bug on the renderer

Version 0.3.1, May 26th, 2013
=============================

- Closes #11

Version 0.3.0, May 24th, 2013
=============================

- Added the alone authorization option
- Added the --local server option
- Added ChangeLog
- Removed yaml module, added yaml-js
- Added connect-flash module

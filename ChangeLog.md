Version 1.0.0, July 31, 2014
=============================

- Bootstrap 3.2
- Express 4
- Promises (Bluebird)
- don't show the avatar if there is no email
- added some shortcut on the session message ("edit again?")
- new code renderer
- fixed an issue where the sidebar and footer were not rendered
- code refactoring using another level of abstraction (aka models)
- more mobile friendly
- new look for custom sidebar and footer
- provides a new `pages` configuration options. You may specify:
  - nameSeparator: uses `dash` (default), `underscore` or `space` as the word
    separator in the filename (My-document.md, My_document.md, My document.md)
  - index: the name of the index page (defaults to 'Home')
  - titleFrom: dictates where to "store" the index of the page; `filename` (new
    default) will use the filename as the title, and `content` (default for older
    Jingos) will use the first line of the file. When the title is from the
    content, Jingo will continue to use the old method of handling titles: the
    filenames of the newly created files will be lowercased and it won't be
    possible to change the filename, even if the title has changed. However, if
    the title is read from the filename, the case of the filename itself will be
    left untouched and changing the name of the document will also change the
    name of the file
- new YAML parser (js-yaml)

  This update requires to issue a `npm install`

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

[![NPM](https://nodei.co/npm/jingo.png?compact=true)](https://npmjs.org/package/jingo)

[ ![Codeship Status for claudioc/jingo](https://www.codeship.io/projects/4c413870-353e-0132-115c-220292a78f73/status)](https://www.codeship.io/projects/40997)

JINGO
=====

A **git based** _wiki engine_ written for **node.js**, with a decent design, a search capability and a good typography.

![Screenshot](https://dl.dropboxusercontent.com/u/152161/jingo/ss1.png)

<!-- toc -->

Table of contents
-----------------

  * [Introduction](#introduction)
  * [Features](#features)
  * [Installation](#installation)
  * [Authentication and Authorization](#authentication-and-authorization)
  * [Common problems](#common-problems)
  * [Known limitations](#known-limitations)
  * [Customization](#customization)
  * [Editing](#editing)
  * [Configuration options reference](#configuration-options-reference)

<!-- toc stop -->

Introduction
-------------

The aim of this wiki engine is to provide an easy way to create a centralized documentation area for people used to work with **git** and **markdown**. It should fit well into a development team without the burden to have to learn a complex and usually overkill application.

Jingo is very much inspired by (and format-compatible with) the github own wiki system [Gollum](https://github.com/gollum/gollum), but it tries to be more a stand-alone and complete system than Gollum is.

Think of jingo as "the github wiki, without github but with more features". "Jingo" means "Jingo is not Gollum" for more than one reason.

There is a demo server running at http://jingo.cica.li:6067/wiki/home

![Screenshot](https://dl.dropboxusercontent.com/u/152161/jingo/ss2.png)

Features
--------

- No database: it uses a git repository as the document archive
- Markdown for everything, [github flavored](http://github.github.com/github-flavored-markdown/)
- Uses [Codemirror](http://codemirror.net/) or [Markitup](http://markitup.jaysalvat.com/home/) as the markup editor, with a nice (ajax) preview (see the `features` key in the config file)
- Provides a "distraction free", almost full screen editing mode
- Compatible with a wiki created with the [Gollum](https://github.com/github/gollum) wiki
- Revision history for all the pages (and restore)
- Show differences between document revisions
- Paginated list of all the pages, with a quick way to find changes between revisions
- Search through the content _and_ the page names
- Page layout accepts custom sidebar and footer
- Gravatar support
- Can include IFRAMEs in the document (es: embed a Google Drive document)
- Can use custom CSS and JavaScript scripts
- White list for authorization on page reading and writing
- Detects unwritten pages (which will appear in red)
- Automatically push to a remote (optionally)
- Mobile friendly (based on Bootstrap 3.x)
- Quite configurable, but also works out of the box
- Works well behind a proxy (i.e.: the wiki can be "mounted" as a directory in another website)
- Pages can be embedded into another site

For code syntax highlighting, Jingo uses the `node-syntaxhighlighter` module. For the list of supported languages, please refer to [this page](https://github.com/thlorenz/node-syntaxhighlighter/tree/master/lib/scripts).

![Screenshot](https://dl.dropboxusercontent.com/u/152161/jingo/ss3.png)

Installation
------------

`npm install -g jingo` or download/clone the whole thing and run `npm install`.

Note: if you already have Jingo installed, please also run `npm prune` (some modules can be stale and need to be removed).

Jingo needs a config file and to create a sample config file, just run `jingo -s`, redirect the output on a file and then edit it (`jingo -s > config.yaml`). The config file contains all the available configuration options. Be sure to provide a valid server hostname (like wiki.mycompany.com) if you use a 3rd party provider for authentication (like Google or GitHub). It is needed for them to be able to get back to you.

This document contains also [the reference](#configuration-options-reference) for all the possible options.

If you define a `remote` to push to, then Jingo will automatically issue a push to that remote every `pushInterval` seconds. To declare a `remote` for Jingo to use, you'll need to identify the name of your local remote. The following example shows how a local remote is typically defined: 

`git remote add origin https://github.com/joeuser/jingorepo.git'`

Based on that example, you would update config.yaml with the remote name "origin" as follows:

`remote: "origin"`

You can also use the `git remote` command to get the name of your remote.

You can also specify a branch using the syntax "remotename branchname". If you don't specify a branch, Jingo will use `master`. Please note that before the `push`, a `pull` will also be issued (at the moment Jingo will not try to resolve conflicts, though).

The basic command to run the wiki will then be

`jingo -c /path/to/config.yaml`

Before running jingo you need to initialise its git repository somewhere (`git init` is enough). Additionally the user running the process needs to have `git config --global user.name` and `git config --global user.email` configured. Else your document's repo will get scrambled and you have to reinitialize it again (`rm -rf .git && git init`).

If you define a remote to push to, be sure that the user who'll push has the right to do so. This means you have to configure the remote via the `git://` URI that uses ssh authentication to push and have [created and published the process user's ssh public key](https://help.github.com/articles/generating-ssh-keys/) to the remote.

If your documents reside in subdirectory of your repository, you need to specify its name using the `docSubdir` configuration option. The `repository` path _must_ be an absolute path pointing to the root of the repository.

If you want your wiki server to only listen to your `localhost`, set the configuration key `localOnly` to true.

![Screenshot](https://dl.dropboxusercontent.com/u/152161/jingo/ss4.png)

Authentication and Authorization
--------------------------------

You can enable the following strategies: _Google logins (OAuth2)_, _GitHub logins (OAuth2)_ or a simple, locally verified username/password credentials match (called "local").

The _Google Login_ and the _GitHub login_ uses OAuth 2 and that means that on a fresh installation you need to get a `client id` and a `client secret` from Google or GitHub and put those informations in the configuration file.

For Google, follow these instructions (you need to be logged in in Google):

* Open the [Google developer console](https://code.google.com/apis/console/)
* Create a new project (you can leave the _Project id_ as it is). This will take a little while
* Open the _Consent screen_ page and fill in the details (particularly, the _product name_)
* Now open _APIs & auth_ => _Credentials_ and click on _Create new client id_
* Here you need to specify the base URL of your jingo installation. Google will fill in automatically the other field
  with a `/oauth2callback` URL, which is fine
* Now you need to copy the `Client ID` and `Client secret` in your jingo config file in the proper places

For GitHub, follow these instructions (you need to be logged in in GitHub):

* Register a new application [here](https://github.com/settings/applications/new)
* Enter whatever `Application name` you want
* Enter your installation URL (localhost is OK, for example "http://localhost:6767/")
* Enter <your installation URL>/auth/github/callback as the `Authorization callback URL`
* Press the `Register application` button
* In the following page, on the top right corner, take note of the values for `Client ID` and `Client Secret`
* Now you need to copy the `Client ID` and `Client secret` in your jingo config file in the proper places

The _local_ method uses an array of `username`, `passwordHash` and optionally an `email`. The password is hashed using a _non salted_ SHA-1 algorithm, which makes this method not the safest in the world but at least you don't have a clear text password in the config file. To generate the hash, use the `--hash-string` program option: once you get the hash, copy it in the config file.

You can enable all the authentications options at the same time. The `local` is disabled by default.

The _authorization_ section of the config file has three keys: `anonRead`, `validMatches` and `emptyEmailMatches`. 

If `anonRead` is true, then anyone who can access the wiki can read anything. If `anonRead` is false you need to authenticate also for reading and then the email of the user _must_ match at least one of the regular expressions provided via validMatches, which is a comma separated list. There is no "anonWrite", though. To edit a page the user must be authenticated.

`emptyEmailMatches` allows access when remote authentication providers do not provide an email address as part of user data. It defaults to `false`, but will usually need to be set to `true` for GitHub authentication (GitHub only returns email addresses that have been made public on users' GitHub accounts).

The authentication is mandatory to edit pages from the web interface, but jingo works on a git repository; that means that you could skip the authentication altogether and edit pages with your editor and push to the remote that jingo is serving.

Known limitations
-----------------

- The authentication is mandatory (no anonymous writing allowed). See also issue #4
- The repository is "flat" (no directories or namespaces)
- Authorization is only based on a regexp'ed white list with matches on the user email address
- There is one authorization level only (no "administrators" and "editors")
- No scheduled pull or fetch from the remote is provided (because handling conflicts would be a bit too... _interesting_)

Please note that at the moment it is quite "risky" to have someone else, other than jingo itself, have write access to the remote / branch jingo is pushing to. The push operation is supposed to always be successfull and there is no pull or fetch. You can of course manage to handle pull requests yourself.

Customization
-------------

You can customize jingo in four different ways:

- add a left sidebar to every page: just add a file named `_sidebar.md` containing the markdown you want to display to the repository. You can edit or create the sidebar from Jingo itself, visiting `/wiki/_sidebar` (note that the title of the page in this case is useless)
- add a footer to every page: the page you need to create is `_footer.md` and the same rules for the sidebar apply
- add a custom CSS file, included in every page as the last file. The default name of the file is `_style.css` and it must reside in the document directory (but can stay out of the repo). It is not possible to edit the file from jingo itself
- add a custom JavaScript file, included in every page as the last JavaScript file. The default name of the file is `_script.js` and it must reside in the document directory (but can stay out of the repo). It is not possible to edit the file from jingo itself

All these names are customizable via the `customizations` option in the config file (see [the reference](#configuration-options-reference)).

Once read, all those files are cached (thus, not re-read for every page load, but kept in memory). This means that for every modification in _style.css and _script.js you need to restart the server (sorry, working on that).

This is not true for the footer and the sidebar but ONLY IF you edit those pages from jingo (which in that case will clear the cache by itself).

Editing
-------

To link to another Jingo wiki page, use the Jingo Page Link Tag.

    [[Jingo Works]]

The above tag will create a link to the corresponding page file named `jingo-works.md`. The conversion is as follows:

  1. Replace any spaces (U+0020) with dashes (U+002D)
  2. Replace any slashes (U+002F) with dashes (U+002D)

If you'd like the link text to be something that doesn't map directly to the page name, you can specify the actual page name after a pipe:

    [[How Jingo works|Jingo Works]]

The above tag will link to `Jingo-Works.md` using "How Jingo Works" as the link text.

Images
------

If you put images into the repository, Jingo will be able to serve them. You can enable Jingo to serve even other file types from the document directory: you need to change the `staticWhitelist` configuration option.

Configuration options reference
-------------------------------

#### application.title (string: "Jingo")

  This will be showed on the upper left corner of all the pages, in the main toolbar

#### application.repository (string: "")

  Absolute path for your documents repository (mandatory).

#### application.docSubdir (string: "")

  If your documents reside inside a directory of the repository, specify its name here.

#### application.remote (string: "")

  This is the name of the remote you want to push/pull to/from (optional). You can also specify a specific branch using the syntax “remotename branchname”. If you don’t specify a branch, Jingo will use master.

#### application.pushInterval (integer: 30)

  Jingo will try to push to the remote (if present) every XX seconds

#### application.secret (string: "change me")

  Just provide a string to be used to crypt the session cookie

#### application.git (string: "git")

  You can specify a different git binary, if you use more than one in your system

#### application.skipGitCheck (boolean: false)

  Jingo will refuse to start if a version of git is found which is known to be problematic. You can still force it to start anyway, providing `true` as the value for this option

#### application.loggingMode (integer: 1)

  Specifies how verbose the http logging should be. Accepts numeric values: `0` for no logging at all, `1` for the a combined log and `2` for a coincise, coloured log (good for development)

#### application.pedanticMarkdown (boolean: true)

  (the default was `false` in jingo < 1.1.0)

  The markdown module we use (Marked) tries to overcome some "obscure" problems with the original Perl markdown parser by default. This produces some problems when rendering HTML embedded in a markdown document (see also issue https://github.com/claudioc/jingo/issues/48). By default we now want to use the original parser and not the modified one (pedantic: true).

  With this option you can revert this decision if for some reason your documents are not rendered how you like.

####application.gfmBreaks (boolean: true)

  Enable [GFM line breaks](https://help.github.com/articles/github-flavored-markdown#newlines)

####application.proxyPath (string: "")
  
  If you want jingo to work "behind" another website (for example in a /wiki directory of an already existing intranet), you need to configure it to be aware of that situation so that it can write all the outbound URLs accordingly. Use this option to pass it the name of the directory that you've configured in your proxy_pass option in nginx or apache. See also an nginx example in the /etc directory of the jingo source distribution.

  Please note that jingo won't work correctly if this option is activated.

####authentication.staticWhitelist (string: "/\\.png$/i, /\\.jpg$/i, /\\.gif$/i")

  This is to enable jingo to serve any kind of static file (like images) from the repository. By default, Jingo will serve `*.md` files and `*.jpg, *.png, *.gif`. Provide the values as a comma separated list of regular expressions.

#### authentication.google.enabled (boolean: true)

  Enable or disable authentication via Google logins

#### authentication.google.clientId
#### authentication.google.clientSecret

  Values required for Google OAuth2 authentication. Refer to a previous section of this document on how to set them up.

#### authentication.google.redirectUrl (string: /oauth2callback)

  Specifies a custom redirect URL for OAuth2 authentication instead of the default

#### authentication.github.enabled (boolean: false)

  Enable or disable authentication via Github logins

#### authentication.github.clientId
#### authentication.github.clientSecret

  Values required for GitHub OAuth2 authentication. Refer to a previous section of this document on how to set them up.

#### authentication.google.redirectUrl (string: /auth/github/callback)

  Specifies a custom redirect URL for OAuth2 authentication instead of the default

#### authentication.local.enabled (boolean: false)

  The Local setup allows you to specify an array of username/password/email elements that will have access to the Wiki. All the accounts must resides in the configuration `authentication.local.accounts` array

#### authentication.local.[accounts].username

  Provide any username you like, as a string

#### authentication.local.[accounts].passwordHash

  Use an hash of your password. Create the hash with `jingo -# yourpassword`

#### authentication.local.[accounts].email

  If you want to use Gravatar, provide your gravatar email here.

#### authentication.alone.enabled (deprecated)

  Boolean, defaults to `false`
  _The Alone authentication option is deprecated in favor of the Local one_

#### authentication.alone.username (deprecated)

  Provide any username you like, as a string
  _The Alone authentication option is deprecated in favor of the Local one_

#### authentication.alone.passwordHash (deprecated)

  Use an hash of your password. Create the hash with `jingo -# yourpassword`
  _The Alone authentication option is deprecated in favor of the Local one_

#### authentication.alone.email (deprecated)

  If you want to use Gravatar, provide your gravatar email here.
  _The Alone authentication option is deprecated in favor of the Local one_

#### features.markitup (boolean: false)

  Whether to enable Markitup or not

#### features.codemirror (boolean: true)

  Whether to enable Codemirror or not.

  Please note that you cannot enable both editors at the same time.

#### server.hostname

  This is the hostname used to build the URL for your wiki pages. The reason for these options to exist is due to the need for the OAuth2 authentication to work (it needs an endpoint to get back to)

#### server.port

  Jingo will listen on this port

#### server.localOnly

  Set this to `true` if you want to accept connection only _from_ localhost (default false)

#### server.CORS.enabled (boolean: false)

  Enable or disable CORS headers for accessing a page through an ajax call from an origin which is not the one which serves Jingo. Use this option if for example you want to embed a (rendered) page inside a page of another website.

  The configuration options for CORS are at the moment quite limited: via an Ajax call you can only read (GET) a wiki page (that is, the /wiki/NameOfYourPage path), or issue a search. Once you enable this option, all the wiki page will be accessible. Please note that no authentication check is made, which means that the Ajax calls will be denied if the `anonRead` configuration option will be `false` (all or nothing).

  You can also white-list origin via the following option (CORS.allowedOrigin)

#### server.CORS.allowedOrigin (string: "*")

  Set the allowed origin for your CORS headers. All the Ajax calls to the wiki pages must come from this origin or they will be denied. The default is "*", which means that all the origins will be allowed

#### server.baseUrl

  The baseUrl is usually automatically generated by Jingo (with "//" + hostname + ":" + port), but if for some reason you need to overrideit, you can use this option

#### authorization.anonRead (boolean: true)

  Enables/disables the anonymous access to the wiki content

#### authorization.validMatches (string: ".+")

  This is a regular expression which will be used against the user email account to be able to access the wiki. By default all emails are OK, but you can for example set a filter so that only the hostname from your company will be allowed access.

#### authorization.emptyEmailMatches (boolean: false)

  If the endpoint doesn't provide the email address for the user, allow empty emails to authenticate anyway. Note that GitHub authentication usually requires this to be `true` (unless all wiki users have public email addresses on their GitHub accounts).

#### pages.index (string: "Home")

  Defines the page name for the index of the wiki

#### pages.title.fromFilename (boolean: true)

  If this is true, the title of each page will be derived from the document's filename. This is how Gollum works and from Jingo 1.0 this is now the default. An important consequence of this behavior is that now Jingo is able _to rename_ documents (according to the new name it will be eventually given to), while previously it was impossible.

#### pages.title.fromContent (boolean: false)

  If this is true, the title of the document will be part of the document itself (the very first line). This is the default behavior of Jingo < 1.0 and the default is now false. If you have an old installation of Jingo, please set this value to true and `fromFilename` to false.

#### pages.title.asciiOnly (boolean: false)

  If this is set to true, Jingo will convert any non-Ascii character present in the title of the document to an ASCII equivalent (using the transliteration module), when creating the filename of the document. Default was true for Jingo < 1.0 while for Jingo >= 1.0 the default is false

#### pages.title.lowercase (boolean: false)

  If this is set to true, Jingo will lowercase any character of the title when creating the filename. Default was true for Jingo < 1.0 while for Jingo >= 1.0 the default is false

#### pages.title.itemsPerPage (integer: 10)

  This defines how many page item to show in the "list all page" page. Keep this value as low as possible for performance reasons.

#### customizations.sidebar (string: "_sidebar.md")

  Defines the name for the _sidebar_ component. Defaults to `_sidebar.md`. Please note that if you need to use a wiki coming from Github, this name should be set to `_Sidebar`

#### customizations.footer (string: "_footer.md")

  Defines the name for the _footer_ component. Defaults to `_footer.md`. Please note that if you need to use a wiki coming from Github, this name should be set to '_Footer'

#### customizations.style (string: "_style.md")

  Defines the name for the customized _style_ CSS component. Defaults to `_style.css`.

#### customizations.script (string: "_script.md")

  Defines the name for the customized _script_ JavaScript component. Defaults to `_script.js`.

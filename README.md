JINGO
=====

A simple git based _wiki engine_ written for Node.js.

The aim of this wiki engine is to provide a very easy way to create a centralized
documentation area for people used to working with git and markdown. It should fit well
into a development team without the need to learn or install ad-hoc servers or applications. 
Jingo is very much inspired by the github wiki system (gollum), but tries to be more 
a stand-alone and complete system than gollum is.

Think of jingo as "the github wiki, without github but with more features". "Jingo" 
means "Jingo is not Gollum" for a reason.

There is a demo server running at http://jingo.cicali.cc:6067/wiki/home

Features
--------

- No database: uses a git repository as the document archive
- No user management: authentication provided via with Google logins or simple login
- Markdown for everything, [github flavored](http://github.github.com/github-flavored-markdown/)
- Uses [Markitup](http://markitup.jaysalvat.com/home/) as the markup editor, with a nice (ajax) preview
- Uses [WideArea](http://usablica.github.io/widearea/) for a "distraction free" mode
- Inspired by the well known github [Gollum](https://github.com/github/gollum) wiki
- Show differences between document revisions
- Search through the content _and_ the page names
- Layout accepts custom sidebar and footer
- Gravatar support
- Can include <iframe>s in the document (es: embed a Google Drive document)
- Can use custom CSS and JavaScript scripts
- White list for authorization on page reading and writing
- Detects unwritten pages (will appear in red)
- Automatically push to a remote

For code syntax highlighting, Jingo uses the `node-syntaxhighlighter` module. For the
list of supported languages, please refer to [this page](https://github.com/thlorenz/node-syntaxhighlighter/tree/master/lib/scripts).

Known limitations
-----------------

- The authentication is mandatory (no anonymous writing allowed). See also issue #4
- The repository is "flat" (no directories or namespaces)
- Authorization is only based on a regexp'ed white list with matches on the user email address
- There is one authorization level only (no "administrators" and "editors")
- At the moment there is no "restore previous revision", just a revision browser
- No scheduled pull or fetch from the remote is provided (because handling conflicts would be 
  a bit too... _interesting_)

Please note that at the moment it is quite "risky" to have someone else, other than jingo itself, 
have write access to the remote jingo is pushing to. The push operation is supposed to always be 
successfull and there is no pull or fetch. You can of course manage to handle pull requests yourself.

Installation
------------

`npm install jingo` or download the whole thing and run "npm install"

Jingo needs a config file and to create a sample config file, just run `jingo -s`, redirect the 
output on a file and then edit it. The config file contains all the available configuration keys. 
Be sure to provide a valid server hostname (like wiki.mycompany.com) for Google Auth to be able 
to get back to you.

If you define a `remote` to push to, then jingo will automatically issue a push to that remote every 
`pushInterval` seconds. You can also specify a branch using the syntax "remotename branchnama". If you 
don't specify a branch, that will be `master`.
Please note that before the `push`, a `pull` will also be issued (at the moment Jingo will not try
to resolve conflicts, though).

The basic command to run the wiki will then be

`jingo -c /path/to/config.yaml` (using `forever -w` is highly recommended, though)

Before running jingo you need to initialize its git repository somewhere (`git init` is enough).

If you define a remote to push to, be sure that the user who'll push has the right to do so.

If your documents reside in subdirectory of your repository, you need to specify its name using the 
`docSubdir` configuration option. The `repository` path _must_ be an absolute path pointing to the 
root of the repository.

If you want your wiki server to only listen to your `localhost`, set the configuration key `localOnly` to true.

Common problems
---------------

Sometimes upgrading your version of node.js could break the `iconv` module. Try updating it with `npm install iconv`.

Authentication and Authorization
--------------------------------

The _authorization_ section of the config file has two keys: anonRead and validMatches. If the 
anonRead is true, then anyone can read anything.
If anonRead is false you need to authenticate also for reading and then the email of the user _must_ 
match at least one of the regular expressions provided via validMatches, which is a comma separated 
list. There is no "anonWrite", though. To edit a page the user must be authenticated.

The authentication is mandatory to edit pages from the web interface, but jingo works on a git repository;
that means that you could skip the authentication altogether and edit pages with your editor and push 
to the remote that jingo is serving.

You can enable two authentication methodologies: _Google logins_ or a simple, locally verified 
username/password credentials match (called "alone").

If you use the _alone_ method, you can have _only one user_ accessing the wiki (thus the name).

The _Google Login_ doesn't need any configuration option: just enable it in the config file (it's enabled by default),
but assure yourself that the `baseUrl` configuration variable  points to something that Google can reach ("http://localhost:6067"
is fine but you could have Jingo proxied via another web server which listens on the :80, for example).

The _alone_ method uses a `username`, a `passwordHash` and optionally an `email`. The password is hashed
using a _non salted_ SHA-1 algorithm, which makes this method not the safest in the world but at least you don't have
a clear text password in the config file. To generate the hash, use the `--hash-string` program option: once
you get the hash, copy it in the config file.

You can enable both authentication options at the same time. The `alone` is disabled by default.

Customization
-------------

You can customize jingo in four different ways:

- add a left sidebar to every page: just add a file named `_sidebar.md` containing the markdown you 
  want to display to the repository. You can edit or create the sidebar from jingo itself, visiting 
  `/wiki/_sidebar` (note that the title of the page in this case is useless)
- add a footer to every page: the page you need to create is "_footer.md" and the same rules for the 
  sidebar apply
- add a custom CSS file, included in every page as the last file. The name of the file must be `_style.css` 
  and must reside in the repository. It is not possible to edit the file from jingo itself
- add a custom JavaScript file, included in every page as the last JavaScript file. The name of the file must 
  be `_script.js` and must reside in the repository. It is not possible to edit the file from jingo itself

All those files are cached (thus, not re-read for every page load, but kept in memory). This means that for 
every modification in _style.css and _script.js you need to restart the server (sorry, working on that). 
This is not true for the footer and the sidebar but ONLY IF you edit those pages from jingo (which in that 
case will clear the cache by itself).

jingo uses twitter Bootstrap and jQuery as its front-end components. 

Editing
-------

To link to another Jingo wiki page, use the Jingo Page Link Tag.

    [[Jingo Works]]

The above tag will create a link to the corresponding page file named
`jingo-works.md`. The conversion is as follows:

  1. Replace any spaces (U+0020) with dashes (U+002D)
  2. Replace any slashes (U+002F) with dashes (U+002D)

If you'd like the link text to be something that doesn't map directly to the
page name, you can specify the actual page name after a pipe:

    [[How Jingo works|Jingo Works]]

The above tag will link to `jingo-works.md` using "How Jingo Works" as the link text.


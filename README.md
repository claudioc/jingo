Jiky 
====

A simple git based wiki engine written for Node.js
The aim of wiki is to provide a very easy way to create a centralized documentation area for people used to work with git and markdown. It should fit well into a development team without the need to learn or install ad-hoc servers or applications. Jiky is very much inspired by the github wiki system (gollum), but tries to be more a stand-alone system than gollum is.

Features
--------

- No database: uses a git repository as the document archive
- No user management: authentication provided (only) via with Google logins
- Markdown for everything, [github flavored](http://github.github.com/github-flavored-markdown/)
- Uses [Markitup](http://markitup.jaysalvat.com/home/) as the markup editor, with a nice preview
- Inspired by the well known github [Gollum](https://github.com/github/gollum) wiki
- Show differences between document revisions
- Search through the content and the page names
- Layout accepts custom sidebar and footer
- Can also use custom css and JavaScript scripts
- White list for authorization on page reading and writing

Known limitations
-----------------

- There is only one authentication method (Google)
- The repository is "flat" (no directory)
- Authorization is only based on a regexp built white list on the user email address

Installation
------------

`npm install jiky`

Jiky needs a config file. To create a sample config file, just run `jiky -s`, redirect the output on a file and then edit it. The config file contains all the available configuration keys. Be sure to provide a valid server hostname (like wiki.mycompany.com) for Google Auth to be able to get back to you.

The basic command to run the wiki will then be

`jiky -c config.yaml`

Before running jiky you need to initialize its git repository somewhere (`git init` is sufficient).

Authentication
--------------

The _authentication_ section of the config file has two keys: anonRead and validMatches. If the anonRead is true, then anyone can read anything. If anonRead is false, then the email of the user MUST match at least one of the regular expressions provided via validMatches, which is a comma separated list. There is no "anonWrite", though. To edit a page the user must be authenticated.

The authentication is mandatory to edit pages from the web interface, but Jiky works on a git repository; that means that you could skip the authentication altogheter and edit pages with your editor and push to the remote that Jiky is serving.

Customization
-------------

You can customize Jiky in four different ways:

- add a left sidebar to every page: just add a file named `_sidebar.md` containing the markdown you want to display to the repository. You can edit or create the sidebar from Jiky itself, visiting `/wiki/_sidebar` (note that the title of the page in this case is useless)
- add a footer to every page: the page you need to create is "_footer.md" and the same rules for the sidebar apply
- add a custom CSS file, included in every page after every other CSS. The name of the file must be `_style.css` and must reside in the repository. It is not possible to edit the file from jiky itself
- add a custom JavaScript file, included in every page after every other JavaScript file. The name of the file must be `_script.js` and must reside in the repository. It is not possible to edit the file from jiky itself

All those files are cached (thus, not re-read for every page load, but kept in memory). This means that for every modification in _style.css and _script.js you need to restart the server. This is not tru for the footer and the sidebar ONLY if you edit those pages from jiky (which in that case will clear the cache by itself).

Jiky uses twitter Bootstrap and jQuery as its front-end components. 

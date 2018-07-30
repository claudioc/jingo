Intro
-----
This is a fork of Jingo (at the time of v1.8.5). Modifications to the source code have been made in order to add a number of features to Jingo and fix a couple bugs.

Merge Status: __pending__

ChangeLog
---------
### List of Modifications
- fixed bug in gitExec when repo path contains one or more spaces
- added redirection of synonyms to official page toggled in config
- added sidebar, main and footer column width customization to config
- added options to use regexp to redact exerpts of information for anonymous users to config
- added option to redact commit messages for anonymous users to config
- added option to redact entire pages from search and list for anonymous users to config
- added option to include initial paragraph in page list
- added media folder to static routes on page
- added override of standard favicon with any favicon in root of media folder
- added option to serve files from local version rather than CDN

### Mod Strategy
All changes and/or additions have been marked with comments which begin with "// MOD" so as to make it easier to hunt down changes. Existing code has been preserved whenever possible through the use of configuration flags to enable the additional/optional functionality of this fork. Also, additional methods and modules have been employed using naming conventions so as to least possibly conflict with future changes to the main branch.

Additional Configuration Options
--------------------------------

#### application.mediaSubdir (string: "")

  If you have media files you would like to host locally, such as a favicon, logo, images or css or js dependencies, inside a directory of the repository, specify its name here.

#### application.serveLocal (boolean: false)

  With this option, you can use a local copy of a resource instead of a CDN. Currently, this only applies to the Ubuntu font families requested in the head of each page.

#### features.pageSummaries (boolean: true)

  With this option, the html rendered version of the first paragraph of each page will be included its listing when a user browses all the pages.
  
#### features.caseSensitiveRedirects (boolean: false)

  With this option, you can force redirection to only match an alias if the cases match. For example, if you want to have any link to "Introduction" to redirect to Home.md, when this option is disabled, links to "introduction" would also redirect to Home.md.

#### redirects (map)
  
  If you would like to setup one or more aliases for a wiki entry, which will redirect to that page, you can include each alias and its associated page as a key:value pair in this map. Whenever a page request to an alias value is made, the server will return the page it is associated with and also include a line underneath the title of the page that indicates that the requested term redirects to this page. Since URLs cannot contain a space, all aliases with a word break need to replace that word break with a '-'.

#### layout.sidebarWidth (integer: 2)
  
  With this layout field, you can change the width of the sidebar content in desktop view between 0 and 10. The default width for Jingo is 2. The sidebarWidth + mainWidth (see below) cannot exceed 12.

#### layout.mainWidth (integer: 8)
  
  With this layout field, you can change the width of the main page in desktop view between 2 and 12. The default width for Jingo is 8. The sidebarWidth (see above) + mainWidth cannot exceed 12.

#### layout.footerWidth (integer: 8)
  
  With this layout field, you can change the width of the footer content in desktop view between 0 and 12. The default width for Jingo is 8.
  
#### layout.sidebarMobile (boolean: true)
  
  With this layout field, you can disable the sidebar content (from appearing on top of the page) when viewed from mobile devices.  

#### redaction.enabled (boolean: true)

  When redaction is enabled, it is possible to remove certain content from the view generated for anonymous users. Redaction also removes the commit records and history pages from all content rendered for anonymous users. Various different techniques are possible for redacting content (see below) using regular expression syntax. When redaction is enabled, all pages and searches will look for content which matches the regular expressions provided and remove it from anonymous views. A multi-line search is the default option for all regular expression patterns. If any part of a redaction regular expression is grouped, then the first group will be included for authenticated users. Without a grouping, the entire match is included for authenticated users. In addition, a number of the techniques use a combination of start and end pattern matching in order to redact the content in between. Whatever content appears between the regular expression and the next match for the pattern specified in endRedaction will be redacted from anonymous users. Regular expression occurs before pages go through HTML rendering and so will match the markdown as it appears for each entry.



 



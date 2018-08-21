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

#### assets.css (string: '')

  With the assets.css string, you can add the file path to any number of css sheets to be imported on page rendering in the \<head\> element prior to the customization style. In this way, you can add dependencies to the customization style. Separate stylesheets should be delineated with a comma and all such sheets must be located in the mediaSubdir folder or they will not be imported.

#### assets.js (string: '')

  With the assets.js string, you can add the file path to any number of js files to be appended to the bottom of the \<body\> element on page rendering prior to the customization script. In this way, you can add local dependencies to the customization script. Separate javascript files should be delineated with a comma and all such files must be located in the mediaSubdir folder or they will not be imported.
  
#### aliases (map)
  
  If you would like to setup one or more aliases for a wiki entry, which will redirect to that page, you can include each alias and its associated page as a key:value pair in this map. Whenever a page request to an alias value is made, the server will return the page it is associated with and also include a line underneath the title of the page that indicates that the requested term redirects to this page. Since URLs cannot contain a space, all aliases with a word break need to replace that word break with a '-'. Whereas the alias should not contain .md, the page it redirects to must include .md in its name.

#### layout.sidebarWidth (integer: 2)
  
  With this layout field, you can change the width of the sidebar content in desktop view between 0 and 10. The default width for Jingo is 2. The sidebarWidth + mainWidth (see below) cannot exceed 12.

#### layout.mainWidth (integer: 8)
  
  With this layout field, you can change the width of the main page in desktop view between 2 and 12. The default width for Jingo is 8. The sidebarWidth (see above) + mainWidth cannot exceed 12.

#### layout.footerWidth (integer: 8)
  
  With this layout field, you can change the width of the footer content in desktop view between 0 and 12. The default width for Jingo is 8.
  
#### layout.sidebarMobile (boolean: true)
  
  With this layout field, you can disable the sidebar content (from appearing on top of the page) when viewed from mobile devices.  

#### redaction.enabled (boolean: false)

  When redaction is enabled, it is possible to remove certain content from the view generated for anonymous users. Redaction also removes the commit records and history pages from all content rendered for anonymous users. A number of different techniques are provided for redacting content (see below) using regular expression syntax. When redaction is enabled, all pages and searches will look for content which matches the regular expressions provided and remove it from anonymous views. A global, multi-line search is the default option for all regular expression patterns, so if matching new lines is important, they must be included in the regular expression. If any part of a redaction regular expression is grouped, then all parts that are not inside a grouping will be redacted for both anonymous and authenticated users. Regular expression occurs before pages go through HTML rendering and so will match the markdown as it appears for each entry.
  
#### redaction.hiddenPage (string: "^<!(--\s?Hidden[\s\S]*?--)>")

  If any part of the document matches the regexp in hidden page, then the entire page will be removed from view from anonymous users and will return a 404 page error. In addition, the page will not show up in any search or list function. This is the only redaction expression that is not global, as it only requires one match to trigger.

#### redaction.privateContent (string: "<!(--\s?Private[\s\S]*?--)>([\s\S]*?)<!(--\s?End\s?--)>")

  Any sections of the document which match a privateContent regexp will be redacted from the document. Content inside the redaction will not show up in any search result. If no grouping is found in the regexp, then the entire regexp will be returned for the authenticated user. Otherwise, only the content inside groupings will be returned to the authenticated user.

#### redaction.futureContent (string: "<!(--\s?\d{4}\.\d{2}\.\d{2}[\s\S]*?--)>([\s\S]*?)<!(--\s?End\s?--)>")

  Any section of the document which matches an futureContent regexp will be tested to see if it should be redacted from anonymous users. This technique will construct a date from the first (4 to 10)integers it finds inside the matched content using the following order: YYYYMMDDHH and then see if that date exists beyond the current date. If the date it finds is in the future, it will redact the content from anonymous users. So, for example, an excerpt such as <!-- 2099.09.09 -->Future stuff<!-- End --> will be treated as content not to be revealed until on or after 20990909. If the date is in the past, it will reveal the content it finds in either the first group (if there is only one group in the regexp) or the second group (if there are two or more groupings). This technique requires at least one grouping to be specified in the regexp or it will have no effect.

#### redaction.sectionContent[0].expression (string: "<!(--\s?chapter-\d+[\s\S]*?--)>([\s\S]*?)<!(--\s?End\s?--)>")
  
  Any section of the document which matches an expression in the list of sectionContent will be tested to see if it should be redacted from anonymous users. This technique will look for the first group of integers it finds inside each match and compare that integer to the one provided in the associated current value. If the integer it finds is greater than the current  value, the section will be redacted from anonymous users. So, for example, an excerpt such as <!-- chapter-1000 -->A late chapter<!-- End --> would be redacted if the current chapter (current) is 9. Like the futureContent technique, if the current value is equal to or greater than the integer found, it will reveal the content it finds in either the first group (if there is only one group in the regexp) or the second group (if there are two or more groupings). This technique requires at least one grouping to be specified in the regexp or it will have no effect.

#### redaction.sectionContent[0].current (integer: 0)

  This field is included in order to evaluate the highest value in an associated sectionContent expression which is public. Any value that is found to be higher than the current value will be redacted from anonymous users.



 



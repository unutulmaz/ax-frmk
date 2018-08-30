# ax-frmk
AngularJS Framework
<div style="height:500px;overflow: auto;padding-right:5px;">
    I built this framework because the existing frameworks wasn't flexible enough for me, or simple to implement. All controls definitions (except control custom behaviour) are made in html view file.
    <br>With this framework you can:
    <br><strong>creating new project/module quickly</strong> has source files for new module, which allow you to run a new complex project in less then 30min (including database creation, backend configuration).
    <br><strong>development task automation</strong> - has configurable gulp tasks for: create index.html with all dependencies, compile scss, compile es6 to es5, minifying css, js, add/remove files from index.html, move files to wwwroot (public).
    Possibility to have different versions for js, html files in development and production. Deploy files by sftp protocol to remote server, in production or development.
    <br>Watchers used in development for add/remove file in index.html (with index.html regeneration), compile scss, verifying js files with jsHint, compile es6 to es5 (if you want), copy files to wwwroot or public folder <a href="https://github.com/bogdanim36/gulp-web-tasks">View on github</a>
    <br><strong>REST api</strong> very handy and light libraries for connecting to databases in php <a href="https://github.com/bogdanim36/php-rest-api">View on github</a>
    <br><strong>theme, css</strong> flexible way to load or build themes, adapted for mobile devices too.
    <br><strong>generic application content</strong> a generic main.html suitable for most application, with a side tree-view control for application menu.
    <br><strong>login and users administrations pages</strong> pages easy to customize, for login,and users administration.
    <br><strong>ax-table, ax-list</strong> data table, list having same core, with virtual rows and columns scroll, filtering, grouping and sorting, row editing, export.
    <br><strong>ax-grid</strong> more complex control having ax-table, editor, pivot table, master-details functions, profiles for pivot table or with different axTable configurations, columns layout, data grouping or sorting.
    <br><strong>ax-dropdown-popup</strong> very handy dropdown popup which is smart enough to auto arrange for being visible in browser window, no matter the launcher element is positioned
    <br><strong>ax-dropdown-list, ax-dropdown-table</strong> a dropdown list or table.
    <br><strong>ax-text</strong> text control.
    <br><strong>ax-text-with-zoom</strong> text control with popup editor.
    <br><strong>ax-date, ax-datetime</strong> date and datetime control based on uib-date-picker.
    <br><strong>ax-checkbox</strong> checkbox control.
    <br><strong>ax-radio-options</strong> a radio buttons control.
    <br><strong>ax-file</strong> control to upload file based on ng-upload.
    <br><strong>ax-autocomplete</strong> autocomplete control, having not only a readonly popup for select item you need, but also a popup contain an ax-table for editing source table (if you want/need)
    <br><strong>ax-filter-pane</strong> side panel control with multi selecting lists for setting filters.
    <br><strong>ax-scroller</strong> directive for horizontal toolbars, for defining scrollable container for buttons.
    <br><strong>ax-tabs</strong> a control for defining tabs control.
    <br><strong>ax-tree-view</strong> a tree view control.
    <br><strong>ax-json-tree-view</strong> a tree view for json objects
    <br><strong>ax-dynamic-template,ax-dynamic-template-url</strong> directive to include a template in any view
    <br><strong>ax-url</strong> attribute for defining trusted url.
    <br><strong>auth-service</strong> factory for auth.
    <br><strong>ax-api</strong> factory for connecting to backend.
    <br><strong>ax-data-set</strong> factory to store temporary data.
    <br><strong>ax-data-store</strong> factory with few information and methods needed across the application.
    <ax-attr class="ng-isolate-scope"><br><strong>template-factory</strong> factory for download html files from server.
    <br>At this moment the framework can be used with latest browsers Chrome (recommended), Fire Fox, Opera, Edge.
</div>
<br><br><strong>Steps for creating a new application with ax-frmk:</strong>
<br>  01. clone this repo: https://github.com/bogdanim36/project.
<br>  02. run git-clone-ax-frmk.bat (for window) 
<br>  03. Delete what plugins you dont need in app-modules/bower-libs, and add you want to use.
<br>  04. Add to .gitignore your own folders for modules from app-modules 
<br>  05. In app-modules/angular-modules.js include what angular modules you are using (if you are using some extra plugin, whitch are installed in app-modules/bower-libs
<br>  06. In app-modules/ax-api-config.js setup your api
<br>  07. In app-modules/ax-components-config.js setup ax-component params
<br>  08. In app-modules/modules-config.js config your applciation name, version, and other parameters
<br>  09. Add dependecies for yours added plugins in app/modules/gul-config.json. 
<br>  10. Check gulpfile.config.json and gulpfile.sftp.json and config as you need. If you are not agreed with thise project structure files, =you can changed, but you must change also in gulpfile.config.json all the path changed.
<br>  11. Create your database, user, password, tables.
<br>  12. Create your api, if not using php-api. If using Php -Api, use config.php to setup php-api.
<br>  13. Create you template and pages for your application.
<br>  14. Start Es6-Dev-watch. From this point keep it open while developing. The deployng gulp task can work in same time, whithout problems.
<br>  All theses steps can take maximum 30min, and you can start to work on application pages and views.

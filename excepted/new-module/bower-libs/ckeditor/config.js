/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function (config) {

	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'dialogui,dialog,about,a11yhelp,basicstyles,blockquote,clipboard,panel,floatpanel,menu,contextmenu,resize,button,toolbar,elementspath,enterkey,entities,popup,filebrowser,floatingspace,listblock,richcombo,format,horizontalrule,htmlwriter,wysiwygarea,image,indent,indentlist,fakeobjects,link,list,magicline,maximize,pastetext,pastefromword,removeformat,showborders,sourcearea,specialchar,menubutton,scayt,stylescombo,tab,table,tabletools,undo,wsc,lineutils,widget,image2,imageresize';
	config.skin = 'office2013';
	// %REMOVE_END%

	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard', groups: ['clipboard', 'undo'] },
		{ name: 'editing', groups: ['find', 'selection', 'spellchecker'] },
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'forms' },
		{ name: 'tools' },
		{ name: 'document', groups: ['mode', 'document', 'doctools'] },
		{ name: 'others' },
		'/',
		{ name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
		{ name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'] },
	    { name: 'font' },
	    { name: 'styles' },
		{ name: 'colors' }
	];

	// Remove some buttons provided by the standard plugins, which are
	// not needed in the Standard(s) toolbar.
	config.removeButtons = 'addImage,addFile';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image2:Upload;link:advanced;flash:Upload';

	// - customization
	config.extraPlugins = 'font,simpleuploads,imagecrop,colordialog,colorbutton,panelbutton,justify,flash,youtube';
	config.filebrowserUploadUrl = '/MC/vendor/ckeditor/plugins/uploader/upload.php';
	config.simpleuploads_containerover = 'box-shadow: 0 0 10px 1px #99DD99 !important;';
	config.simpleuploads_editorover = 'box-shadow: 0 0 10px 1px #999999 inset !important;';
	config.width = 800;
	config.height = 300;

	CKEDITOR.config.enterMode = CKEDITOR.ENTER_BR;
	CKEDITOR.config.forcePasteAsPlainText = false; // default so content won't be manipulated on load
	CKEDITOR.config.basicEntities = true;
	CKEDITOR.config.entities = true;
	CKEDITOR.config.entities_latin = false;
	CKEDITOR.config.entities_greek = false;
	CKEDITOR.config.entities_processNumerical = false;
	CKEDITOR.config.fillEmptyBlocks = function (element) {
		return true; // DON'T DO ANYTHING!!!!!
	};
	config.allowedContent = true;
	config.extraAllowedContent = "span;span[u];style;*[id];*(*);*{*};ul div[*];script";
	config.imagecrop = {
		cropsizes: [
            { width: 120, height: 120, title: "120px square", name: "Thumbnail" },
            { width: 400, height: 300, title: "400 * 300", name: "Content picture" },
            { width: 960, height: 350, title: "960 * 350", name: "Big header" },
            { width: 0, height: 0, title: "No restrictions", name: "Free crop" }
		],
		formats: [
            { title: "JPG - Low quality", value: "jpg60" },
            { title: "JPG - Normal quality", value: "jpg80", attributes: "selected" },
            { title: "JPG - High quality", value: "jpg90" },
            { title: "PNG (for texts)", value: "png" }
		],
		maximumDimensions: { width: 1024, height: 1024 }
	};
	//config.justifyClasses = ['AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify'];
};
CKEDITOR.dtd.$removeEmpty.span = 0;


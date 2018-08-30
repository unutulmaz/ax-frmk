/**
 * @file Imagecrop plugin. Apply crop and resize to the images in CKEditor
 *		 Version 1.3.5
 * Copyright (C) 2014 Uritec SL
 *
 */
(function() {
"use strict";

CKEDITOR.plugins.add( 'imagecrop',
{
	requires : [ 'dialog', 'simpleuploads' ],

	// Translations
	lang : 'en,de,es,fr',
	icons: 'imagecrop', // %REMOVE_LINE_CORE%

	init : function( editor )
	{
		if (!editor.config.imagecrop)
			editor.config.imagecrop = {};

		var command = editor.addCommand( 'ImageCrop', new CKEDITOR.dialogCommand( 'ImageCrop', {
				requiredContent : 'img[src]'
			} ) );

		CKEDITOR.dialog.add( 'ImageCrop', this.path + 'dialogs/cropdialog.js' );

		// Check for pasted images:
		editor.on( 'simpleuploads.localImageReady', function checkImageCrop(ev)
		{
			var data = ev.data,
				editor = ev.editor;

			ev.cancel();
			ev.stop();

			// If the user drops or select several images we must show them to the user one by one
			CKEDITOR.plugins.imagecrop.processImage(editor, data);
		});


		// If the "menu" plugin is loaded, register the menu items.
		if ( editor.addMenuItems )
		{
			editor.addMenuItems(
				{
					imagecrop :
					{
						label : editor.lang.imagecrop.menu,
						command : 'ImageCrop',
						icon : this.path + 'icons/imagecrop.png',	// %REMOVE_LINE_CORE%
						group : 'image',
						order : 11
					}
				});
		}

		// If the "contextmenu" plugin is loaded, register the listeners.
		if ( editor.contextMenu )
		{
			// check the image
			editor.contextMenu.addListener( function( element, selection )
				{
					var img = getImage( element );
					if ( !img )
						return null;

					if (!editor.config.imagecrop.skipCORScheck && !CKEDITOR.plugins.imagecrop.testCORS(img.$))
					{
						return null;
					}
					// And say that this context menu item must be shown
					return { imagecrop : CKEDITOR.TRISTATE_OFF  };
				});
		}

		// Check if element is really an image, discarding fake elements, and taking into account the "enhanced image" widget
		var getImage = function( element ) {
			if (editor.widgets)
			{
				var widget = editor.widgets.focused;

				// hardcoded image2
				if (widget && (widget.name == "image2"||widget.name == "image") )
				{
					var el = widget.element;
					if (!el)
						return null;

					if (el.getName() == "img")
						return el;

					var children = el.getElementsByTag("img");
					if (children.count()==1)
						return children.getItem(0);

					return null; // failed!!!
				}
			}

			if (!element || !element.is( 'img' ) || (element.data && element.data( 'cke-realelement' )) || element.isReadOnly() )
				return null;

			return element;
		};


	} //Init

} );

var processingQueue=[];
CKEDITOR.plugins.imagecrop = {

	processImage: function(editor, data) {
		// Store it as the last item in the queue
		processingQueue.push( {editor: editor, data:data} );

		// If it's the only one, process it now.
		if (processingQueue.length==1)
		{
			editor.openDialog("ImageCrop", function(dialog) {
				dialog.srcData = data;
			} );
		}

	},

	finishedImage: function() {
		// remove the oldest one from the queue
		processingQueue.shift();

		// if there's something pending, process it now.
		if (processingQueue.length > 0)
		{
			window.setTimeout( function() {
				// use again the oldest one
				var o = processingQueue[0];
				o.editor.openDialog("ImageCrop", function(dialog) {
					dialog.srcData = o.data;
				} );
			}, 0);
		}

	},

	// Tests if we can use the provided img in the canvas or whether it requieres a CORS request
	testCORS: function (img) {
		// Copy just 1 pixel and check if we can read it
		var canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		var context = canvas.getContext("2d");
		context.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
		try
		{
			// if it's cross domain this will throw an exception
			context.getImageData(0, 0, 1, 1);
		}
		catch (ex)
		{
			return false;
		}

		return true;
	}

};

})();
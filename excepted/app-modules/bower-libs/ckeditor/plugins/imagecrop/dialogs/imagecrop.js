(function(w, $) {
"use strict";

var imageCrop = {};
w.imageCrop = imageCrop;

	var escala,
		FichAncho,
		FichAlto,
		jcrop_api,
		recorteDeseado,
		recorteActivo;
	var escalaEdicion;
	var $div, $laImagen;
	var IdPrefix;
	var lang;

	var originalImage, originalFile, originalName;
	var config;
	function initImageCrop() {
		if (jcrop_api)
		{
			jcrop_api.destroy();
			jcrop_api = null;
		}
		recorteDeseado = null;
		recorteActivo = null;

		if ($div.data("imagecrop-ready"))
			return;

		$div.data("imagecrop-ready", true);

		createUI($div[0]);

		// manejadores de eventos: (solo una vez)

		$div.keydown(keyDownDocument);
		$div.find(".zoomin").click(alejarZoom);
		$div.find(".zoomout").click(acercarZoom);

		// Select cropping size
		$div.find(".tamanos a").click(function(ev) {
			ev.preventDefault();

			if ($(this).hasClass("elegido"))
				return;

			var ancho = $(this).data("ancho"),
				alto = $(this).data("alto");

			if ((ancho && ancho > FichAncho) && (alto && alto > FichAlto) ) {
				alert( lang.imageTooSmall.replace("{0}", ancho).replace("{1}", alto) );
				return;
			}

			if (ancho && ancho > FichAncho) {
				alert( lang.imageTooNarrow );
				ancho = FichAncho;
			}
			if (alto && alto > FichAlto) {
				alert( lang.imageTooShort );
				alto = FichAlto;
			}

			$(this).addClass("elegido");
			$div.find(".tamanos").addClass("YaElegido");

			$div.find(".acciones").show();

			recorteDeseado = { ancho: ancho, alto: alto };

			$div.find(".acciones table")[(recorteDeseado.ancho>0 && recorteDeseado.alto>0) ? "hide" : "show"]();

			iniciarCrop();
		});

		// cancel cropping
		$div.find(".acciones .atras").click(function() {
			jcrop_api.destroy();
			jcrop_api = null;

			$div.find(".acciones").hide();
			recorteDeseado = null;
			recorteActivo = null;

			$(".elegido").removeClass("elegido");
			$div.find(".tamanos").removeClass("YaElegido");

			return false;
		});

		// select the crop area
		$div.find(".acciones .siguiente").click(function(ev) {
			ev.preventDefault();
			recorteActivo = jcrop_api.tellSelect();
			if (!recorteActivo.w) {
				alert( lang.mustSelectCrop );
				return;
			}

			jcrop_api.destroy();
			jcrop_api = null;

			escalaEdicion = escala;
			cambiarEscala(1);

			$div.find(".acciones table")[(recorteDeseado.ancho>0 && recorteDeseado.alto>0) ? "show" : "hide"]();

			var ancho = recorteDeseado.ancho || Math.round(recorteActivo.w);
			var alto = recorteDeseado.alto || Math.round(recorteActivo.h);
			$("#" + IdPrefix + "_nuevoAncho").text(ancho + "px");
			$("#" + IdPrefix + "_nuevoAlto").text(alto + "px");

			//  Apply crop&resize only once and then reuse it for the different toDataURL options
			CropAndResize($laImagen[0], recorteActivo, ancho, alto, function(resizedCanvas) {
				$div.find(".trans").show();
				tmpCanvas = resizedCanvas;

				CargarPreview();
			});

		});

		// Volver atrás a recortar
		$div.find(".trans .atras").click(function(ev) {
			$div.find(".acciones").show();
			$div.find(".trans").hide();

			$div.find(".imagePreview").show();
			$div.find(".previsualizaciones").hide().html("");
			tmpCanvas = null;
			$("#" + IdPrefix + "_tamPreview span").hide().text("");

			cambiarEscala(escalaEdicion);

			$div.find(".acciones table")[(recorteDeseado.ancho>0 && recorteDeseado.alto>0) ? "hide" : "show"]();
			iniciarCrop();
			return false;
		});

		// save
		$div.find(".trans .siguiente").click(function(ev) {
			imageCrop.onCropClick();
			return false;
		});

		$("#" + IdPrefix + "_formato").change(CargarPreview);
	}

	function createUI(container) {
		var cropsizes = "",
			i;
		var aSizes = (config && config.cropsizes) || [{title:"free cropping", name:"No crops defined"}];
		for(i = 0; i<aSizes.length; i++){
			var size = aSizes[i];
			cropsizes += "<a class='cke_dialog_ui_button' href='#' data-ancho='" + (size.width || "") + "' data-alto='" + (size.height || "") +
					"' title='" + (size.title || "") + "'><span class='cke_dialog_ui_button'>" + (size.name || i) + "</span></a>";
		}

		var formats = "";
		var aFormats = (config && config.formats) || [
			{ title:"JPG - Low Quality", value:"jpg60"},
			{ title:"JPG - Normal Quality", value:"jpg80", attributes:"selected"},
			{ title:"JPG - High Quality", value:"jpg90"},
			{ title:"PNG (for texts)", value:"png"}
		];
		for(i = 0; i<aFormats.length; i++){
			var format = aFormats[i];
			formats += "<option value='" + (format.value) + "' " + (format.attributes || "") +
					">" + (format.title || format.value) + "</option>";
		}

		container.innerHTML = '<div class="imagecrop-main">' +
			'	<div class="imagecrop-sidebar">' +
			'		<p class="imagecrop-zoom">' +
			'			<span class="zoombutton zoomin" title="' + lang.zoomIn + '"></span>' +
			'			<span class="zoombutton zoomout" title="' + lang.zoomOut + '"></span>' +
			'			<span class="escala"></span>' +
			'		</p>' +
			'		<fieldset>' +
			'			<legend>' + lang.originalImage + '</legend>' +
			'			<table class="tDatos">' +
			'				<tr>' +
			'					<th>' + lang.width + '</th>' +
			'					<td id="' + IdPrefix + '_PrevAncho"></td>' +
			'				</tr>' +
			'				<tr>' +
			'					<th>' + lang.height + '</th>' +
			'					<td id="' + IdPrefix + '_PrevAlto"></td>' +
			'				</tr>' +
			'				<tr>' +
			'					<th>' + lang.fileSize + '</th>' +
			'					<td id="' + IdPrefix + '_PrevPeso"></td>' +
			'				</tr>' +
			'			</table>' +
			'		</fieldset>' +
			'		<fieldset class="activo">' +
			'			<legend>' + lang.targetImage + '</legend>' +
			'			<div class="tamanos">' +
			'				<p class="instruccion">' + lang.chooseSizeInstructions + '</p>' +
							cropsizes +
			'			</div>' +
			'			<div class="acciones" style="display: none">' +
			'				<p class="instruccion">' + lang.croppingInstructions + '</p>' +
			'				<table class="tDatos">' +
			'					<tr>' +
			'						<td id="' + IdPrefix + '_recorteAncho"></td>' +
			'						<td>*</td>' +
			'						<td id="' + IdPrefix + '_recorteAlto"></td>' +
			'					</tr>' +
			'				</table>' +
			'				<a href="#" class="atras">' + lang.back + '</a>' +
			'				<a class="cke_dialog_ui_button siguiente" href="#"><span class="cke_dialog_ui_button">' + lang.applyCrop + '</span></a>' +
			'			</div>' +
			'			<div class="trans" style="display: none">' +
			'				<p class="instruccion">' + lang.formatInstructions + '</p>' +
			'				<label for="formato">' + lang.chooseFormat + '</label>' +
			'				<select id="' + IdPrefix + '_formato">' + formats + '</select>' +
			'				<table class="tDatos">' +
			'					<tr>' +
			'						<th>' + lang.width + '</th>' +
			'						<td id="' + IdPrefix + '_nuevoAncho"></td>' +
			'					</tr>' +
			'					<tr>' +
			'						<th>' + lang.height + '</th>' +
			'						<td id="' + IdPrefix + '_nuevoAlto"></td>' +
			'					</tr>' +
			'					<tr>' +
			'						<th>' + lang.fileSize + '</th>' +
			'						<td><p id="' + IdPrefix + '_tamPreview"></p></td>' +
			'					</tr>' +
			'				</table>' +
			'				<br><br>' +
			'				<a href="#" class="atras">' + lang.back + '</a>' +
			'				<a class="cke_dialog_ui_button siguiente" href="#"><span class="cke_dialog_ui_button">' + lang.save + '</span></a>' +
			'			</div>' +
			'		</fieldset>' +
			'</div>' +
			'<div class="imagecrop-viewer">' +
			'		<div class="imagePreview"><img alt=""></div>' +
			'		<div class="previsualizaciones"></div>' +
			'	</div>' +
			'</div>';
	}

	imageCrop.showUI = function(theDiv, srcImage, srcName, srcFile, prefix, lng, cfg) {
		IdPrefix = prefix;
		lang = lng;
		originalImage = srcImage;
		originalName = srcName;
		originalFile = srcFile;
		config = cfg;

		// Get a jQuery object
		$div = $( theDiv );

		initImageCrop();

		$laImagen = $div.find(".imagePreview img");
		$laImagen[0].style.width = "";
		$laImagen[0].style.height = "";

		// Copy the CrossOrigin attribute from the source image
		// Firefox seems to have problems (in some versions) so it doesn't display the image if it's base64 and has this attribute
		if (srcImage.crossOrigin)
			$laImagen[0].crossOrigin = srcImage.crossOrigin;

		$laImagen[0].src = srcImage.src;

		// Leer la imagen
		FichAncho = srcImage.width;
		FichAlto = srcImage.height;

		document.getElementById(IdPrefix + "_PrevAlto").innerHTML = FichAlto + "px";
		document.getElementById(IdPrefix + "_PrevAncho").innerHTML = FichAncho + "px";
		var peso;
		// en el inicial, Chrome lo carga como Blob en vez de base64
		if (srcFile && srcFile.size)
			peso = formatearTamano(srcFile.size);
		else
			peso = CalcularTamanoImg(srcImage.src);
		document.getElementById(IdPrefix + "_PrevPeso").innerHTML = peso;

		// resetear
		if (jcrop_api)
		{
			jcrop_api.destroy();
			jcrop_api = null;
		}
		$div.find(".acciones").hide();
		recorteDeseado = null;
		recorteActivo = null;

		$(".elegido").removeClass("elegido");
		$div.find(".tamanos").removeClass("YaElegido");

		$div.find(".trans").hide();
		$div.find(".imagePreview").show();
		$div.find(".previsualizaciones").html("").hide();
		tmpCanvas = null;
		$("#" + IdPrefix + "_tamPreview span").hide().text("");

		cambiarEscala(1);
		window.setTimeout(function() {
			var viewer = $div.find(".imagecrop-viewer");
			cambiarEscala( ReescalarImagen(FichAncho, FichAlto, viewer.width(), viewer.height()) );
		},50);
	};

	function crop_resize_Image(srcImage, recorteActivo, ancho, alto, name, callback) {
		var cropCanvas = document.createElement("canvas");
		var width = Math.round(recorteActivo.w);
		var height = Math.round(recorteActivo.h);
		cropCanvas.width = width;
		cropCanvas.height = height;
		cropCanvas.getContext("2d").
			drawImage(srcImage, Math.round(recorteActivo.x), Math.round(recorteActivo.y), width, height, 0, 0, width, height);

		var resizedCanvas = document.createElement("canvas");
		resizedCanvas.width = ancho;
		resizedCanvas.height = alto;

		/*
		{
			quality - 0..3. Default = 3 (lanczos, win=3).
			alpha - use alpha channel. Default = false.
			unsharpAmount - 0..500. Default = 0 (off). Usually between 50 to 100 is good.
			unsharpThreshold - 0..100. Default = 0. Try 10 as starting point.
			  }
		*/
		var picaOptions = {quality:3};
		// Preserve alpha for pngs, of course then the image must be saved as png
		if (/\.png$/.test(name))
		{
			picaOptions.alpha=true;
		}
		pica.resizeCanvas(cropCanvas, resizedCanvas, picaOptions, function (err) {
			callback(resizedCanvas);
		});

	}

	// Public API
	// Resize without UI
	imageCrop.ResizeImage = function(img, width, height, name, callback) {
		if (img.width==0) {
			window.setTimeout(function() {
				imageCrop.ResizeImage(img, width, height, name, callback);
			}, 50);
			return;
		}

		var recorte = {
				x: 0,
				y: 0,
				w: img.width,
				h: img.height
		}
		crop_resize_Image(img, recorte, width, height, name, function(canvas) {
			// By default we convert to jpg80
			var formato = "jpg80";
			var sizes = "_" + width + "x" + height;

			callback(generateDataUrl(canvas, formato), getNewName(name, sizes, formato));
		});
	}

	// Public API
	imageCrop.getImage = function( callback ) {

		var formato = $("#" + IdPrefix + "_formato").val();
		var imgPreview = $("#" + IdPrefix + "_Prev_" + formato + " img");
		var ancho, alto, sizes = "";

		if (jcrop_api)
		{
			recorteActivo = jcrop_api.tellSelect();
			jcrop_api.destroy();
			jcrop_api = null;
		}
		if (recorteActivo)
		{
			ancho = recorteDeseado.ancho || Math.round(recorteActivo.w);
			alto = recorteDeseado.alto || Math.round(recorteActivo.h);
			sizes = "_" + ancho + "x" + alto;
		}

		// The preview was already created and ready to use
		if (imgPreview.length>0)
		{
			callback(imgPreview[0].src, getNewName(originalName, sizes, formato));
			return;
		}

		// The user did have a selection but didn't crop it
		if (recorteActivo)
		{
			$div.find(".trans").hide();

			// it might be lenghty...
			CropAndResize(originalImage, recorteActivo, ancho, alto, function(canvas) {
				// By default we convert to jpg80
				var formato = "jpg80";

				callback(generateDataUrl(canvas, formato), getNewName(originalName, sizes, formato));
			});

			return;
		}

		// Just pressed OK

		var maximums = config.maximumDimensions;
		// Check if there are maximum dimensions defined:
		if (maximums && ((maximums.width && maximums.width<FichAncho) || (maximums.height && maximums.height<FichAlto)))
		{
			ancho = FichAncho;
			alto = FichAlto;
			// calculate proper dimensions to respect maximums and keep the aspect ratio:
			if (maximums.width && maximums.width<ancho)
			{
				ancho = maximums.width;
				alto = Math.round(FichAlto * (maximums.width/FichAncho));
			}
			if (maximums.height && maximums.height<alto)
			{
				alto = maximums.maxHeight;
				ancho = Math.round(FichAncho * (maximums.height/FichAlto));
			}

			// just resize it
			var recorteActivo = {
				x:0,
				y:0,
				w:FichAncho,
				h:FichAlto
			};
			sizes = "_" + ancho + "x" + alto;

			CropAndResize(originalImage, recorteActivo, ancho, alto, function(canvas) {
				// By default we convert to jpg80
				var formato = "jpg80";

				callback(generateDataUrl(canvas, formato), getNewName(originalName, sizes, formato));
			});
			return;
		}

		// no changes have been done here
		callback(null, null);
	};

	// Public Method to convert an image to another format (eg: jpg80)
	imageCrop.convertImage = function(srcImag, name, format) {
		var canvas = document.createElement("canvas");
		canvas.width = srcImag.width;
		canvas.height = srcImag.height;
		canvas.getContext("2d").drawImage(srcImag, 0, 0);

		return {
			image : generateDataUrl(canvas, format),
			name : getNewName(name, "", format)
		};
	};

	// Provides a new name adding the new size and type extension
	function getNewName(name, sizes, format) {
		var nuevaExt = sizes + "." + format.substr(0,3);
		name = name.replace(/\.[^.]*$/, nuevaExt);
		if (name.indexOf(".")<0)
			name += nuevaExt;

		return name;
	}

	function acercarZoom() {
		var e2 = escala;
		if (e2 >= 1) {
			e2 += 1;
			if (e2 > 10) e2 = 10;
		} else {
			e2 = Math.round(1 / e2);
			e2 = 1 / (e2 - 1);
		}
		cambiarEscala(e2);
	}

	function alejarZoom () {
		var e2 = escala;
		if (e2 > 1)
			e2 -= 1;
		else {
			e2 = Math.round(1 / e2) + 1;
			if (e2 > 10) e2 = 10;
			e2 = 1 / (e2);
		}
		cambiarEscala(e2);
	}

	function keyDownDocument(e) {
		switch (e.keyCode) {
			case 106: // *
				cambiarEscala(1);
				e.preventDefault();
				break;
			case 107: // +
				acercarZoom();
				e.preventDefault();
				break;
			case 109: // -
				alejarZoom();
				e.preventDefault();
				break;
		}
	}

	function cambiarEscala(nueva) {
		escala = nueva;
		var oEscala = $div.find(".escala");
		if (escala != 1) {
			var sTxt;
			if (escala > 1)
				sTxt = escala + ":1";
			else
				sTxt = "1:" + Math.round(1 / escala);

			oEscala.html( lang.scale.replace("{0}", sTxt) );
		} else {
			oEscala.html("&nbsp;"); // Chrome does strange things with an empty span
		}

		if (jcrop_api) {
			recorteActivo = jcrop_api.tellSelect();
			jcrop_api.destroy();

			if (!recorteActivo.w)
				recorteActivo = null;
		}
		if (recorteActivo) {
			var ancho = recorteDeseado.ancho || recorteActivo.w;
			var alto = recorteDeseado.alto || recorteActivo.h;
			$div.find(".previsualizaciones img").width(ancho * escala + "px").height(alto * escala + "px");
		}
		$laImagen.width(FichAncho * escala + "px").height(FichAlto * escala + "px");

		if (jcrop_api)
			iniciarCrop();
	}

	function iniciarCrop() {
		$laImagen.Jcrop({
			trueSize: [FichAncho, FichAlto],
			aspectRatio: recorteDeseado.ancho / recorteDeseado.alto,
			minSize: [recorteDeseado.ancho, recorteDeseado.alto],
			onChange: showCoords,
			onSelect: showCoords,
			bgColor: '',
			allowSelect: false // evitar que se libere la selección
		}, function() {
			jcrop_api = this;
			$(".jcrop-keymgr").keydown(keyDownDocument);

			if (recorteActivo)
				jcrop_api.setSelect([recorteActivo.x, recorteActivo.y, recorteActivo.x2, recorteActivo.y2]);
			else {
				jcrop_api.animateTo([0, 0, FichAncho || 50, FichAlto|| 50]);
//				jcrop_api.animateTo([0, 0, recorteDeseado.ancho || 50, recorteDeseado.alto || 50]);
			}
		});
	}



	function showCoords(c) {
		$("#" + IdPrefix + "_recorteAncho").text(c.w.toFixed());
		$("#" + IdPrefix + "_recorteAlto").text(c.h.toFixed());
	}

	function ReescalarImagen(ancho, alto, maxAncho, maxAlto) {
		var escalado = 1,
		anchoTmp = ancho,
		altoTmp = alto;

		if (!ancho || !alto) return 1;

		if (altoTmp > maxAlto) {
			escalado = maxAlto / alto;
			altoTmp = maxAlto;
			anchoTmp = Math.round(ancho * escalado);
		}
		if (anchoTmp > maxAncho) {
			escalado = maxAncho / ancho;
			anchoTmp = maxAncho;
		}

		if (escalado < 1) {
			var escala2;
			for (var i = 1; i < 10; i++) {
				escala2 = 1 / i;
				if (escalado > escala2)
					break;
			}
			escalado = escala2;
		}

		return escalado;
	}


	/**
		Given a Canvas and a string format returns a string with the data URL of the contents in that format
	*/
	function generateDataUrl(canvas, format) {
		var mime, quality;
		switch (format)
		{
			case "jpg60":
				mime="image/jpeg";
				quality=0.6;
				break;
			case "jpg80":
				mime="image/jpeg";
				quality=0.8;
				break;
			case "jpg90":
				mime="image/jpeg";
				quality=0.9;
				break;
			case "png":
				mime="image/png";
				quality=1;
				break;
		}

		return canvas.toDataURL(mime, quality);
	}

	function CalcularTamanoImg(src) {
		if (src.substr(0,5)=="data:")
		{
			var encoded = src.length-22;
			return formatearTamano((encoded*4/3));
		}
		// use xhr for real files
		// TODO
		return "";
	}

	function formatearTamano(tamano)
	{
		if (tamano===0)
			return "0";
		if (tamano<1024)
			return "1 Kb";
		if (tamano<(1024*1024))
			return (tamano/1024).toFixed() + " Kb";

		return (tamano/ (1024*1024)).toFixed(2).replace(".", ",") + " Mb";
	}

	// Crop, then apply high quality resize and return a Canvas
	function CropAndResize(srcImage, recorteActivo, ancho, alto, callback)
	{
		$div.find(".acciones").hide();

		$div.find(".imagePreview").hide();
		$div.find(".previsualizaciones").html("<div class='imagecrop-processing'><div>" + lang.processing + "</div></div>").show();

		crop_resize_Image(srcImage, recorteActivo, ancho, alto, originalName, callback);
	}

	var tmpCanvas;

	function CargarPreview() {
		$div.find(".previsualizaciones div").hide();
		$("#" + IdPrefix + "_tamPreview span").hide();

		var formato = $("#" + IdPrefix + "_formato").val();
		var preview = $("#" + IdPrefix + "_Prev_" + formato);

		if (!preview.length) {
			preview = $("<div id='" + IdPrefix + "_Prev_" + formato + "'></div>");
			$div.find(".previsualizaciones").append(preview);
			$("#" + IdPrefix + "_tamPreview").append( $("<span id='" + IdPrefix + "_tam_" + formato + "'></span>") );
		}

		if (!preview.html()) {
			var ancho = recorteDeseado.ancho || Math.round(recorteActivo.w);
			var alto = recorteDeseado.alto || Math.round(recorteActivo.h);

			var src = generateDataUrl(tmpCanvas, formato);

			$("#" + IdPrefix + "_tam_" + formato).text(CalcularTamanoImg(src));

			var img = document.createElement("img");
			img.src = src;
			img.style.width = (ancho * escala) + "px";

			preview.append(img);
		}
		$("#" + IdPrefix + "_tam_" + formato).show();

		preview.show();
	}

})(window, jQuery);
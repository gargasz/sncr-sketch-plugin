@import 'lib/functions.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var layers = [page layers];

	// Selection variables
	var selection = context.selection;
	var selectedCount = selection.count();

	// User	variables
	var sliceSettings = showSliceSettings();
	var pageBounds = doc.currentPage().contentBounds();

	// Set variables per bound type
	if (sliceSettings.sliceType >= 0) {
		if (sliceSettings.sliceType == 1) {
			// Layout variables
			var margin = 100;
			var sliceX = pageBounds.origin.x - margin;
			var sliceY = pageBounds.origin.y - margin;
			var sliceWidth = pageBounds.size.width + (margin*2);
			var sliceHeight = pageBounds.size.height + (margin*2);

			// Create slice
			createSlice([page name],sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,false,true);

			// Feedback to user
			doc.showMessage("Slice created around artboards!");
		} else if (sliceSettings.sliceType == 2) {
			// Get layout values of selections
			var selectionSize = getSelectionSize(artboards);

			// Layout variables
			var margin = 500;
			var sliceX = 200;
			var sliceY = 800;
			var sliceWidth = selectionSize.width + sliceX + margin;
			var sliceHeight = selectionSize.height + sliceY + margin;
			var minWidth = 7900;
			var minHeight = 4420;

			// Override with minimum slice sizes if necessary
			sliceWidth = (sliceWidth < minWidth) ? minWidth : sliceWidth;
			sliceHeight = (sliceHeight < minHeight) ? minHeight : sliceHeight;

			// Create slice
			createSlice([page name],sliceWidth,sliceHeight,-sliceX,-sliceY,sliceSettings,true,true);

			// Feedback to user
			doc.showMessage("Slice created around artboards!");
		} else {
			if (selectedCount < 2) {
				var app = NSApplication.sharedApplication();
				app.displayDialog_withTitle("Please select two or more artboards.","Create Slice Around Artboards")
			} else {
				// Get layout values of selections
				var selectionSize = getSelectionSize(selection);

				// Layout variables
				var margin = 100;
				var sliceX = selectionSize.minX - margin;
				var sliceY = selectionSize.minY - margin;
				var sliceWidth = selectionSize.width + (margin*2);
				var sliceHeight = selectionSize.height + (margin*2);

				// Create slice
				createSlice('Selections',sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,false,false);

				// Feedback to user
				doc.showMessage("Slice created around selections!");
			}
		}
	}

	function createSlice(name,sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,isLocked,isUnique) {
		// Slice variables
		var sliceLayer;
		var sliceName = name;
		var sliceColor = MSColor.colorWithSVGString('#EFEFEF');
		var exportScale = sliceSettings.exportScale;
		var exportFormat = sliceSettings.exportFormat;

		// If slice should be unique
		if (isUnique) {
			// Find slice with provided name
			sliceLayer = findLayerByName(page,sliceName,MSSliceLayer);

			// Delete slice if one already exists
			if (sliceLayer) {
				sliceLayer.parentGroup().removeLayer(sliceLayer);
			}
		}

		// Create new slice
		sliceLayer = [MSSliceLayer new];
		sliceLayer.setName(sliceName);
		sliceLayer.setBackgroundColor(sliceColor);
		sliceLayer.setIsLocked(isLocked);
		sliceLayer.hasBackgroundColor = true;

		// Set slice dimensions
		sliceLayer.frame().setX(sliceX);
		sliceLayer.frame().setY(sliceY);
		sliceLayer.frame().setWidth(sliceWidth);
		sliceLayer.frame().setHeight(sliceHeight);

		// Insert slice into page
		doc.currentPage().addLayers([sliceLayer]);

		// Select the slice and move it to the bottom of the layer list
		sliceLayer.select_byExpandingSelection(true,false);
		actionWithType("MSMoveToBackAction",context).moveToBack(null);

		// Replace default slice export format
		sliceLayer.exportOptions().removeAllExportFormats();

		var format = sliceLayer.exportOptions().addExportFormat();
		format.setScale(exportScale);
		format.setFileFormat(exportFormat);
	}

	function showSliceSettings() {
		var sliceType;
		var exportScales = ['.5x','1x','2x','3x'];
		var exportScale = 1;
		var exportFormats = ['JPG','PDF','PNG'];
		var exportFormat = 1;

		var alertWindow = COSAlertWindow.new();

		[alertWindow setMessageText:@'Create Slice Around Artboards'];

		[alertWindow addAccessoryView: createRadioButtons(["Create slice around selections","Create slice around all artboards","Create wireframe slice around all artboards"],1)];

		[alertWindow addTextLabelWithValue:@'Slice export density:'];
		[alertWindow addAccessoryView: helpers.createSelect(exportScales,exportScale,NSMakeRect(0,0,100,25))];

		[alertWindow addTextLabelWithValue:@'Slice export format:'];
		[alertWindow addAccessoryView: helpers.createSelect(exportFormats,exportFormat,NSMakeRect(0,0,100,25))];

		[alertWindow addButtonWithTitle:@'Save'];
		[alertWindow addButtonWithTitle:@'Cancel'];

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			sliceType = [[[alertWindow viewAtIndex:0] selectedCell] tag];
			exportScale = exportScales[[[alertWindow viewAtIndex:2] indexOfSelectedItem]];
			exportFormat = exportFormats[[[alertWindow viewAtIndex:4] indexOfSelectedItem]];
		}

		return {
			sliceType: sliceType,
			exportScale: exportScale.substring(0,exportScale.length-1),
			exportFormat: exportFormat
		};
	}

	function getSelectionSize(selection) {
		var minX,minY,maxX,maxY;
		minX=minY=Number.MAX_VALUE;
		maxX=maxY=-0xFFFFFFFF;

		for (var i = 0; i < selection.count(); i++) {
			var frame = selection.objectAtIndex(i).frame();

			minX = Math.min(minX,frame.minX());
			minY = Math.min(minY,frame.minY());
			maxX = Math.max(maxX,frame.maxX());
			maxY = Math.max(maxY,frame.maxY());
		}

		return {
			width: maxX-minX,
			height: maxY-minY,
			minX: minX,
			minY: minY
		};
	}
};

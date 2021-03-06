@import 'lib/functions.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var artboardCount = [artboards count];

	// Reset page origin
	var pageOrigin = CGPointMake(0,0);
	page.setRulerBase(pageOrigin);

	// Get layout settings
	var layoutSettings = getLayoutSettings();

	// Layout the artboards
	if (layoutSettings) {
		var firstBoard = [artboards objectAtIndex: 0];
		var lastBoard = [artboards objectAtIndex: artboardCount-1];
		var lastBoardPrefix = 0;

		var groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1;
		var groupCount = 1;
		var groupLayout = [];

		for (var i = 0; i < artboardCount; i++) {
			var artboard = [artboards objectAtIndex: i];
			var artboardName = [artboard name];

			var thisBoardPrefix = (groupType == 0) ? parseFloat(artboardName) : parseInt(artboardName);


			if (lastBoardPrefix != 0 && lastBoardPrefix != thisBoardPrefix) {
				groupCount++;
			}

			groupLayout.push({
				artboard: artboardName,
				prefix: thisBoardPrefix,
				group: groupCount
			});

			lastBoardPrefix = thisBoardPrefix;
		}

		var rowCount = layoutSettings.rowCount;
		var rowDensity = layoutSettings.rowDensity;
		var rowHeight = 0;
		var x = 0;
		var y = 0;
		var xPad = 400;
		var yPad = 300;
		var xCount = 0;

		var groupCount = 1;

		for (var i = 0; i < groupLayout.length; i++) {
			var artboard = [artboards objectAtIndex: i];
			var artboardFrame = [artboard frame];

			// If starting a new group, reset x and calculate the y position of the next row
			if (groupLayout[i]['group'] != groupCount) {
				var nextGroupTotal = groupCounter(groupCount+1,groupLayout);
				var rowSpace = rowCount - 1 - (xCount+1);

				if (rowDensity == 1 || rowSpace < nextGroupTotal) {
					x = 0;
					y += rowHeight + yPad*2;
					rowHeight = 0;
					xCount = 0;
				} else {
					x += [artboardFrame width] + xPad;
				}

				groupCount++;
			}

			// If new line is detected but is continuation of group, give smaller vertical padding
			if (x == 0 && xCount != 0) {
				y += yPad;
			}

			// Position current artboard
			artboardFrame.x = x;
			artboardFrame.y = y;

			// Keep track if this artboard is taller than previous artboards in row
			if ([artboardFrame height] > rowHeight) {
				rowHeight = [artboardFrame height];
			}

			// Determine if this is the last artboard the row, reset x and calculate the y position of the next row
			if ((xCount + 1) % rowCount == 0) {
				x = 0;
				y += rowHeight;
				rowHeight = 0;
			} else {
				x += [artboardFrame width] + xPad;
			}

			lastBoardPrefix = thisBoardPrefix;

			xCount++;
		}

		// Feedback to user
		doc.showMessage("Artboard layout complete!");
	}

	function groupCounter(group,obj) {
		var count = 0;

		for (var i = 0; i < obj.length; ++i) {
			if (obj[i]['group'] == group) {
				count++;
			}
		}

		return count;
	}

	function getLayoutSettings() {
		var artboardsPerRow = ['6','8','10','12','14'];
		var artboardsPerRowDefault = 2;

		var alertWindow = COSAlertWindow.new();

		[alertWindow setMessageText:@'Layout Artboards for Export'];

		[alertWindow addTextLabelWithValue:@'How many artboards per row?'];
		[alertWindow addAccessoryView: helpers.createSelect(artboardsPerRow,artboardsPerRowDefault,NSMakeRect(0,0,80,25))];

		[alertWindow addAccessoryView: createRadioButtons(['Dense layout','Loose layout'],0)];

		[alertWindow addButtonWithTitle:@'OK'];
		[alertWindow addButtonWithTitle:@'Cancel'];

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			return {
				rowCount : artboardsPerRow[[[alertWindow viewAtIndex:1] indexOfSelectedItem]],
				rowDensity : [[[alertWindow viewAtIndex:2] selectedCell] tag]
			}
		} else return false;
	}
};

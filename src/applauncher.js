// namespaces
var dwvjq = dwvjq || {};

/**
 * Application launcher.
 */

// start app function
function startApp() {
    // gui setup
    dwvjq.gui.setup();

    // show dwv version
    dwvjq.gui.appendVersionHtml(dwv.getVersion());

    // main application
    var myapp = new dwv.App();

    // setup the undo gui
    var undoGui = new dwvjq.gui.Undo(myapp);

    // listeners
    myapp.addEventListener("load-progress", function (event) {
        var percent = Math.ceil((event.loaded / event.total) * 100);
        dwvjq.gui.displayProgress(percent);
    });
    myapp.addEventListener("load-error", function (event) {
        // hide the progress bar
        dwvjq.gui.displayProgress(100);
        // basic alert window
        alert(event.message);
    });
    myapp.addEventListener("load-abort", function (/*event*/) {
        // hide the progress bar
        dwvjq.gui.displayProgress(100);
    });
    myapp.addEventListener("undo-add", function (event) {
        undoGui.addCommandToUndoHtml(event.command);
    });
    myapp.addEventListener("undo", function (/*event*/) {
        undoGui.enableLastInUndoHtml(false);
    });
    myapp.addEventListener("redo", function (/*event*/) {
        undoGui.enableLastInUndoHtml(true);
    });

    // initialise the application
    var loaderList = [
        "File",
        "Url"
    ];

    var toolList = [
        "Scroll",
        "WindowLevel",
        "ZoomAndPan",
        "Draw",
        "Livewire",
        "Filter",
        "Floodfill"
    ];

    var filterList = [
        "Threshold",
        "Sharpen",
        "Sobel"
    ];

    var shapeList = [
        "Arrow",
        "Ruler",
        "Protractor",
        "Rectangle",
        "Roi",
        "Ellipse",
        "FreeHand"
    ];

    // initialise the application
    var options = {
        "containerDivId": "dwv",
        "gui": ["help", "undo"],
        "loaders": loaderList,
        "tools": toolList,
        "filters": filterList,
        "shapes": shapeList
    };
    if ( dwv.browser.hasInputDirectory() ) {
        options.loaders.splice(1, 0, "Folder");
    }
    myapp.init(options);

    undoGui.setup();

    // show help
    var isMobile = false;
    dwvjq.gui.appendHelpHtml(
        myapp.getToolboxController().getToolList(),
        isMobile,
        myapp,
        "resources/help");

    // setup the dropbox loader
    var dropBoxLoader = new dwvjq.gui.DropboxLoader(myapp);
    dropBoxLoader.init();

    // setup the loadbox gui
    var loadboxGui = new dwvjq.gui.Loadbox(myapp);
    loadboxGui.setup(loaderList);

    // info layer
    var infoController = new dwvjq.gui.info.Controller(myapp, "dwv");
    infoController.init();

    // setup the tool gui
    var toolboxGui = new dwvjq.gui.ToolboxContainer(myapp, infoController);
    toolboxGui.setFilterList(filterList);
    toolboxGui.setShapeList(shapeList);
    toolboxGui.setup(toolList);

    // setup the meta data gui
    var metaDataGui = new dwvjq.gui.MetaData(myapp);

    // setup the draw list gui
    var drawListGui = new dwvjq.gui.DrawList(myapp);
    drawListGui.init();

    // colour map
    var infocm = dwvjq.gui.getElement("dwv", "infocm");
    var miniColourMap = null;
    if (infocm) {
        miniColourMap = new dwvjq.gui.info.MiniColourMap(infocm, myapp);
    }
    // intensities plot
    var plot = dwvjq.gui.getElement("dwv", "plot");
    var plotInfo = null;
    if (plot) {
        plotInfo = new dwvjq.gui.info.Plot(plot, myapp);
    }

    // update overlay info on slice load
    myapp.addEventListener('load-slice', infoController.onLoadSlice);

    // listen to 'load-end'
    myapp.addEventListener('load-end', function (/*event*/) {
        // initialise undo gui
        undoGui.setup();
        // initialise and display the toolbox
        toolboxGui.initialise();
        toolboxGui.display(true);
        // update meta data
        metaDataGui.update(myapp.getMetaData());
        // update info overlay
        infoController.onLoadEnd();

        if (miniColourMap) {
            miniColourMap.create();
        }
        if (plotInfo) {
            plotInfo.create();
        }
    });

    if (miniColourMap) {
        myapp.addEventListener('wl-width-change', miniColourMap.update);
        myapp.addEventListener('wl-center-change', miniColourMap.update);
        myapp.addEventListener('colour-change', miniColourMap.update);
    }
    if (plotInfo) {
        myapp.addEventListener('wl-width-change', plotInfo.update);
        myapp.addEventListener('wl-center-change', plotInfo.update);
    }

    // possible load from location
    dwv.utils.loadFromUri(window.location.href, myapp);

    // help
    // TODO Seems accordion only works when at end...
    $("#accordion").accordion({ collapsible: "true", active: "false", heightStyle: "content" });
}

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "node_modules/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "node_modules/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "node_modules/dwv/decoders/pdfjs/decode-jpegbaseline.js",
    "rle": "node_modules/dwv/decoders/dwv/decode-rle.js"
};

// status flags
var domContentLoaded = false;
var i18nInitialised = false;
// launch when both DOM and i18n are ready
function launchApp() {
    if ( domContentLoaded && i18nInitialised ) {
        startApp();
    }
}
// i18n ready?
dwv.i18nOnInitialised( function () {
    // call next once the overlays are loaded
    var onLoaded = function (data) {
        dwvjq.gui.info.overlayMaps = data;
        i18nInitialised = true;
        launchApp();
    };
    // load overlay map info
    $.getJSON( dwv.i18nGetLocalePath("overlays.json"), onLoaded )
    .fail( function () {
        console.log("Using fallback overlays.");
        $.getJSON( dwv.i18nGetFallbackLocalePath("overlays.json"), onLoaded );
    });
});

// check browser support
dwv.browser.check();
// initialise i18n
dwv.i18nInitialise("auto", "node_modules/dwv");

// DOM ready?
$(document).ready( function() {
    domContentLoaded = true;
    launchApp();
});

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

    // listeners
    myapp.addEventListener("load-progress", function (event) {
        var percent = Math.ceil((event.loaded / event.total) * 100);
        dwvjq.gui.displayProgress(percent);
    });
    myapp.addEventListener("load-error", function (/*event*/) {
        // hide the progress bar
        dwvjq.gui.displayProgress(100);
        // basic alert window
        alert(event.message);
    });
    myapp.addEventListener("load-abort", function (/*event*/) {
        // hide the progress bar
        dwvjq.gui.displayProgress(100);
    });

    // initialise the application
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

    var options = {
        "containerDivId": "dwv",
        "gui": ["tool", "load", "help", "undo"],
        "loaders": ["File", "Url"],
        "tools": toolList,
        "filters": filterList,
        "shapes": shapeList
    };
    if ( dwv.browser.hasInputDirectory() ) {
        options.loaders.splice(1, 0, "Folder");
    }
    myapp.init(options);

    // show help
    var isMobile = false;
    dwvjq.gui.appendHelpHtml(
        myapp.getToolboxController().getToolList(),
        isMobile,
        myapp,
        "resources/help");

    // setup the dropbox loader
    var dropBoxLoader = new dwv.gui.DropboxLoader(myapp);
    dropBoxLoader.init();

    // setup the tool gui
    var toolboxGui = new dwv.gui.Toolbox(myapp);
    toolboxGui.setFilterList(filterList);
    toolboxGui.setShapeList(shapeList);
    toolboxGui.setup(toolList);

    // setup the DICOM tags gui
    var tagsGui = new dwvjq.gui.DicomTags(myapp);

    // setup the draw list gui
    var drawListGui = new dwvjq.gui.DrawList(myapp);
    drawListGui.init();

    // colour map
    var infocm = dwv.gui.getElement("dwv", "infocm");
    var miniColourMap = null;
    if (infocm) {
        miniColourMap = new dwvjq.gui.info.MiniColourMap(infocm, myapp);
    }
    // intensities plot
    var plot = dwv.gui.getElement("dwv", "plot");
    var plotInfo = null;
    if (plot) {
        plotInfo = new dwvjq.gui.info.Plot(plot, myapp);
    }

    // listen to 'load-end'
    myapp.addEventListener('load-end', function (/*event*/) {
        // allow loadgin via drag and drop on layer contanier
        dropBoxLoader.switchToLayerContainer();
        // initialise and display the toolbox
        toolboxGui.initialise();
        toolboxGui.display(true);
        // update DICOM tags
        tagsGui.update(myapp.getTags());

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
        dwv.gui.info.overlayMaps = data;
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

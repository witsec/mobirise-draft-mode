(function(jQuery, mbrApp) {

	var curr, compIndex;
    mbrApp.regExtension({
        name: "witsec-draft-mode",
        events: {		
            beforeAppLoad: function() {
                mbrApp.Core.addFilter("prepareComponent", function(a, b) {
					// 'a' is the component window's HTML as string. We need to jQuery that, so we can do magic stuff with it
					var h = jQuery(a);

					// Add edit button to component buttons
					var btn = '<span class="mbr-btn mbr-btn-default mbr-icon-edit witsec-draft-mode-shortcut" data-tooltipster="bottom" title="Toggle Draft"></span><style>.witsec-draft-mode-shortcut:hover { background-color: #42a5f5 !important; }</style>';
					if (h.find(".component-params").length)
						h.find(".component-params").before(btn);
					else if (h.find(".component-remove").length)
						h.find(".component-remove").before(btn);

					// Get the HTML as a string, then return that
					a = h.prop("outerHTML");
					h.remove();

					return a;
				});
			},

			load: function() {
                var a = this;

				a.$template.on("click", ".witsec-draft-mode-shortcut", function(e) {
					// Re-create component index (this is an internal list only which refers to the actual index, so we don't have to fiddle with that)
					compIndex = [];
					for (index in mbrApp.Core.resultJSON[mbrApp.Core.currentPage].components){
						var comp = mbrApp.Core.resultJSON[mbrApp.Core.currentPage].components[index];
						if (comp._once == "menu")
							compIndex.unshift(index);
						else
							compIndex.push(index);
					}

					// Find the index of the clicked icon
					a.$template.find('.witsec-draft-mode-shortcut').each(function(index, obj) {
						if (e.target == obj) {
							curr = mbrApp.Core.resultJSON[mbrApp.Core.currentPage].components[ compIndex[index] ];
						}
					});

					// If curr is null, something is wrong
					if (curr === null) {
						mbrApp.alertDlg("An error occured while opening the Anchor Editor.");
						return false;
					}

					// Let's jQuery the HTML, so we can do fun stuff with it. We wrap a div around it, so "find()" can find the <section>
					var j = $("<div>" + curr._customHTML + "</div>");

					// Check if the block is in draft mode
					if (j.find("section").hasClass("witsec-draft-mode")) {
						j.find("section").removeClass("witsec-draft-mode");
						j.find(".witsec-draft-mode-style").remove();
					} else {
						j.find("section").addClass("witsec-draft-mode");
						j.find("section").append("<style class='witsec-draft-mode-style'>.witsec-draft-mode { border: 3px dashed red; }</style>");
					}

					// Edit the HTML
					curr._customHTML = j.prop("innerHTML");

					// Save
					var currentPage = mbrApp.Core.currentPage;
					mbrApp.runSaveProject(function() {
						mbrApp.loadRecentProject(function(){
							$("a[data-page='" + currentPage + "']").trigger("click")
						});
					});
				});				

				// Remove any block that's in draft mode
				a.addFilter("publishHTML", function(b) {
					// Rename html/head/body elements and remove DOCTYPE, so we don't lose them when we want to get them back from jQuery (there must be a better way, right?)
					b = b.replace(/<!DOCTYPE html>/igm, "");					
					b = b.replace(/<([/]?)(html|head|body)/igm, "<$1$2x");

					// Remove draft blocks
					j = $(b);
					j.find(".witsec-draft-mode").remove();
					b = j.prop('outerHTML');

					// Rename the elements back	and re-add DOCTYPE				
					b = b.replace(/<([/]?)(html|head|body)x/igm, "<$1$2");
					b = "<!DOCTYPE html>\n" + b;

					return b
				});
			}
        }
    })
})(jQuery, mbrApp);
/// <reference path="../../Scripts/MadCapGlobal.js" />
/// <reference path="../../Scripts/MadCapUtilities.js" />
/// <reference path="../../Scripts/MadCapDom.js" />
/// <reference path="../../Scripts/MadCapXhr.js" />
/// <reference path="MadCapHelpSystem.js" />

/*!
 * Copyright MadCap Software
 * http://www.madcapsoftware.com/
 * Unlicensed use is strictly prohibited
 *
 * v21.1.9396.41248
 */


(function () {
    MadCap.WebHelp = MadCap.CreateNamespace("WebHelp");

    var previewMode = typeof CefSharp !== 'undefined' || (window.external && window.external.attached && window.external.attached()); // Previewing style changes in the skin editor
    var isTriPane = MadCap.Utilities.HasRuntimeFileType("TriPane");

    MadCap.WebHelp.TocPane = function (runtimeFileType, helpSystem, rootUl, canSync) {
        var mSelf = this;
        this._Init = false;
        this._RuntimeFileType = runtimeFileType;
        this._RootUl = rootUl;
        this._$RootUl = $(rootUl);
        this._CanSync = canSync;
        this._HelpSystem = helpSystem;
        this._TocFile = this._RuntimeFileType == "Toc" ? this._HelpSystem.GetTocFile() : this._HelpSystem.GetBrowseSequenceFile();
        this._LoadedNodes = [];
        this._NodesWithChildrenLoaded = [];
        this._NodeElMap = {};
        this._TocType = null;
        this._TocPath = null;
        this._TocHref = null;

        MadCap.Utilities.MessageBus.AddMessageHandler(this.OnMessage, this);

        this._Initializing = false;
        this._InitOnCompleteFuncs = new Array();

        this.TreeNode_Expand = function (e) {
            var target = e.target;
            var foundationMenu = mSelf._IsOffCanvasMenu || mSelf._IsSideNavMenu ? $(mSelf._RootUl) : null;

            var liEl = $(target).closest("li")[0];

            if (liEl == null)
                return;

            var $liEl = $(liEl);
            var isTreeNodeLeaf = $liEl.hasClass(mSelf._TreeNodeLeafClass);

            var node = mSelf._LoadedNodes[$liEl.attr('data-mc-id')];
            var currentSkin = mSelf._HelpSystem.GetCurrentSkin();

            if (mSelf._IsTopNavMenu && mSelf._HelpSystem.NodeDepth(node) > mSelf._MaxDepth)
                return;

            var $imgEl = $liEl.find("> div img");
            var alt2 = $imgEl.attr("data-mc-alt2");
            var alt = $imgEl.attr("alt");

            if (alt2 != "") {
                $imgEl.attr("alt", alt2);
                $imgEl.attr("data-mc-alt2", alt);
            }

            if (mSelf._IncludeIndicator) { // if tripane
                var $aEl = $liEl.find("> div a");
                if ($aEl[0] != null) {
                    var href = $aEl.attr("href");

                    if (!MadCap.String.IsNullOrEmpty(href))
                        mSelf._SelectNode(liEl);

                    // if the click didn't occur on the <a> itself, handle it ourselves
                    if ($aEl[0] != target) {
                        var frameName = $aEl.attr("target");

                        if (!MadCap.String.IsNullOrEmpty(href)) {
                            if (frameName != null)
                                window.open(href, frameName);
                            else
                                document.location.href = href;
                        }
                    }
                }
            }

            if (typeof node.n == 'undefined' || node.n.length == 0) { // leaf
                node.childrenLoaded = true;
                mSelf._NodesWithChildrenLoaded.push(node);
            }

            if (mSelf._NodesWithChildrenLoaded.indexOf(node) === -1) {
                var $a = $('a', $liEl).first();
                var $ul = $liEl.children("ul");
                if ($ul.length === 0) {
                    $ul = $('<ul>');
                }
                var $subMenuClass = $(mSelf._RootUl).attr("data-mc-css-sub-menu") || "tree inner";
                $ul.addClass($subMenuClass);
                if (isTriPane) {
                    $ul.attr('data-mc-style', "Navigation Panel Item");
                }

                if (mSelf.IsAccordionMenu(currentSkin)) {
                    $ul.css('display', 'none');
                }

                mSelf.LoadTocChildren(node, $ul, function () {
                    $liEl.append($ul);
                    mSelf.InitOffCanvasSubMenuKeyboardNavigation($liEl, $ul);

                    if (mSelf._IsSideNavMenu && $ul.length && $liEl.hasClass("is-accordion-submenu-parent")) {
                        var $child = $liEl.find("span.submenu-toggle-container").first();
                        MadCap.Accessibility.setAriaControls($child, $ul, "sidenav-submenu");

                    } else if (mSelf._IsTopNavMenu && $ul.length && $liEl.hasClass(mSelf._TreeNodeHasChildrenClass)) {
                        var width = $ul.width();
                        var isRtl = $('html').attr('dir') == 'rtl';
                        var availWidth = isRtl ? $liEl.offset().left : $(window).width() - $liEl.offset().left - $liEl.width();
                        var cssClass = CalculateSubmenuCssClass(width, availWidth, isRtl);

                        $ul.toggleClass(cssClass, width > availWidth);
                        $liEl.addClass(mSelf._TreeNodeExpandedClass);

                        MadCap.Accessibility.initTopNavSubmenuAccessibility($liEl, $ul);
                    }

                    if (mSelf._DeferExpandEvent) {
                        setTimeout(function () {
                            if (mSelf.IsAccordionMenu(currentSkin)) {
                                Foundation.Nest.Feather($liEl.children('.is-accordion-submenu'), 'accordion');
                                foundationMenu.foundation('down', $liEl.children('.is-accordion-submenu'));
                            } else {
                                Foundation.Nest.Feather(foundationMenu, 'drilldown');
                                foundationMenu.foundation('_show', $liEl);
                            }
                        }, 100);
                    }
                });

                if (mSelf._DeferExpandEvent) {
                    e.stopImmediatePropagation();
                    return false;
                }
            }

            // forces the content body to slide over thereby "navigating" to the selected topic
            // caveat: only works for tree node leafs
            if (isTreeNodeLeaf) {
                // maintain selected skin
                if (!isTriPane) {
                    MadCap.Utilities.Url.OnNavigateTopic.call(target, e);
                }
            } else {
                if (mSelf._IsOffCanvasMenu || mSelf._IsSideNavMenu) {
                    if (mSelf.IsAccordionMenu(currentSkin)) {
                        foundationMenu.foundation('toggle', $liEl.children('.is-accordion-submenu'));
                    } else {
                        foundationMenu.foundation('_show', $liEl);
                        $liEl.find("ul.submenu > li > a").first().focus();
                    }
                    return false;
                }
            }

            // if expanded event isn't defined, trigger it manually
            if (!mSelf._ExpandedEvent) {
                mSelf.TreeNode_Expanded(e, e.target);
            }
        };

        this.TreeNode_Expanded = function (e, submenu) {
            var liEl = $(submenu).closest("li")[0];

            if (liEl == null)
                return;

            var $liEl = $(liEl);
            var isTreeNodeLeaf = $liEl.hasClass(mSelf._TreeNodeLeafClass);

            if (!isTreeNodeLeaf && !mSelf._IsTopNavMenu) {
                mSelf.SetTocMenuItemExpanded($liEl, !mSelf.IsTocMenuItemExpanded($liEl));
            }
        }

        this.InitOffCanvasSubMenuKeyboardNavigation = function ($li, $ul) {
            if (this._IsOffCanvasMenu && $ul.length) {
                var $child = $li.children("a");
                MadCap.Accessibility.setAriaControls($child, $ul, "responsive-submenu")

                if ($li.hasClass("is-drilldown-submenu-parent")) {
                    // topnav responsive menu
                    var $items = $ul.children('li').children('a');
                    var $firstItem = $items.first();

                    // if tab on last element, click "back" button
                    $items.last().on("keydown", function (e) {
                        var code = e.keyCode || e.which;
                        if (!e.shiftKey && code == 9) {
                            e.preventDefault();
                            $firstItem.click();
                        }
                    });

                    // if shift-tab on first element, click "back button"
                    $firstItem.on("keydown", function (e) {
                        var code = e.keyCode || e.which;
                        if (e.shiftKey && code == 9 && $firstItem.text() == "Back") {
                            e.preventDefault()
                            $firstItem.click();
                        }
                    });
                }
            }
        }

        this.TopNavigationMenuItem_MouseEnter = function (e) {
            var $li = $(e.currentTarget).closest('li');
            var $subMenu = $li.children('ul').first();
            if ($subMenu.length) {
                var width = $subMenu.width();
                var isRtl = $('html').attr('dir') == 'rtl';
                var availWidth = isRtl ? $li.offset().left : $(window).width() - $li.offset().left - $li.width();
                var cssClass = CalculateSubmenuCssClass(width, availWidth, isRtl);

                $subMenu.toggleClass(cssClass, width > availWidth);
                $li.addClass(mSelf._TreeNodeExpandedClass);
                $li.children("button").attr("aria-expanded", "true");
            }
            mSelf.SetTopNavClasses($li, $subMenu);
        };

        this.TopNavigationMenuItem_MouseLeave = function (e) {
            var $li = $(e.currentTarget).closest('li');

            if ($li.hasClass(mSelf._TreeNodeExpandedClass)) {
                $li.removeClass(mSelf._TreeNodeExpandedClass);
            }
            $li.children("button").attr("aria-expanded", "false");
        };

        this.SetTopNavClasses = function($liEl, $parentUl) {
            if ($parentUl.length) {
                var width = $parentUl.width();
                var isRtl = $('html').attr('dir') === 'rtl';
                var availWidth = isRtl ? $liEl.offset().left : $(window).width() - $liEl.offset().left - $liEl.width();

                var cssClass = CalculateSubmenuCssClass(width, availWidth, isRtl);
                $parentUl.removeClass('openLeft openRight').addClass(cssClass);
                $liEl.addClass(mSelf._TreeNodeExpandedClass);
            }
        };

        this.ExpandCollapseOnArrowPress = function ($a) {
            var expandFunction = this.TreeNode_Expand;
            $a.on("keydown", function (e) {
                var code = e.keyCode || e.which;
                var collapsed = $(this).closest(".tree-node").hasClass("tree-node-collapsed");

                //expand on right arrow, close on left arrow
                if (code == 39 && collapsed || code == 37 && !collapsed) {
                    e.preventDefault();
                    expandFunction(e);
                }
            });
        }
    };

    function CalculateSubmenuCssClass(width, availWidth, isRtl) {
        var cssClass = width > availWidth ? 'openLeft' : 'openRight';
        if (isRtl) {
            cssClass = width > availWidth ? 'openRight' : 'openLeft';
        }
        return cssClass;
    }

    var TocPane = MadCap.WebHelp.TocPane;

    TocPane.prototype.OnMessage = function (message, dataValues, responseData) {
        var returnData = { Handled: false, FireResponse: true };

        if (message == "sync-toc") {
            var tocType = dataValues[0];
            var tocPath = dataValues[1];
            var href = new MadCap.Utilities.Url(dataValues[2]);

            if (this._CanSync && (tocType == null || tocType == this._RuntimeFileType)) {
                this.SyncTOC(tocPath, href);
                returnData.Handled = true;
            }
        }

        return returnData;
    };

    TocPane.prototype.Init = function (OnCompleteFunc) {
        if (this._Init) {
            if (OnCompleteFunc != null)
                OnCompleteFunc();

            return;
        }

        if (OnCompleteFunc != null)
            this._InitOnCompleteFuncs.push(OnCompleteFunc);

        if (this._Initializing)
            return;

        this._Initializing = true;

        var $rootUl = this._$RootUl;

        this._IsOffCanvasMenu = $rootUl.hasClass("off-canvas-list");
        this._IsSideNavMenu = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-side-nav-menu", false);
        this._IsTopNavMenu = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-top-nav-menu", false);
        this._IsSideMenu = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-side-menu", false);

        if (this._IsTopNavMenu) {
            this._TreeNodeHasChildrenClass = $rootUl.attr("data-mc-css-tree-node-has-children") || "has-children";
            this._TreeNodeCollapsedClass = "";
            this._TreeNodeExpandedClass = "is-expanded";
        } else {
            this._TreeNodeClass = $rootUl.attr("data-mc-css-tree-node") || "tree-node";
            this._TreeNodeCollapsedClass = $rootUl.attr("data-mc-css-tree-node-collapsed") || "tree-node-collapsed";
            this._TreeNodeExpandedClass = $rootUl.attr("data-mc-css-tree-node-expanded") || "tree-node-expanded";
            this._TreeNodeLeafClass = $rootUl.attr("data-mc-css-tree-node-leaf") || "tree-node-leaf";
            this._TreeNodeSelectedClass = $rootUl.attr("data-mc-css-tree-node-leaf") || "tree-node-selected";
        }

        this._TreeNodePreloadedClass = $rootUl.attr("data-mc-css-tree-node-preloaded") || "tree-node-preloaded";
        this._SubMenuClass = $rootUl.attr("data-mc-css-sub-menu") || "tree inner";

        this._IncludeBack = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-back", false);
        this._IncludeParentLink = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-parent-link", false);
        this._IncludeIcon = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-icon", true);
        this._IncludeIndicator = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-indicator", true);
        this._DeferExpandEvent = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-defer-expand-event", false);

        this._ExpandEvent = $rootUl.attr("data-mc-expand-event") || (this._IsSideMenu ? null : "click");
        this._ExpandedEvent = $rootUl.attr("data-mc-expanded-event");
        this._BackLink = $rootUl.attr("data-mc-back-link") || "Back";
        this._MaxDepth = parseInt($rootUl.attr("data-mc-max-depth")) || 1;

        this._IncludeParent = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-parent", false);
        this._IncludeSiblings = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-siblings", false);
        this._IncludeChildren = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-include-children", false);
        this._IsContextSensitive = MadCap.Dom.GetAttributeBool(this._RootUl, "data-mc-is-context-sensitive", false);

        this._LinkedToc = $rootUl.attr("data-mc-linked-toc");

        var mSelf = this;

        $rootUl.attr("data-mc-chunk", "Data/" + this._RuntimeFileType + ".xml");

        this.CreateToc(this._RootUl, function () {
            mSelf._Init = true;

            for (var i = 0; i < mSelf._InitOnCompleteFuncs.length; i++) {
                mSelf._InitOnCompleteFuncs[i]();
            }
        });
    };

    TocPane.prototype.CanSyncFromUrl = function () {
        return (this._IsOffCanvasMenu || this._IsSideNavMenu) && this._CanSync && this._HelpSystem.SyncTOC;
    }

    TocPane.prototype.CreateToc = function (rootUl, OnCompleteFunc) {
        var hasToc = true;

        if (this._RuntimeFileType == "Toc")
            hasToc = this._HelpSystem.HasToc;
        else
            hasToc = this._HelpSystem.HasBrowseSequences;

        if (!hasToc) {
            if (OnCompleteFunc != null)
                OnCompleteFunc();

            return;
        }

        var self = this;

        var onTocLoaded = function () {
            if (self._ExpandedEvent) {
                $(rootUl).on(self._ExpandedEvent, self.TreeNode_Expanded);
            }

            if (self.CanSyncFromUrl()) {
                $(window).on('hashchange', function () {
                    var tocData = self._HelpSystem.LoadTocDataFromQuery();
                    self.SyncTOC(tocData.TocPath, tocData.Href);
                });
            }

            if (OnCompleteFunc != null)
                OnCompleteFunc();
        }

        self._HelpSystem.LoadToc([this._RuntimeFileType, this._LinkedToc]).then(function (toc) {
            var $ul = $(rootUl);
            if (previewMode) {
                $ul.attr('data-mc-style', "Navigation Panel Item");
            }

            var tocDeferred = [];
            for (var i = 0; i < toc.chunks.length; i++) {
                if (!toc.chunks[i].loaded)
                    tocDeferred.push(self._HelpSystem.LoadTocChunk(toc, i));
            }

            // finish loading all tocChunks
            $.when.apply(this, tocDeferred).done(function () {
                if (self._IsSideMenu) {
                    if (self._TocType) {
                        self._HelpSystem.FindNode(self._TocType, self._TocPath, self._TocHref, function (node) {
                            self.TocNodeMenuCallback(node, $ul, toc, onTocLoaded);
                        }, self._LinkedToc);
                    } else {
                        self._HelpSystem.FindTocNode(null, self._TocHref, function (node) {
                            self.TocNodeMenuCallback(node, $ul, toc, onTocLoaded);
                        }, self._LinkedToc);
                    }
                } else {
                    self.LoadTocChildren(toc.tree, $ul, function () {
                        if (self.CanSyncFromUrl()) {
                            self.SyncTOC(self._TocPath, self._TocHref);
                        }

                        $ul.children("li.placeholder").remove();

                        this._Init = true;

                        onTocLoaded();
                    });
                }
            });

        });
    };

    TocPane.prototype.LoadTocChildren = function (node, el, OnCompleteFunc) {
        var length = typeof node.n !== 'undefined' ? node.n.length : 0; // n property holds child nodes
        var loaded = 0;
        var self = this;
        var isNodePreloaded = el.children('.' + this._TreeNodePreloadedClass).length > 0;
        var additionalChildrenCount = 0;

        if (length === 0) {
            node.childrenLoaded = true;
            this._NodesWithChildrenLoaded.push(node);
        }

        if (this._NodesWithChildrenLoaded.indexOf(node) !== -1) {
            if (OnCompleteFunc)
                OnCompleteFunc();

            return;
        }

        if (node.parent) {
            if (this._IncludeBack) {
                var $li = $('<li class="js-drilldown-back"/>'); // Foundation 6 back class
                $li.addClass(this._TreeNodeClass);

                var $a = $('<a href="#"/>');
                MadCap.Accessibility.makeAccessibleButton($a);
                $a.text(this._BackLink);

                $a.on(this._ExpandEvent, function (e) {
                    var $ul = $li.parent('ul');
                    var drilldownMenu = $('ul.menu[data-drilldown]');
                    drilldownMenu.foundation('_back', $ul);
                    e.preventDefault();

                    $ul.siblings().first().focus();
                });

                $li.append($a);

                el.append($li);
                additionalChildrenCount++;
            }

            if (this._IncludeParentLink && this._HelpSystem.GetTocEntryHref(node) != null) {
                var $li = $('<li/>');
                $li.addClass(this._TreeNodeClass);
                $li.addClass(this._TreeNodeLeafClass);

                el.append($li);

                this.LoadTocNode(node, $li, false, null);
                additionalChildrenCount++;
            }
        }

        // Create elements
        for (var i = 0; i < length; i++) {
            var childNode = node.n[i];
            var $li;

            if (isNodePreloaded) {
                var childSelector = this._TreeNodeClass ? '.' + this._TreeNodeClass : '';
                $li = el.children(childSelector).eq(additionalChildrenCount + i);
            }
            else {
                $li = $('<li/>');
                el.append($li);
            }

            $li.addClass(this._TreeNodeClass);
            $li.addClass(this._TreeNodeCollapsedClass);

            if (this._IsTopNavMenu && (el.hasClass(this._SubMenuClass) || el[0] == this._RootUl)) {
                $li.on("mouseenter", this.TopNavigationMenuItem_MouseEnter);
                $li.on("mouseleave", this.TopNavigationMenuItem_MouseLeave);
            }

            this.LoadTocNode(childNode, $li, true, function () {
                loaded++;

                if (loaded == length) {
                    node.childrenLoaded = true;
                    self._NodesWithChildrenLoaded.push(node);

                    if (OnCompleteFunc != null)
                        OnCompleteFunc();
                }
            });
        }
    }

    TocPane.prototype.LoadTocNode = function (node, el, canHaveChildren, OnCompleteFunc) {
        var self = this;
        var toc = node.toc;

        this._HelpSystem.LoadTocChunk(toc, node.c).then(function (chunk) {
            var entry = toc.entries[node.i];
            var hasFrame = typeof node.f != 'undefined';
            var isLeaf = !canHaveChildren || typeof node.n == 'undefined' || node.n.length == 0;
            var hasChildren = canHaveChildren && node.n !== undefined && node.n.length > 0;
            var tocType = self._CanSync && !hasFrame ? self._RuntimeFileType : null;
            var appendTocPath = self._HelpSystem.TopNavTocPath || isTriPane;
            var href = self._HelpSystem.GetTocEntryHref(node, tocType, self._CanSync, appendTocPath);
            var isPreloaded = el.hasClass(self._TreeNodePreloadedClass);
            var $a = isPreloaded ? el.children('a').last() : $('<a/>');

            el.removeClass(self._TreeNodePreloadedClass);

            if (hasFrame) {
                $a.attr('target', node.f);
            }
            if (href != null) {
                $a.attr('href', href);
                if (isTriPane)
                    MadCap.Accessibility.tripaneTopicFrameSkip($a, entry.title);
            } else {
                $a.attr('href', 'javascript:void(0);');
                $a.attr('role', 'button');
            }

            SetLinkText($a, entry.title);

            if (isTriPane) {
                MadCap.Accessibility.tripaneTopicFrameSkip($a, entry.title);
            }

            if (typeof node.s != 'undefined') { // class
                el.addClass(node.s);
            }

            if (isLeaf) {
                el.removeClass(self._TreeNodeCollapsedClass);
                el.addClass(self._TreeNodeLeafClass);
            }

            if (self._IncludeIcon) {
                // create transparent image
                var customClass = "default";
                var language = self._HelpSystem.Language.toc;

                // check li for custom class
                for (className in language) {
                    if (el.hasClass(className)) {
                        customClass = className;
                        break;
                    }
                }

                var $img = $('<img/>');
                $img.attr('src', 'Skins/Default/Stylesheets/Images/transparent.gif');
                $img.addClass('toc-icon');
                if (self._IncludeIndicator && typeof node.w !== 'undefined' && node.w == 1) {
                    $img.attr('alt', language[customClass]['MarkAsNewIconAlternateText']);
                }
                else if (el.hasClass(self._TreeNodeLeafClass)) {
                    $img.attr('alt', language[customClass]['TopicIconAlternateText']);
                }
                else {
                    $img.attr('alt', language[customClass]['ClosedBookIconAlternateText']);
                    $img.attr('data-mc-alt2', language[customClass]['OpenBookIconAlternateText']);
                }
                if ($img.prop('src') != "") {
                    $a.prepend($img);
                }
            }

            if (self._IncludeIndicator) {
                var $div = $('<div/>');

                if (typeof node.w !== 'undefined' && node.w == 1) // mark as new
                    $div.append("<span class='new-indicator'></span>");

                var $span = $('<span class="label" />');

                $span.append($a);

                $div.append($span);

                $a = $div;
            }

            var $el = $a;
            var currentSkin = self._HelpSystem.GetCurrentSkin();
            if (hasChildren) {
                if (typeof $el.attr('aria-expanded') === 'undefined') {
                    $el.attr('aria-expanded', false);
                }

                if (isTriPane) {
                    self.ExpandCollapseOnArrowPress($el.children().children());
                } else {
                    if (self.IsAccordionMenu(currentSkin)) {
                        // create a toggle (expand/collapse arrow) and make it a button if node is also a link
                        var toggleIsButton = !self._IncludeParentLink && href !== null;
                        var $toggle = AcquireToggle($el, toggleIsButton);
                        if (toggleIsButton) {
                            $el = $toggle;
                        }
                    }

                    if (!self._IsSideMenu) { // side menus are just made up of links and are already accessible
                        MadCap.Accessibility.makeAccessibleButton($el);
                    }
                }
            }

            if (!self._IsContextSensitive) {
                $el.on(self._ExpandEvent, self.TreeNode_Expand);
            }

            self._NodeElMap[self.GetNodeHash(node)] = el;

            if (!isPreloaded) {
                el.append($a);
            }
            el.attr('data-mc-id', self._LoadedNodes.length);

            var nodeDepth = self._HelpSystem.NodeDepth(node);

            if (hasChildren && (self._IsTopNavMenu && nodeDepth <= self._MaxDepth)) {
                el.addClass(self._TreeNodeHasChildrenClass);
                MadCap.Accessibility.initTopNavMenuButtons(el, self, $a, nodeDepth);
            }

            self._LoadedNodes.push(node);

            if (OnCompleteFunc != null)
                OnCompleteFunc(node);
        });

        function SetLinkText($a, text) {
            var $aText = $a.contents().filter(function () { return this.nodeType == 3; });
            if ($aText.length > 0) {
                $aText.first().replaceWith(text);
            } else {
                $a.text(text);
            }
        }

        function AcquireToggle($listChild, addAccessibleLabel) {
            var $s = $listChild.children("span.submenu-toggle-container");
            if ($s.length > 0)
                return $s;

            $s = $("<span class='submenu-toggle-container'><span class='submenu-toggle'></span></span>");
            $listChild.append($s);

            if (addAccessibleLabel) {
                var $label = $("<span class='invisible-label'></span>").text($listChild.text());
                $s.append($label);
            }

            return $s;
        }
    };

    TocPane.prototype.GetTocMenuItemLink = function (el) {
        return $(el).find("a").first();
    }

    TocPane.prototype.IsTocMenuItemExpanded = function (el) {
        return this.GetTocMenuItemLink(el).attr("aria-expanded") === "true";
    }

    TocPane.prototype.SetTocMenuItemExpanded = function (el, isExpanded) {
        var $el = $(el);

        if (this._TreeNodeCollapsedClass !== this._TreeNodeExpandedClass) {
            $el.toggleClass(this._TreeNodeCollapsedClass, !isExpanded);
            $el.toggleClass(this._TreeNodeExpandedClass, isExpanded);
        }

        var $a = this.GetTocMenuItemLink(el);
        $a.attr("aria-expanded", isExpanded);
    }

    TocPane.prototype.SetTocMenuItemSelected = function (el, isSelected) {
        var $el = $(el);
        $el.toggleClass(this._TreeNodeSelectedClass, isSelected);

        var $a = this.GetTocMenuItemLink(el);
        $a.attr("aria-current", isSelected);
        $a.toggleClass("selected", isSelected);
    }

    TocPane.prototype.SyncTOC = function (tocPath, href) {
        var self = this;

        this.Init(function () {
            function OnFoundNode(node) {
                if (typeof node !== 'undefined' && node != null) {
                    var loadNodes = [];
                    var loadNode = node;

                    while (typeof loadNode !== 'undefined' && (self._NodesWithChildrenLoaded.indexOf(loadNode) === -1)) {
                        loadNodes.unshift(loadNode);
                        loadNode = loadNode.parent;
                    }

                    MadCap.Utilities.AsyncForeach(loadNodes,
                        function (loadNode, callback) {
                            var currentSkin = self._HelpSystem.GetCurrentSkin();
                            var $el = $(self._NodeElMap[self.GetNodeHash(loadNode)]);

                            var $ul = $el.children("ul");
                            if ($ul.length === 0) {
                                $ul = $('<ul>');
                            }
                            $ul.addClass(self._SubMenuClass);

                            self.LoadTocChildren(loadNode, $ul, function () {
                                if ($ul[0].children.length > 0) {
                                    $el.append($ul);

                                    self.InitOffCanvasSubMenuKeyboardNavigation($el, $ul);

                                    if (self.IsDrillDownMenu(currentSkin)) {
                                        Foundation.Nest.Feather($(self._RootUl), 'drilldown');
                                        $(self._RootUl).foundation('_show', $el);
                                    }

                                    var controller;
                                    if (self._IsSideNavMenu) {
                                        controller = $el.find("span.submenu-toggle-container").first();
                                    } else if (self._IsOffCanvasMenu) {
                                        controller = $el.children("a");
                                    }
                                    if (controller) {
                                        //controller.attr("aria-expanded", "true");
                                        MadCap.Accessibility.setAriaControls(controller, $ul, "submenu");
                                    }
                                }

                                callback();
                            });
                        },
                        function () {
                            var el = self._NodeElMap[self.GetNodeHash(node)][0];
                            self._UnhideNode(el);
                            self._SelectNode(el);

                            // Any preloaded (already visible) nodes that were not loaded at this point should be reset/removed.
                            // This can happen if a topic is in two places in the TOC and the node being sync'd is not the preloaded one.
                            self._ResetPreloadedNodes(self._RootUl);
                        }
                    );
                }
            }

            function FindNode(href) {
                self._HelpSystem.FindNode(self._RuntimeFileType, tocPath, href, function (node) {
                    if (!node) { // if we don't find a node, try looking for plain path
                        if (!MadCap.String.IsNullOrEmpty(href.Fragment) || !MadCap.String.IsNullOrEmpty(href.Query)) {
                            var url = new MadCap.Utilities.Url(href.PlainPath);
                            self._HelpSystem.FindNode(self._RuntimeFileType, tocPath, url, OnFoundNode, self._LinkedToc);
                        }
                    }
                    else {
                        OnFoundNode(node);
                    }
                }, self._LinkedToc);
            }

            var cshid = href.HashMap.GetItem('cshid');

            if (cshid != null) {
                self._HelpSystem.LookupCSHID(cshid, function (idInfo) {
                    var url = idInfo.Found ? new MadCap.Utilities.Url(idInfo.Topic).ToRelative(self._HelpSystem.GetContentPath())
                        : new MadCap.Utilities.Url(self._HelpSystem.DefaultStartTopic);
                    FindNode(url);
                });
            }
            else {
                FindNode(href);
            }
        });
    };

    TocPane.prototype._UnhideNode = function (tocNode) {
        var currentSkin = this._HelpSystem.GetCurrentSkin();

        if (this.IsAccordionMenu(currentSkin) || isTriPane) {
            while (tocNode != null) {
                this.SetTocMenuItemExpanded(tocNode, true);
                tocNode = MadCap.Dom.GetAncestorNodeByTagName(tocNode, "li", this._RootUl);
            }
        }
    };

    TocPane.prototype._SelectNode = function (node) {
        var $node = $(node);

        $deselectNodes = $("." + this._TreeNodeSelectedClass, this._RootUl);
        this.SetTocMenuItemSelected($deselectNodes, false);

        this.SetTocMenuItemSelected($node, true);
        $node.scrollintoview();
    };

    TocPane.prototype._ResetPreloadedNodes = function (rootEl) {
        $('.' + this._TreeNodePreloadedClass, rootEl).parent().each(function () {
            if (this !== rootEl) {
                var $ul = $(this);
                // reset expanded state to collapsed
                $ul.parent().find('a > span').attr('aria-expanded', false);
                // remove preloaded nodes
                $ul.remove();
            }
        });
    }

    TocPane.prototype.GetNodeHash = function (node) {
        return node.toc.helpSystem.TocUrl + ":c" + node.c + "i" + node.i;
    }

    TocPane.prototype.IsAccordionMenu = function (currentSkin) {
        return this._IsSideNavMenu ||
            (this._IsOffCanvasMenu && currentSkin && currentSkin.WebHelpOptions &&
                currentSkin.WebHelpOptions.OffCanvasMenuStyle == "Accordion") ||
            (previewMode && this._$RootUl.attr("data-accordion-menu") > "");
    }

    TocPane.prototype.IsDrillDownMenu = function (currentSkin) {
        return this._IsOffCanvasMenu && !this.IsAccordionMenu(currentSkin);
    }

})();


// Global object that acts as a namespace
var objTabGroupBar = {
    tabsContainer:null,
    tabView:null,
    window:null,
    tabsLoaded:false,
    debug: false,
	ignoreNextEvent: false,
	hideWhenMouseIsAway: false,
};

objTabGroupBar.init = function(window){
	tabsContainer = document.getElementById("TabGroupBar-TabBox-Tabs");
	// this.addTab("init called");
	tabView = this.getTabView();
	this.window = window;


	var preferences = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService).getBranch("extensions.tabgroupbar.");
	this.hideWhenMouseIsAway = preferences.getBoolPref("hideOnMouseLeave");
	preferences.addObserver("", this, false);


	this.addGlobalEventListeners();	
	this.addTabContextMenuItems();
	if(this.hideWhenMouseIsAway){
	    this.enableHideToolbarOnMouseAway();
	}
	tabView._initFrame(this.addGroupTabs);
};

objTabGroupBar.observe = function(subject, topic, data){
    if (topic != "nsPref:changed"){
        return;
    }
    
    var preferences = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService).getBranch("extensions.tabgroupbar.");
    this.hideWhenMouseIsAway = preferences.getBoolPref("hideOnMouseLeave");
    if(this.hideWhenMouseIsAway){
        this.enableHideToolbarOnMouseAway();
    }
    else{
        this.disableHideToolbarOnMouseAway();
    }
};

objTabGroupBar.addTabContextMenuItems = function(){
    var tabContextMenu = document.getElementById("tabContextMenu");


    var menu = document.createElement("menu");
    menu.setAttribute("label", "Move tab to group");
    var popup = document.createElement("menupopup");
    popup.setAttribute("onpopupshowing", "objTabGroupBar.populateMoveToGroupPopup(event);");
    menu.appendChild(popup);
    tabContextMenu.appendChild(menu);

    menu = document.createElement("menu");
    menu.setAttribute("label", "Move all tabs for this domain to group");
    popup = document.createElement("menupopup");
    popup.setAttribute("onpopupshowing", "objTabGroupBar.populateMoveAllThisDomainToGroupPopup(event);");
    menu.appendChild(popup);
    tabContextMenu.appendChild(menu);
};

objTabGroupBar.addGlobalEventListeners = function(){
	let tabContainer = this.window.getBrowser().tabContainer;
	let reloadOnEvent = function(event) {
		if(!objTabGroupBar.ignoreNextEvent)
			objTabGroupBar.reloadGroupTabs();
		objTabGroupBar.ignoreNextEvent = false;
	};
	tabContainer.addEventListener("TabSelect", reloadOnEvent);
	window.addEventListener("tabviewframeinitialized", reloadOnEvent);
	window.addEventListener("SSTabRestored", reloadOnEvent);
	window.addEventListener("tabviewhidden", reloadOnEvent);
};

objTabGroupBar.enableHideToolbarOnMouseAway = function(){
	
	this.hideToolbar = function(event) { document.getElementById("TabGroupBar-Toolbar").setAttribute("collapsed", "true"); };
	this.showToolbar = function(event) { document.getElementById("TabGroupBar-Toolbar").setAttribute("collapsed", "false"); };
	
	this.hideToolbar();
	
	let toolbox = document.getElementById("navigator-toolbox");
	toolbox.addEventListener("mouseleave", this.hideToolbar);
	toolbox.addEventListener("mouseover", this.showToolbar);
	toolbox.addEventListener("mouseenter", this.showToolbar);
};


objTabGroupBar.disableHideToolbarOnMouseAway = function(){
    this.showToolbar();
    var toolbox = document.getElementById("navigator-toolbox");
    toolbox.removeEventListener("mouseleave", this.hideToolbar);
    toolbox.removeEventListener("mouseover", this.showToolbar);
    toolbox.removeEventListener("mouseenter", this.showToolbar);
};

/////////////////////// Utilities ////////////////////////////

// Adds a simple tab that does nothing. 
// Originally created for test, currently used during development for debugging.
objTabGroupBar.addTab = function(label){
   var tab = document.createElement("tab");
   tab.setAttribute("label", label);
   tabsContainer.appendChild(tab);
}

objTabGroupBar.getTabView = function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var browserWindow = wm.getMostRecentWindow("navigator:browser");
    return browserWindow.TabView;
};


objTabGroupBar.getPopupSourceElement = function(event){
    return event.target.parentNode.triggerNode;
};


objTabGroupBar.getGroupForTab = function(tab){
	let groupId = tab.value;//parseInt(tab.getAttribute("groupid"));
    let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
	return group;
};

objTabGroupBar.getDomainFromURL = function(url){
    var domainFindingRegex = /:\/\/(.[^/]+)/;
    var matches = url.match(domainFindingRegex);
	return matches[1];
}

objTabGroupBar.getUrlForTab = function(tab){
	return this.window.gBrowser.getBrowserForTab(tab).currentURI.spec;
};

objTabGroupBar.addDebugTabs = function(){
	return;
	
    this.addTab(this.hideWhenMouseIsAway);
	//This adds all domains found in all groups
	this.tabView = this.getTabView();
    let contentWindow = tabView.getContentWindow();
    let groupItems = contentWindow.GroupItems.groupItems;
    for (i= 0; i<groupItems.length;i++){
		let tabs = groupItems[i].getChildren();
		this.addTab("Group: " + groupItems[i].getTitle() + ", " + tabs.length + " tabs");
		for(j=0; j<tabs.length;j++){
			let url = this.getUrlForTab(tabs[j].tab);
		    // this.addTab(url);
			this.addTab(this.getDomainFromURL(url));
		}
		
	}
	
}

/////////////////////// Main tab bar /////////////////////////

// Takes a parameter so it can be used as an event handler
objTabGroupBar.reloadGroupTabs = function(event){
    this.clearGroupTabs();
    this.addGroupTabs();
	this.addDebugTabs();
};

// Puts the tabs on the main bar
objTabGroupBar.addGroupTabs = function(){
	this.tabView = this.getTabView();
    let contentWindow = tabView.getContentWindow();
    let groupItems = contentWindow.GroupItems.groupItems;
    let activeGroup = contentWindow.GroupItems.getActiveGroupItem();
    for (i= 0; i<groupItems.length;i++)
    {
        this.addGroupTab(groupItems[i]);
		groupItems[i].addSubscriber("close", this.reloadGroupTabs);
        this.tabsLoaded = true;
        if(groupItems[i]==activeGroup){
              tabsContainer.selectedItem=tabsContainer.lastChild;
        }
    }
};

objTabGroupBar.addGroupTab = function(groupItem) {
    var title = groupItem.getTitle();
    if(!title) {
        title = "(none)";
    }
    if(this.debug) {title = title + ":" + groupItem.id;}
    var tab = document.createElement("tab");
    tab.setAttribute("label", title);
    tab.setAttribute("id", "TabGroupBar-GroupTab-" + groupItem.id);
	tab.setAttribute("groupid", groupItem.id);
	tab.setAttribute("draggable", "true");
	tab.setAttribute("droppable", "true");
	tab.setAttribute("context", "TabGroupBar-TabContextMenu");
	tab.setAttribute("flex", 1);
	tab.value = groupItem.id;
	
	
    tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(" + groupItem.id + ");");
	tab.setAttribute("ondblclick", "objTabGroupBar.onDbClickTab(event);");
	// tab.setAttribute("ondragstart", "objTabGroupBar.onTabDragStrart(event);");
	/* tab.setAttribute("ondragend", "objTabGroupBar.addTab('drag end');objTabGroupBar.addTab(event.dataTransfer.dropEffect);");
	tab.addEventListener("dragstart", function(e) {objTabGroupBar.addTab("dragstart");});
	tab.addEventListener("dragend",   function(e) {objTabGroupBar.addTab("dragend");});
	tab.addEventListener("dragenter", this.onTabDragOver);
	tab.addEventListener("dragover", this.onTabDragOver); */
	
    tabsContainer.appendChild(tab);
};


objTabGroupBar.clearGroupTabs = function(){
	while(tabsContainer.firstChild)
	{
		tabsContainer.removeChild(tabsContainer.firstChild);
	}
    /* var tabs = [];
    var childNodes = tabsContainer.childNodes;
	for(i=0;i<childNodes.length;i++)
	{
		if(childNodes[i].tagName.toLocaleLowerCase()=='tab')
		{
			tabs.push(childNodes[i]);
		}
	}
    tabs.forEach(function(tab){
        tabsContainer.removeChild(tab);
    }); */

};


objTabGroupBar.clearChildren = function(node){
	while(node.firstChild)
	{
		node.removeChild(node.firstChild);
	}
};


///////////// Drag and drop handlers /////////////
objTabGroupBar.onTabDragStrart = function(event){
	let tab = event.target;
	let dt = event.dataTranfer;
	dt.effectAllowed = "move";
	dt.dropeffect = "move";
	dt.setData("application/x-moz-node", tab);
	dt.setData("text/plain", tab.getAttribute("groupid"));
	event.stopPropagation();
	event.preventDefault();
};

objTabGroupBar.onTabDragOver = function(event){
	this.addTab("drop");
	this.addTab(event.target.nodeName);
	if(event.dataTransfer.types.contains("application/x-moz-node")){
		event.preventDefault();
		event.stopPropagation();
	}
};

objTabGroupBar.onTabDrop = function(event){
	this.addTab("tabdrop");
};

//////////////// Actions performed by toolbar elements //////////////////

objTabGroupBar.switchGroupTo = function(groupId){
    let contentWindow = tabView.getContentWindow();
    var groupItems = contentWindow.GroupItems;
    var groupToActivate = groupItems.groupItem(groupId);
    let tabItem = groupToActivate.getActiveTab();
    if (!tabItem) {
        tabItem = groupToActivate.getChild(0);
    }
	var tab;
	if(tabItem)
	{
		tab = tabItem.tab;
	}
	else
	{
		tab = this.window.getBrowser().addTab("about:blank");
		GroupItems.moveTabToGroupItem(tab, groupToActivate.id);
	}
	this.ignoreNextEvent = true; //tells the extension to ignore the TabSelected event caused by switching groups
    this.window.gBrowser.selectedTab = tabItem.tab;
};


objTabGroupBar.onCloseGroupContextMenuAction  =  function(event){
    let tab = this.getPopupSourceElement(event);
    let groupId = parseInt(tab.getAttribute("groupid"));
    this.closeGroup(groupId);
    this.reloadGroupTabs();
};

objTabGroupBar.closeGroup = function(groupId){
    let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
    group.getChildren().forEach(function(tab){tab.close();});
    group.close({immediately: true});
};

objTabGroupBar.createNewGroup = function(){
	tabView._initFrame(function(){
		var GroupItems = objTabGroupBar.tabView.getContentWindow().GroupItems;
		var newGroup =  GroupItems.newGroup();
		var blankTab = objTabGroupBar.window.getBrowser().addTab("about:blank");
		GroupItems.moveTabToGroupItem(blankTab, newGroup.id);
		objTabGroupBar.addGroupTab(newGroup);
	});
};

objTabGroupBar.renameGroupContextAction = function(event){
    this.createRenameGroupTextBox(event.target.parentNode.triggerNode);
};

objTabGroupBar.onDbClickTab = function(event){
    this.createRenameGroupTextBox(event.target);
};

objTabGroupBar.createRenameGroupTextBox = function(tab){
    let groupTitle = tab.getAttribute("label");
    tab.setAttribute("groupTitle", groupTitle);
    tab.setAttribute("label", "");
	tab.disabled = true;
    let textBox = document.createElement("textbox");
    textBox.setAttribute("value", groupTitle);
    textBox.setAttribute("onkeypress", "objTabGroupBar.onKeyPressedRenameGroupTextBox(event);");
    textBox.setAttribute("onblur", "objTabGroupBar.onBlurRenameGroupTextBox(event);");
	textBox.setAttribute("onclick", "event.target.inputField.onclick();");
	textBox.clickSelectsAll = true;
    tab.appendChild(textBox);
    textBox.parent = tab;
    textBox.focus();
};

objTabGroupBar.onBlurRenameGroupTextBox = function(event){
    let tab = event.target.parent;
    tab.removeChild(event.target);
    if(tab.getAttribute("groupTitle"))
    {
        tab.setAttribute("label", tab.getAttribute("groupTitle"));
    }
	tab.disabled = false;
};

objTabGroupBar.onKeyPressedRenameGroupTextBox = function(event){
    if(event.keyCode == KeyEvent.DOM_VK_RETURN)
    {
        let tab = event.target.parent;
        let title = event.target.value;
        tab.setAttribute("label", title);
        tab.setAttribute("groupTitle", title);
        tab.removeChild(event.target);
		tab.disabled = false;
        this.renameGroup(this.getGroupForTab(tab), title);
    }
	event.stopPropagation();
};


objTabGroupBar.renameGroup = function(group, title){
    // let groupId = parseInt(tab.getAttribute("groupid"));
    // let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
    // let title = tab.getAttribute("label");
    group.setTitle(title);
};

objTabGroupBar.onTabListPopupShowing = function(event){
	let popup = event.target;
	let group = this.getGroupForTab(event.target.parentNode.parentNode.triggerNode);
	let tabs = group.getChildren();
	let tabContainer = this.window.gBrowser.tabContainer;
	
	let selectTab = function(event) { 
		objTabGroupBar.window.gBrowser.tabContainer.selectedIndex = event.target.value; 
		// let groupTab = event.target.parentNode.parentNode.parentNode.triggerNode
		// objTabGroupBar.tabsContainer.selectedItem = groupTab;
		objTabGroupBar.reloadGroupTabs();
	};
	
	for(i=0; i<tabs.length;i++)
	{
		let tab = tabs[i].tab;
		let item = document.createElement("menuitem");
		item.setAttribute("label", tab.label);
		item.setAttribute("image", tab.image);
		item.className = "menuitem-iconic";
		item.value = tabContainer.getIndexOfItem(tab);
		item.addEventListener("command", selectTab);
		popup.appendChild(item);
	}
};



objTabGroupBar.populateMoveToGroupPopup = function(event){
    var moveToGroupAction = function(event){
        var groupId = event.target.value;
        //starting with event.target: menu item - MoveToPopup - enclosing menu - tab context menu - clicked tab
        var tab = event.target.parentNode.parentNode.parentNode.triggerNode;
        objTabGroupBar.tabView.getContentWindow().GroupItems.moveTabToGroupItem(tab, groupId);
    };

    this._populateMoveToGroupPopup(event, moveToGroupAction);
    
};

objTabGroupBar.populateMoveAllThisDomainToGroupPopup = function(event){
    var action = function(event){
        var groupId = event.target.value;
        //starting with event.target: menu item - MoveToPopup - enclosing menu - tab context menu - clicked tab
        var tab = event.target.parentNode.parentNode.parentNode.triggerNode;
        var domain = objTabGroupBar.getDomainFromURL(objTabGroupBar.getUrlForTab(tab));
        objTabGroupBar.addTab(domain);
        var GroupItems = objTabGroupBar.tabView.getContentWindow().GroupItems;
        var tabs = GroupItems.getActiveGroupItem().getChildren();
        var tabsToMove = [];
        for(let i=0;i<tabs.length;i++){
            if(objTabGroupBar.getDomainFromURL(objTabGroupBar.getUrlForTab(tabs[i].tab))==domain)
                tabsToMove.push(tabs[i].tab);
        }
        for(let i=0;i<tabsToMove.length;i++){
            GroupItems.moveTabToGroupItem(tabsToMove[i], groupId);
        }
    };

    this._populateMoveToGroupPopup(event, action);
};

objTabGroupBar._populateMoveToGroupPopup = function(event, onCommandAction){
    // Extract the domain of the open page of the tab
    //starting with event.target: MoveToPopup - enclosing menu - tab context menu - clicked tab
    var popup = event.target;
    this.clearChildren(popup);
    //var testNode = document.createElement("menuitem");
    //testNode.setAttribute("label", "test");
    //popup.appendChild(testNode);
    var tab = event.target.parentNode.parentNode.triggerNode;
    var domain = this.getDomainFromURL(this.getUrlForTab(tab));
    var groupItems = this.tabView.getContentWindow().GroupItems.groupItems;
    var activeGroupItem = this.tabView.getContentWindow().GroupItems.getActiveGroupItem();
    var separator = document.createElement("menuseparator");
    popup.appendChild(separator);
    for(i=0;i<groupItems.length;i++){
        //testNode.setAttribute("label", 1);
        let groupItem = groupItems[i];
        if(groupItem!=activeGroupItem) { //skip the tab group we're in
            //testNode.setAttribute("label", 2);
            let moveToGroupItem = document.createElement("menuitem");
            moveToGroupItem.setAttribute("label", groupItem.getTitle());
            moveToGroupItem.setAttribute("value", groupItem.id);
            //testNode.setAttribute("label", 3);
            moveToGroupItem.addEventListener("command", onCommandAction);
            //testNode.setAttribute("label", 4);
            let isCandidateForDomainGroup = this.areTabsForDomainInGroup(groupItem, domain);
            //testNode.setAttribute("label", 5);

            if(isCandidateForDomainGroup){
                popup.insertBefore(moveToGroupItem, separator);
            }
            else{
                popup.appendChild(moveToGroupItem);
            }
        }
    }
};

//If any of the tabs in the tab group are open to pages in the given domain, return true.
objTabGroupBar.areTabsForDomainInGroup = function(group, domain){
    let tabs = group.getChildren();
    for(let i = 0;i<tabs.length;i++){
        let tabUrl = this.getUrlForTab(tabs[i].tab);
        let tabDomain = this.getDomainFromURL(tabUrl);
		if(tabDomain==domain)
			return true;
	}
	return false;
};


/////////////////// Initialize the extension on window load ///////////////////////////
window.addEventListener("load",
    function(e)
    {
        objTabGroupBar.init(window);
    },
false);

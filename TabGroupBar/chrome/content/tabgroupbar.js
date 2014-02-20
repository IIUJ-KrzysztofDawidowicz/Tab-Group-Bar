
// Global object that acts as a namespace
var objTabGroupBar = {
    tabsContainer:null,
    tabView:null,
    window:null,
    tabsLoaded:false,
    debug: false,
    ignoreNextEvent: false,
    hideWhenMouseIsAway: false,
    debugTabs: [],
};

objTabGroupBar.init = function(window){
    var Cu = Components.utils;
    var consoleJSM = Cu.import("resource://gre/modules/devtools/Console.jsm", {});
    this.console = consoleJSM.console; //access exported symbol of "console" from the Console.jsm

    this.tabsContainer = document.getElementById("TabGroupBar-TabBox-Tabs");
    // this.addTab("init called");
    this.tabView = this.getTabView();
    this.window = window;


    this.refreshInfo();


    this.addGlobalEventListeners();	
    this.addTabContextMenuItems();
    if(this.hideWhenMouseIsAway){
        this.enableHideToolbarOnMouseAway();
    }
    this.tabView._initFrame(this.addGroupTabs);
};

objTabGroupBar.observe = function(subject, topic, data){
    //if (topic != "nsPref:changed"){
    //    return;
    //}
    
    this.refreshInfo();
};

objTabGroupBar.refreshInfo = function(){
    let console = (Cu.import("resource://gre/modules/devtools/Console.jsm", {})).console;
    console.log("Preference change");
    var preferences = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.tabgroupbar.");
    preferences.QueryInterface(Components.interfaces.nsIPrefBranch);
    var previousValue = this.hideWhenMouseIsAway;
    this.hideWhenMouseIsAway = preferences.getBoolPref("hideOnMouseLeave");
    if(previousValue==this.hideWhenMouseIsAway) return;

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
    //popup.setAttribute("onpopupshowing", "objTabGroupBar.populateMoveToGroupPopup(event);");
    popup.addEventListener("popupshowing", function(event){ objTabGroupBar.populateMoveToGroupPopup(event);});
    menu.appendChild(popup);
    tabContextMenu.appendChild(menu);

    menu = document.createElement("menu");
    menu.setAttribute("label", "Move all tabs for this domain to group");
    popup = document.createElement("menupopup");
    //popup.setAttribute("onpopupshowing", "objTabGroupBar.populateMoveAllThisDomainToGroupPopup(event);");
    popup.addEventListener("popupshowing", function(event) {objTabGroupBar.populateMoveAllThisDomainToGroupPopup(event);});
    menu.appendChild(popup);
    tabContextMenu.appendChild(menu);
};

objTabGroupBar.addGlobalEventListeners = function(){
    var tabContainer = this.window.getBrowser().tabContainer;
    var reloadOnEvent = function(event) {
		// let console = (Cu.import("resource://gre/modules/devtools/Console.jsm", {})).console;
		// console.log("Reload group tabs");
        if(!objTabGroupBar.ignoreNextEvent)
            objTabGroupBar.reloadGroupTabs();
        objTabGroupBar.ignoreNextEvent = false;
    };
    var changeGroupTab = function(e) {
		// let console = (Cu.import("resource://gre/modules/devtools/Console.jsm", {})).console;
		// console.log("Change group tab");
		if(!objTabGroupBar.ignoreNextEvent)
			objTabGroupBar.switchGroupTo(e.target.selectedItem.value);
		objTabGroupBar.ignoreNextEvent = false;
	};
	var loadOnRestore = function(event) {
		objTabGroupBar.ignoreNextEvent = true;
		objTabGroupBar.reloadGroupTabs();
		objTabGroupBar.ignoreNextEvent = false;
	};
	var switchSelectedGroupTab = function(event) {
		if(objTabGroupBar.ignoreNextEvent) return;
		var activeGroupId = event.target._tabViewTabItem.parent.id;
		var tabs = objTabGroupBar.tabsContainer.childNodes;
		for(let i=0;i<tabs.length;i++)
		{
			if(tabs[i].value==activeGroupId)
			{
				objTabGroupBar.ignoreNextEvent = true; //Ignore the select event from this
				objTabGroupBar.tabsContainer.selectedIndex = i;
				objTabGroupBar.ignoreNextEvent = false; 
				return;
			}
		}
	};
	tabContainer.addEventListener("TabSelect", switchSelectedGroupTab);
	this.tabsContainer.addEventListener("select", changeGroupTab, false);
    window.addEventListener("tabviewframeinitialized", loadOnRestore);
    window.addEventListener("SSTabRestored", loadOnRestore);
    document.addEventListener("tabviewhidden", reloadOnEvent);
};

objTabGroupBar.hideToolbar = function TabGroupBar__hideToolbar (event) { document.getElementById("TabGroupBar-Toolbar").setAttribute("collapsed", "true"); };
objTabGroupBar.showToolbar = function TabGroupBar__showToolbar (event) { document.getElementById("TabGroupBar-Toolbar").setAttribute("collapsed", "false"); };

objTabGroupBar.enableHideToolbarOnMouseAway = function(){
    
    this.hideToolbar();
    
    var toolbox = document.getElementById("navigator-toolbox");
    toolbox.addEventListener("mouseleave", objTabGroupBar.hideToolbar);
    //toolbox.addEventListener("mouseover", this.showToolbar);
    toolbox.addEventListener("mouseenter", objTabGroupBar.showToolbar);
};


objTabGroupBar.disableHideToolbarOnMouseAway = function(){
    this.showToolbar();
    var toolbox = document.getElementById("navigator-toolbox");
    toolbox.removeEventListener("mouseleave", objTabGroupBar.hideToolbar);
    //toolbox.removeEventListener("mouseover",  this.showToolbar);
    toolbox.removeEventListener("mouseenter", objTabGroupBar.showToolbar);
};

/////////////////////// Utilities ////////////////////////////

// Adds a simple tab that does nothing. 
// Originally created for test, currently used during development for debugging.
objTabGroupBar.addTab = function(label){
   var tab = document.createElement("tab");
   tab.setAttribute("label", label);
   this.tabsContainer.appendChild(tab);
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
    return this.tabView.getContentWindow().GroupItems.groupItem(tab.value);
};

objTabGroupBar.getDomainFromURL = function(url){
    var domainFindingRegex = /:\/\/(.[^/]+)/;
    var matches = url.match(domainFindingRegex);
    if(matches==null || matches.length<2)
        return null;
    return matches[1];
}

objTabGroupBar.getUrlForTab = function(tab){
    return this.window.gBrowser.getBrowserForTab(tab).currentURI.spec;
};

objTabGroupBar.addDebugTabs = function(){
    return;
    
}

/////////////////////// Main tab bar /////////////////////////

// Takes a parameter so it can be used as an event handler
objTabGroupBar.reloadGroupTabs = function(event){
    this.refreshInfo();
    this.clearGroupTabs();
    this.addGroupTabs();
    this.addDebugTabs();
};

// Puts the tabs on the main bar
objTabGroupBar.addGroupTabs = function(){
    this.tabView = this.getTabView();
    let contentWindow = this.tabView.getContentWindow();
    let groupItems = contentWindow.GroupItems.groupItems;
    let activeGroup = contentWindow.GroupItems.getActiveGroupItem();
    for (let i = 0; i<groupItems.length;i++)
    {
        this.addGroupTab(groupItems[i]);
        groupItems[i].addSubscriber("close", this.reloadGroupTabs);
        this.tabsLoaded = true;
        if(groupItems[i]==activeGroup){
              this.tabsContainer.selectedItem=this.tabsContainer.lastChild;
        }
    }
};

objTabGroupBar.getGroupTitle = function(groupItem){
    var title = groupItem.getTitle();
    if(!title) {
        title = "Group " + groupItem.id;
    }
    return title;
}

objTabGroupBar.addGroupTab = function(groupItem) {
    var title = this.getGroupTitle(groupItem);
    if(this.debug) {title = title + ":" + groupItem.id;}
    var tab = document.createElement("tab");
    tab.setAttribute("label", title);
    //tab.setAttribute("id", "TabGroupBar-GroupTab-" + groupItem.id);
    tab.setAttribute("context", "TabGroupBar-TabContextMenu");
    tab.value = groupItem.id;
    
    
    //tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(event.target.value);");
    //tab.addEventListener("command", function(event) {objTabGroupBar.switchGroupTo(event.target.value);});
    //tab.setAttribute("ondblclick", "objTabGroupBar.createRenameGroupTextBox(event.target);");
    tab.addEventListener("dblclick", function(event) {objTabGroupBar.createRenameGroupTextBox(event.target);});
    
    this.tabsContainer.appendChild(tab);
};


objTabGroupBar.clearGroupTabs = function(){
    while(this.tabsContainer.firstChild)
    {
        this.tabsContainer.removeChild(this.tabsContainer.firstChild);
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


//////////////// Actions performed by toolbar elements //////////////////
objTabGroupBar.switchGroupTo = function(groupId){

    let contentWindow = this.tabView.getContentWindow();
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
    let groupId = parseInt(tab.value);
    this.closeGroup(groupId);
    this.reloadGroupTabs();
};

objTabGroupBar.closeGroup = function(groupId){
    var group = this.tabView.getContentWindow().GroupItems.groupItem(groupId);
    group.getChildren().forEach(function(tab){tab.close();});
    group.close({immediately: true});
};

objTabGroupBar.createNewGroup = function(){
    this.tabView._initFrame(function(){
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
    //textBox.setAttribute("onkeypress", "objTabGroupBar.onKeyPressedRenameGroupTextBox(event);");
    textBox.addEventListener("keypress", function(event) {objTabGroupBar.onKeyPressedRenameGroupTextBox(event);});
    //textBox.setAttribute("onblur", "objTabGroupBar.onBlurRenameGroupTextBox(event);");
    textBox.addEventListener("blur", function(event) {objTabGroupBar.onBlurRenameGroupTextBox(event);});
    //textBox.setAttribute("onclick", "event.target.inputField.onclick();");
    textBox.addEventListener("click", function(event) {event.target.inputField.onclick();});
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
    
    for(let i =0; i<tabs.length;i++)
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
        //objTabGroupBar.addTab(domain);
        var GroupItems = objTabGroupBar.tabView.getContentWindow().GroupItems;
        var tabs = GroupItems.getActiveGroupItem().getChildren();
        var tabsToMove = [];
        for(let i =0;i<tabs.length;i++){
            if(objTabGroupBar.getDomainFromURL(objTabGroupBar.getUrlForTab(tabs[i].tab))==domain)
                tabsToMove.push(tabs[i].tab);
        }
        for(let i =0;i<tabsToMove.length;i++){
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
    
    if(groupItems.length<2)
    {	
        let filler = document.createElement("menuitem");
        filler.setAttribute("label", "No groups");
        filler.setAttribute("disabled", true);
        popup.appendChild(filler);
        return;
    }
    
    
    var activeGroupItem = this.tabView.getContentWindow().GroupItems.getActiveGroupItem();
    var separator = document.createElement("menuseparator");
    popup.appendChild(separator);
    for(let i =0;i<groupItems.length;i++){
        //testNode.setAttribute("label", 1);
        let groupItem = groupItems[i];
        if(groupItem!=activeGroupItem) { //skip the tab group we're in
            //testNode.setAttribute("label", 2);
            let moveToGroupItem = document.createElement("menuitem");
            moveToGroupItem.setAttribute("label", this.getGroupTitle(groupItem));
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

objTabGroupBar.toggleBar = function(){
    var isCollapsed = document.getElementById("TabGroupBar-Toolbar").getAttribute("collapsed");
    if (isCollapsed=="true") {
        this.showToolbar();
    }
    else{
        this.hideToolbar();
    }
};


/////////////////// Initialize the extension on window load ///////////////////////////
window.addEventListener("load",
    function(e)
    {
        objTabGroupBar.init(window);
    },
false);

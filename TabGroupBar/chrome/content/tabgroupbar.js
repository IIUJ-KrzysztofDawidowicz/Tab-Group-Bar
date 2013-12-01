var objTabGroupBar = {
    tabsContainer:null,
    tabView:null,
    window:null,
    tabsLoaded:false,
    debug: false
};

objTabGroupBar.init = function(window)
{
   tabsContainer = document.getElementById("TabGroupBar-TabBox-Tabs");
   // this.addTab("init called");
   tabView = this.getTabView();
   this.window = window;
   this.addTabContainerEventListeners(window.getBrowser().tabContainer);
	window.addEventListener("tabviewframeinitialized", function(event) {objTabGroupBar.reloadGroupTabs();});
   tabView._initFrame(this.reloadGroupTabs);
   // this.addTab("init finished");
};

objTabGroupBar.addTabContainerEventListeners = function(tabContainer){
	let reloadOnEvent = function(event) {objTabGroupBar.reloadGroupTabs();};
	tabContainer.addEventListener("TabSelect", reloadOnEvent);
	// tabContainer.addEventListener("TabSelect")
};
objTabGroupBar.reloadGroupTabs = function(){
    this.clearGroupTabs();
    this.addGroupTabs();
};


objTabGroupBar.addTab = function(label)
{
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

// Puts the tabs on the main bar
objTabGroupBar.addGroupTabs = function(){
	this.tabView = this.getTabView();
    let contentWindow = tabView.getContentWindow();
    let groupItems = contentWindow.GroupItems.groupItems;
    let activeGroup = contentWindow.GroupItems.getActiveGroupItem();
    for (i= 0; i<groupItems.length;i++)
    {
        this.addGroupTab(groupItems[i]);
        this.tabsLoaded = true;
        if(groupItems[i]==activeGroup)
        {
              tabsContainer.selectedItem=tabsContainer.lastChild;
        }
    }
};

objTabGroupBar.addGroupTab = function(groupItem) {
    var label = groupItem.getTitle();
    if(!label) {
        label = "(none)";
    }
    if(this.debug) {label = label + ":" + groupItem.id;}
    var tab = document.createElement("tab");
    tab.setAttribute("id", "TabGroupBar-GroupTab-" + groupItem.id);
    tab.setAttribute("label", label);
    tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(" + groupItem.id + ");");
	tab.setAttribute("draggable", "true");
	tab.setAttribute("droppable", "true");
	tab.setAttribute("context", "TabGroupBar-TabContextMenu");
	tab.setAttribute("ondblclick", "objTabGroupBar.onDbClickTab(event);")
	tab.setAttribute("groupid", groupItem.id);
    tabsContainer.appendChild(tab);
};

objTabGroupBar.switchGroupTo = function(groupId){
    let contentWindow = tabView.getContentWindow();
    var groupItems = contentWindow.GroupItems;
    var groupToActivate = groupItems.groupItem(groupId);
    let tabItem = groupToActivate.getActiveTab();
    if (! tabItem) {
        tabItem = groupToActivate.getChild(0);
    }
    this.window.gBrowser.selectedTab = tabItem.tab;
};

objTabGroupBar.clearGroupTabs = function(){
    var tabs = [];
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
    });

};

objTabGroupBar.getPopupSourceElement = function(event){
    return event.target.parentNode.triggerNode;
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
    let GroupItems = tabView.getContentWindow().GroupItems;
    let newGroup = GroupItems.newGroup();
    let blankTab = this.window.getBrowser().addTab("about:blank");
    GroupItems.moveTabToGroupItem(blankTab, newGroup.id);
    this.addGroupTab(newGroup);
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

objTabGroupBar.getGroupForTab = function(tab){
	let groupId = parseInt(tab.getAttribute("groupid"));
    let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
	return group;
};

objTabGroupBar.renameGroup = function(group, title){
    // let groupId = parseInt(tab.getAttribute("groupid"));
    // let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
    // let title = tab.getAttribute("label");
    group.setTitle(title);
};


window.addEventListener("load",
    function(e)
    {
        objTabGroupBar.init(window);
    },
false);

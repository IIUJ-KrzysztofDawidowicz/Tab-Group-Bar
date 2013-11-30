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
   tabView = window.TabView;//this.getTabView();/*window.parent.TabView;*/ /*document.getElementById("tab-view");*/
   this.window = window;
//   this.addTab("Dynamic Tab 1");
//    window.addEventListener("tabviewframeinitialized", this.addGroupTabs, false);
//    objTabGroupBar.addGroupTabs();
//    if(!window.TabView.hasOwnProperty('_initFrame'))
//    {
//        this.addTab("No _initFrame");
//        return;
//    }
//	else
//	{
//        this.addTab("_initFrame exists");
//
//	}

    window.TabView._initFrame(this.addGroupTabs);
};

objTabGroupBar.reloadGroupTabs = function(){
    this.clearGroupTabs();
//    this.getTabView()._initFrame(this.addGroupTabs);
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
//    if(this.tabsLoaded) {this.clearGroupTabs();}
////    var activeGroupItem = tabView.contentWindow.GroupItems.getActiveGroupItem();
//    tabView = this.getTabView();
//    if(!tabView)
//    {
//        this.addTab("No tab view");
//        return;
//    }
//    else
//    {
//        this.addTab("We have tab view");
//    }
/*
    var contentWindow = tabView.getContentWindow();
    if(!contentWindow)
    {
        this.addTab("No content window");
        return;
    }
    else
    {
        this.addTab("We have content window");
    }
    this.addTab(contentWindow.GroupItems.toString());*/
//    this.addTab("tabAddingStarted");
	this.tabView = this.getTabView();
    let contentWindow = tabView.getContentWindow();
    if(!contentWindow)
    {
        setTimeout(function(){objTabGroupBar.addGroupTabs();}, 1000);
    }
//            if(!contentWindow)
//                {
//                    this.addTab("No content window");
//                    return;
//                }
//                else
//                {
//                    this.addTab("We have content window");
//                }
//                this.addTab(contentWindow.GroupItems.toString());
    let groupItems = contentWindow.GroupItems.groupItems;
    let activeGroup = contentWindow.GroupItems.getActiveGroupItem();
    for (i= 0; i<groupItems.length;i++)
    {
        this.addGroupTab(groupItems[i]);
        this.tabsLoaded = true;
        if(groupItems[i]==activeGroup)
        {
//                    tabsContainer.selectedIndex=i;
              tabsContainer.selectedItem=tabsContainer.lastChild;
        }
    }
//            this.addTab("groupItems.length = " + groupItems.length);
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
    this.window.gBrowser.selectedTab = tabItem.tab;//groupToActivate._children[0].tab;
};

objTabGroupBar.clearGroupTabs = function(){
    var tabs = [];
    var childNodes = tabsContainer.childNodes;/*.forEach(function(node){
        if(node.tagName.toLocaleLowerCase()=="tab")
        {
            tabs.push(node);
        }
    });*/
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
	//this.addTab("cleared");

//    while(tabsContainer.firstChild)
//    {
//        tabsContainer.removeChild(tabsContainer.firstChild);
//    }
};

objTabGroupBar.getPopupSourceElement = function(event){
    return event.target.parentNode.triggerNode;
};

objTabGroupBar.onCloseGroupContextMenuAction  =  function(event){
//    this.addTab("onCloseGroupContextMenuAction");
    let tab = this.getPopupSourceElement(event);
//    this.addTab("Got tab");
    let groupId = parseInt(tab.getAttribute("groupid"));
//    this.addTab("Parsed id: " + groupId);
    this.closeGroup(groupId);
    this.reloadGroupTabs();
};

objTabGroupBar.closeGroup = function(groupId){
//    this.addTab("Removing group id " + groupId);
    let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
    group.getChildren().forEach(function(tab){tab.close();});
    group.close({immediately: true});
//    this.tabView._initFrame(this.addGroupTabs());
};

objTabGroupBar.createNewGroup = function(){
//    this.addTab("Event fires");
//    if(tabView.getContentWindow()) this.addTab("contentWindow OK");
//    else this.addTab("No contentWindow");
    let GroupItems = tabView.getContentWindow().GroupItems;
//    if(!GroupItems)
//    {
//        this.addTab("No GroupItems");
//        return;
//    }
//    else
//    {
//        this.addTab("GroupItems OK");
//    }
    let newGroup = GroupItems.newGroup();
//    GroupItems.register(newGroup);
//    this.addTab(newGroup.id);
    let blankTab = this.window.getBrowser().addTab("about:blank");
//    this.addTab(blankTab.toString());
    GroupItems.moveTabToGroupItem(blankTab, newGroup.id);
    this.addGroupTab(newGroup);
};

objTabGroupBar.renameGroupContextAction = function(event){
    this.createRenameGroupTextBox(this.getPopupSourceElement);
};

objTabGroupBar.onDbClickTab = function(event){
    this.createRenameGroupTextBox(event.target);
};

objTabGroupBar.createRenameGroupTextBox = function(tab){
    let groupTitle = tab.getAttribute("label");
    tab.setAttribute("groupTitle", groupTitle);
    tab.setAttribute("label", "");
    tab.removeAttribute("oncommand");
//    this.addTab("Rename action");
    let textBox = document.createElement("textbox");
//    this.addTab("created textbox");
    textBox.setAttribute("value", groupTitle);
//    textBox.setAttribute("onclick", "event.target.focus();");
    textBox.setAttribute("onkeypress", "objTabGroupBar.onKeyPressedRenameGroupTextBox(event);");
    textBox.setAttribute("onblur", "objTabGroupBar.onBlurRenameGroupTextBox(event);");
    textBox.clickSelectsAll = true;
//    this.addTab("set attributes");
    tab.appendChild(textBox);
    textBox.parent = tab;
//    this.addTab("appended");
    textBox.focus();
};

objTabGroupBar.onBlurRenameGroupTextBox = function(event){
    let tab = event.target.parent;
    tab.removeChild(event.target);
    if(tab.getAttribute("groupTitle"))
    {
        tab.setAttribute("label", tab.getAttribute("groupTitle"));
    }
    tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(" + tab.getAttribute("groupid") + ");");
};

objTabGroupBar.onKeyPressedRenameGroupTextBox = function(event){
    if(event.keyCode == KeyEvent.DOM_VK_RETURN)
    {
//        this.addTab("key matched");
        let tab = event.target.parent;
        let title = event.target.value;
//        this.addTab("new title: " + title);
        tab.setAttribute("label", title);
        tab.setAttribute("groupTitle", title);
        tab.removeChild(event.target);
        this.renameGroupToMatchLabel(tab);
    }
    tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(" + tab.getAttribute("groupid") + ");");
};

objTabGroupBar.renameGroupToMatchLabel = function(tab){
    let groupId = parseInt(tab.getAttribute("groupid"));
    let group = tabView.getContentWindow().GroupItems.groupItem(groupId);
    let title = tab.getAttribute("label");

//    this.addTab("renaming " + groupId + " to " + title);
    group.setTitle(title);

};

window.addEventListener("load",
    function(e)
    {
//        window.removeEventListener("load", arguments.callee, false);
        objTabGroupBar.init(window/*.parent*/);
    },
false);

window.addEventListener(window.addEventListener("tabviewframeinitialized", objTabGroupBar.reloadTabs), false);
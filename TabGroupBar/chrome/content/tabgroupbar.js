var objTabGroupBar = {
    tabsContainer:null,
    tabView:null,
    window:null,
    tabsLoaded:false
};

objTabGroupBar.init = function(window)
{
   tabsContainer = document.getElementById("TabGroupBar-TabBox-Tabs");
   tabView = this.getTabView();/*window.parent.TabView;*/ /*document.getElementById("tab-view");*/
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
objTabGroupBar.addGroupTabs = function()
{
    if(this.tabsLoaded) {this.clearTabGroups();}
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
	tabView = this.getTabView();
    let contentWindow = tabView.getContentWindow();
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

};

objTabGroupBar.addGroupTab = function(groupItem) {
    var label = groupItem.getTitle();
    if(!label) {
        label = "(none)";
    }
    var tab = document.createElement("tab");
    tab.setAttribute("label", label);
    tab.setAttribute("oncommand", "objTabGroupBar.switchGroupTo(" + groupItem.id + ");");
	tab.setAttribute("draggable", "true");
    tabsContainer.appendChild(tab);
};

objTabGroupBar.switchGroupTo = function(groupId)
{
//    this.addTab("Fired switch group to " + groupId);
    let contentWindow = tabView.getContentWindow();
    var groupItems = contentWindow.GroupItems;
    var groupToActivate = groupItems.groupItem(groupId);
    let tabItem = groupToActivate.getActiveTab();
    if (! tabItem) {
        tabItem = groupToActivate.getChild(0);
    }
    this.window.gBrowser.selectedTab = tabItem.tab;//groupToActivate._children[0].tab;
};

objTabGroupBar.clearTabGroups = function()
{
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

window.addEventListener("load",
    function(e)
    {
//        window.removeEventListener("load", arguments.callee, false);
        objTabGroupBar.init(window/*.parent*/);
    },
false);
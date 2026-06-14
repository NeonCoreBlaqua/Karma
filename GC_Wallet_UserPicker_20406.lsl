// =====================================================
// G Coin Wallet User Picker
// Build 20406 Split Picker
//
// Companion for GC_Wallet_Core_20406_Split_Main.lsl.
// Keeps USERLIST parsing and user dialog buttons out of the main wallet core.
// =====================================================

string DISPLAY_TITLE = "G Coin Wallet";

integer LM_PICK = 3100;
integer BANK_CH = -777777;
integer USER_PAGE_SIZE = 6;
integer MAX_USERS = 24;
integer MAX_BUTTON_CHARS = 24;
integer PICK_TIMEOUT = 60;

string EXIT_BTN = "Exit";
string BACK_BTN = "Back";
string NEXT_BTN = "Next";

integer bankListen;
integer menuListen;
integer MENU_CH;

key activeUser = NULL_KEY;
string pickMode = "";
string pickTitle = "";
integer userPage = 0;

list userUUIDs;
list userNames;
list pageUUIDs;
list pageNames;

string accountNumber(key id)
{
    return llToUpper(llGetSubString((string)id, -6, -1));
}

integer startsWith(string value, string prefix)
{
    return llGetSubString(value, 0, llStringLength(prefix) - 1) == prefix;
}

integer validName(string name)
{
    if (name == "") return FALSE;
    if (name == "Resident") return FALSE;
    if (startsWith(name, "User-")) return FALSE;
    return TRUE;
}

string fallbackName(key id)
{
    string name = llGetDisplayName(id);
    if (validName(name)) return name;
    name = llKey2Name(id);
    if (validName(name)) return name;
    return "User-" + accountNumber(id);
}

string dialogUserName(string name, integer slot)
{
    string prefix = (string)slot + " ";
    integer maxName = MAX_BUTTON_CHARS - llStringLength(prefix);
    if (maxName < 8) maxName = 8;
    if (llStringLength(name) > maxName)
    {
        name = llGetSubString(name, 0, maxName - 1);
    }
    return prefix + name;
}

integer makeMenuChannel(key who)
{
    integer a = (integer)("0x" + llGetSubString((string)llGetKey(), 0, 7));
    integer b = (integer)("0x" + llGetSubString((string)who, 0, 7));
    integer c = (a ^ b ^ 20406) & 0x3FFFFFFF;
    if (c == 0) c = 20406;
    return -c;
}

setListen(key who)
{
    MENU_CH = makeMenuChannel(who);
    if (menuListen) llListenRemove(menuListen);
    menuListen = llListen(MENU_CH, "", who, "");
}

clearPicker()
{
    if (menuListen) llListenRemove(menuListen);
    menuListen = 0;
    activeUser = NULL_KEY;
    pickMode = "";
    pickTitle = "";
    userPage = 0;
    userUUIDs = [];
    userNames = [];
    pageUUIDs = [];
    pageNames = [];
    llSetTimerEvent(0.0);
}

showUserList()
{
    integer total = llGetListLength(userNames);
    integer start = userPage * USER_PAGE_SIZE;
    integer end = start + USER_PAGE_SIZE - 1;
    list buttons = [];
    string body = "";
    pageUUIDs = [];
    pageNames = [];

    if (start >= total && userPage > 0)
    {
        userPage = 0;
        start = 0;
        end = USER_PAGE_SIZE - 1;
    }

    integer i;
    integer slot;
    string label;
    string displayName;
    for (i = start; i <= end && i < total; ++i)
    {
        slot = i - start + 1;
        label = (string)slot;
        displayName = llList2String(userNames, i);
        body += (string)slot + ". " + displayName + "\n";
        buttons += [label];
        pageNames += [label];
        pageUUIDs += [llList2Key(userUUIDs, i)];
    }

    if (end + 1 < total) buttons += [NEXT_BTN];
    buttons += [BACK_BTN, EXIT_BTN];

    if (total == 0)
    {
        llDialog(activeUser, DISPLAY_TITLE + "\nNo valid account holders found.", [BACK_BTN, EXIT_BTN], MENU_CH);
        return;
    }

    integer pages = (total + USER_PAGE_SIZE - 1) / USER_PAGE_SIZE;
    llDialog(activeUser, DISPLAY_TITLE + "\n" + pickTitle + "\nChoose user:\n" + body + "Page " + (string)(userPage + 1) + " of " + (string)pages, buttons, MENU_CH);
}

handleOpen(string str)
{
    list p = llParseStringKeepNulls(str, ["|"], []);
    if (llList2String(p, 0) != "OPEN") return;

    activeUser = (key)llList2String(p, 1);
    pickMode = llList2String(p, 2);
    pickTitle = llList2String(p, 3);
    userPage = 0;
    userUUIDs = [];
    userNames = [];
    pageUUIDs = [];
    pageNames = [];

    setListen(activeUser);
    llSetTimerEvent((float)PICK_TIMEOUT);
}

handleUserList(string msg)
{
    if (activeUser == NULL_KEY) return;

    list p = llParseString2List(msg, ["|"], []);
    if (llGetListLength(p) < 5) return;
    if (llList2String(p, 0) != "RSP") return;
    if (llList2String(p, 1) != "USERLIST") return;
    if ((key)llList2String(p, 2) != activeUser) return;

    userUUIDs = [];
    userNames = [];
    userPage = 0;

    integer i;
    for (i = 4; i < llGetListLength(p); ++i)
    {
        if (llGetListLength(userUUIDs) >= MAX_USERS) jump done;

        string token = llList2String(p, i);
        if (startsWith(token, "ADMIN=")) jump cont;

        list row = llParseStringKeepNulls(token, [","], []);
        key id = (key)llList2String(row, 0);
        if (id == NULL_KEY || id == activeUser) jump cont;

        string name = "";
        if (llGetListLength(row) > 1) name = llBase64ToString(llList2String(row, 1));
        if (!validName(name)) name = fallbackName(id);

        userUUIDs += [id];
        userNames += [name];

@cont;
    }

@done;
    showUserList();
}

default
{
    state_entry()
    {
        if (bankListen) llListenRemove(bankListen);
        bankListen = llListen(BANK_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " user picker online | Build 20406");
    }

    on_rez(integer p)
    {
        llResetScript();
    }

    timer()
    {
        clearPicker();
    }

    link_message(integer sender, integer num, string str, key id)
    {
        if (num == LM_PICK) handleOpen(str);
    }

    listen(integer ch, string name, key id, string msg)
    {
        if (ch == BANK_CH)
        {
            handleUserList(msg);
            return;
        }

        if (ch != MENU_CH || id != activeUser) return;
        llSetTimerEvent((float)PICK_TIMEOUT);

        if (msg == EXIT_BTN || msg == BACK_BTN)
        {
            clearPicker();
            return;
        }
        if (msg == NEXT_BTN)
        {
            userPage++;
            showUserList();
            return;
        }

        integer idx = llListFindList(pageNames, [msg]);
        if (idx != -1)
        {
            key picked = llList2Key(pageUUIDs, idx);
            llMessageLinked(LINK_SET, LM_PICK, "PICKED|" + pickMode + "|" + (string)picked + "|" + msg, NULL_KEY);
            clearPicker();
        }
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
    }
}

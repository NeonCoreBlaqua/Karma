// =====================================================
// G Coin Wallet Core
// HUD Client talks to AtlasVault Core (SERVER)
// Build 20405 Product Core
// G Coin Core OS : 9869870-0412110914
// Project ID  : 9869872-0412110914
//
// RULES:
// - Land group required (must be wearing land group)
// - No chat spam (receipt ONLY after Finalize)
// - HUD screen/skin texture on FACE 4
//
// SERVER COMMS:
// - Sends REQ via BOTH:
//   (A) LINK_SET (if server Script is inside same linkset)
//   (B) Region channel (if server is a separate object listening)
//
// Region channel default is -777777 (common Blu systems channel).
// =====================================================

// ---------- IDs ----------
string BLU_CORE_ID      = "9869870-0412110914";
string PROJECT_ID       = "9869872-0412110914";

// ---------- Branding ----------
string DISPLAY_TITLE    = "G Coin Wallet";
string CURRENCY_MARK    = "GC";
string PRODUCT_ID       = "GCOIN_WALLET_HUD";
integer BUILD_NUMBER    = 20405;

// ---------- Security ----------
key BANK_ADMIN          = "0f6de87a-d007-46bb-85e5-fceccf6974ae";

// Access: land group required to open menu
integer ACCESS_GROUP_ONLY = TRUE;

// ---------- Dialog ----------
integer DIALOG_TIMEOUT  = 60;

string EXIT_BTN = "Exit";
string BACK_BTN = "Back";
string NEXT_BTN = "Next";
string HELP_BTN = "Help";
integer USER_PAGE_SIZE = 8;

// ---------- Server protocol ----------
integer LM_REQ = 1000;   // HUD -> Server
integer LM_RSP = 2000;   // Server -> HUD
integer LM_UI  = 3000;   // UI Controller -> Wallet Core

// Region channel server comms (optional / fallback)
integer BANK_CH = -777777;
integer bankListen = 0;
integer UPDATE_CH = -9869870;
integer updateListen = 0;
integer VERBOSE_UPDATES = FALSE;
integer AUTO_GET_UPDATES = TRUE;

// ---------- HUD Textures ----------
list HUD_TEXTURES = [
    "GC_Wallet_Skin_01",
    "GC_Wallet_Skin_02",
    "GC_Wallet_Skin_03",
    "GC_Wallet_Skin_04",
    "GC_Wallet_Skin_05",
    "GC_Wallet_Skin_06"
];

integer SCREEN_FACE = 4;
integer DIGIT_FACE  = 0;
integer TOUCH_FACE  = 2;
float DIGIT_ROTATION = 4.712389; // 270 degrees
string DIGIT_LOGO_TEXTURE = "GC Logo";
string currentSkin = "Default";

// UI movement/min-max is handled by GC_Wallet_UI_Controller.

// ---------- Runtime ----------
key     hudOwner    = NULL_KEY;
key     activeUser  = NULL_KEY;

integer MENU_CH = 0;
integer hListen = 0;

float checkingBal = 0.0;
float savingsBal  = 0.0;
integer lastIsAdmin = FALSE;

list userUUIDs;
list userNames;
list pageUUIDs;
list pageNames;
integer userPage = 0;
string userListTitle = "";

string uiScreen = "MAIN";     // MAIN, XFER_DIR, SETTINGS, ADDMODE, TEX
string pendingPick = "";      // SEND_PICK, XFER_USER_PICK, REQ_PICK, ADMIN_SEND_PICK, ADMIN_ADD_PICK

// Amount context
string amtTitle = "";
string queuedCmd = "";
string queuedExtra = "";
float  queuedAmt = 0.0;
key    queuedTarget = NULL_KEY;

// Receipt context
integer receiptPending = FALSE;
string  lastAction = "";
string  lastSummary = "";
float   lastAmt = 0.0;
key     lastTarget = NULL_KEY;


// -------------------------------
// Utils
// -------------------------------
string niceName(key id)
{
    string dn = llGetDisplayName(id);
    if (dn == "") dn = llKey2Name(id);
    if (dn == "") dn = "Resident";
    return dn;
}

string accountNumber(key id){ return llToUpper(llGetSubString((string)id, -6, -1)); }
string shortKey(key id){ return accountNumber(id); }

string dialogUserName(string name, key id)
{
    string suffix = " " + accountNumber(id);
    integer maxName = 22 - llStringLength(suffix);
    if (maxName < 8) maxName = 8;
    if (llStringLength(name) > maxName)
    {
        name = llGetSubString(name, 0, maxName - 1);
    }
    return name + suffix;
}

integer hasAccess(key id)
{
    if (!ACCESS_GROUP_ONLY) return TRUE;
    return llSameGroup(id);
}

integer makeMenuChannel(key who)
{
    integer a = (integer)("0x" + llGetSubString((string)llGetKey(), 0, 7));
    integer b = (integer)("0x" + llGetSubString((string)who, 0, 7));
    integer c = (a ^ b) & 0x3FFFFFFF;
    if (c == 0) c = 777777;
    return -c;
}

setListen(key who)
{
    MENU_CH = makeMenuChannel(who);
    if (hListen) llListenRemove(hListen);
    hListen = llListen(MENU_CH, "", who, "");
}

float round2(float v){ return (float)llRound(v); }

string addCommas(integer n)
{
    string sign = "";
    if (n < 0)
    {
        sign = "-";
        n = -n;
    }

    string s = (string)n;
    string out = "";

    while (llStringLength(s) > 3)
    {
        string tail = llGetSubString(s, -3, -1);
        out = "," + tail + out;
        s = llDeleteSubString(s, -3, -1);
    }

    return sign + s + out;
}

string formatMoney(float v)
{
    return CURRENCY_MARK + " " + addCommas(llRound(v));
}

integer findLinkByName(string linkName)
{
    integer i;
    integer count = llGetNumberOfPrims();
    for (i = 1; i <= count; ++i)
    {
        if (llGetLinkName(i) == linkName) return i;
    }
    return 0;
}

string padLeft(string s, integer width)
{
    while (llStringLength(s) < width) s = " " + s;
    if (llStringLength(s) > width) s = llGetSubString(s, -width, -1);
    return s;
}

string digitTextureFor(string ch)
{
    if (ch == " ") return "GC_DIGIT_BLANK";
    if (ch == ",") return "GC_DIGIT_COMMA";
    return "GC_DIGIT_" + ch;
}

updateBalanceDisplay()
{
    string value = padLeft(addCommas(llRound(checkingBal)), 9);
    integer i;
    for (i = 0; i < 10; ++i)
    {
        string linkName = "DIGIT_";
        if (i + 1 < 10) linkName += "0";
        linkName += (string)(i + 1);

        integer link = findLinkByName(linkName);
        if (link)
        {
            string tex = "";
            if (i == 0)
            {
                tex = DIGIT_LOGO_TEXTURE;
                if (llGetInventoryType(tex) != INVENTORY_TEXTURE) tex = "GC_DIGIT_BLANK";
            }
            else
            {
                string ch = llGetSubString(value, i - 1, i - 1);
                tex = digitTextureFor(ch);
            }

            if (llGetInventoryType(tex) == INVENTORY_TEXTURE)
                llSetLinkPrimitiveParamsFast(link, [
                    PRIM_TEXTURE, DIGIT_FACE, tex, <1.0, 1.0, 0.0>, <0.0, 0.0, 0.0>, DIGIT_ROTATION
                ]);
        }
    }
}

checkForUpdates()
{
    llRegionSay(UPDATE_CH, "UPDATE_CHECK|" + PRODUCT_ID + "|" + (string)BUILD_NUMBER + "|" + (string)llGetKey());
}

handleUpdateReply(string msg)
{
    list p = llParseString2List(msg, ["|"], []);
    if (llGetListLength(p) < 3) return;

    string type = llList2String(p, 0);
    string product = llList2String(p, 1);
    if (product != PRODUCT_ID) return;

    if (type == "UPDATE_AVAILABLE")
    {
        llOwnerSay(DISPLAY_TITLE + " update available: Build " + llList2String(p, 2) + " - " + llList2String(p, 3));
        if (AUTO_GET_UPDATES)
            llRegionSay(UPDATE_CH, "UPDATE_GET|" + PRODUCT_ID + "|" + (string)BUILD_NUMBER + "|" + (string)llGetOwner());
        return;
    }

    if (type == "UPDATE_SENT")
    {
        llOwnerSay(DISPLAY_TITLE + " update sent: " + llList2String(p, 3));
        return;
    }

    if (type == "UPDATE_MANUAL")
    {
        llOwnerSay(DISPLAY_TITLE + " update available. " + llList2String(p, 4));
        return;
    }

    if (type == "UPDATE_CURRENT")
    {
        if (VERBOSE_UPDATES)
            llOwnerSay(DISPLAY_TITLE + " is up to date. Build " + llList2String(p, 2));
        return;
    }

    if (type == "UPDATE_UNKNOWN" || type == "UPDATE_MISSING" || type == "UPDATE_DENIED")
    {
        llOwnerSay(DISPLAY_TITLE + " update check warning: " + msg);
        return;
    }
}

string headerLine()
{
    string who = niceName(activeUser);
    string adminTag = "";
    if (lastIsAdmin) adminTag = " (Admin)";

    return " " + DISPLAY_TITLE + "\n"
         + "User: " + who + adminTag + "\n"
         + "C: " + formatMoney(checkingBal) + " | S: " + formatMoney(savingsBal) + "\n"
         + "-------------------\n";
}

cleanup(integer timedOut)
{
    if (hListen) llListenRemove(hListen);
    hListen = 0;

    activeUser = NULL_KEY;

    userUUIDs = [];
    userNames = [];
    pageUUIDs = [];
    pageNames = [];
    userPage = 0;
    userListTitle = "";

    uiScreen = "MAIN";
    pendingPick = "";

    amtTitle = "";
    queuedCmd = "";
    queuedExtra = "";
    queuedAmt = 0.0;
    queuedTarget = NULL_KEY;

    receiptPending = FALSE;
    lastAction = "";
    lastSummary = "";
    lastAmt = 0.0;
    lastTarget = NULL_KEY;

    llSetTimerEvent(0.0);
}

// -------------------------------
// UI
// -------------------------------
showHelp()
{
    string help =
        "G Coin Wallet Help\n"
        + "Balance: shows Checking/Savings\n"
        + "Send: send to another user (to their Checking)\n"
        + "Transfer: C>S, S>C, or Checking > User\n"
        + "Request: sends a request message (no auto-withdraw)\n"
        + "Texture: change HUD skin\n"
        + "Finalize appears AFTER amount selection\n";

    llDialog(activeUser, headerLine() + help, [BACK_BTN, EXIT_BTN], MENU_CH);
}

showProcessing(string label)
{
    // We still keep HELP/EXIT here, but we do NOT trap the user in this Screen anymore
    llDialog(activeUser, headerLine() + "Processing...\n" + label, [HELP_BTN, EXIT_BTN], MENU_CH);
}

showMain()
{
    uiScreen = "MAIN";
    pendingPick = "";

    amtTitle = "";
    queuedCmd = "";
    queuedExtra = "";
    queuedAmt = 0.0;
    queuedTarget = NULL_KEY;

    list buttons = ["Balance","Send","Transfer","Request","Texture"];
    if (lastIsAdmin) buttons += ["Settings"];
    buttons += [HELP_BTN, EXIT_BTN];

    llDialog(activeUser, headerLine() + "Choose an option.", buttons, MENU_CH);
}

showTransferDir()
{
    uiScreen = "XFER_DIR";
    pendingPick = "";

    llDialog(activeUser,
        headerLine() + "Transfer options:\nC>S | S>C | C>User",
        ["C>S","S>C","C>User",BACK_BTN,HELP_BTN,EXIT_BTN],
        MENU_CH);
}

showSettings()
{
    uiScreen = "SETTINGS";
    pendingPick = "";

    llDialog(activeUser,
        headerLine() + "Settings (Admin):",
        ["Add Funds","Admin Send","Withdraw Invis","Withdraw Sav",BACK_BTN,HELP_BTN,EXIT_BTN],
        MENU_CH);
}

showAddFundsMode()
{
    uiScreen = "ADDMODE";
    pendingPick = "";

    llDialog(activeUser,
        headerLine() + "Add Funds:\nChoose target",
        ["To Self","Choose User",BACK_BTN,HELP_BTN,EXIT_BTN],
        MENU_CH);
}

showTextureMenu()
{
    uiScreen = "TEX";

    list buttons = [];
    integer i;
    for (i = 0; i < llGetListLength(HUD_TEXTURES); ++i)
    {
        string tex = llList2String(HUD_TEXTURES, i);
        if (llGetInventoryType(tex) == INVENTORY_TEXTURE)
            buttons += ["Skin " + (string)(i + 1)];
    }

    if (llGetListLength(buttons) == 0)
        buttons = ["Refresh"];

    buttons += [BACK_BTN, HELP_BTN, EXIT_BTN];

    llDialog(activeUser,
        headerLine()
        + "Wallet skins\n"
        + "Current: " + currentSkin + "\n"
        + "Choose:",
        buttons,
        MENU_CH);
}

applySkinByButton(string btn)
{
    if (btn == "Refresh")
    {
        showTextureMenu();
        return;
    }

    integer idx = -1;
    if (llGetSubString(btn, 0, 4) == "Skin ")
        idx = (integer)llGetSubString(btn, 5, -1) - 1;

    if (idx < 0 || idx >= llGetListLength(HUD_TEXTURES)) return;

    string tex = llList2String(HUD_TEXTURES, idx);

    if (tex == "") return;

    currentSkin = tex;

    if (llGetInventoryType(tex) == INVENTORY_TEXTURE)
    {
        llSetTexture(tex, SCREEN_FACE);
        showTextureMenu();
        return;
    }

    llDialog(activeUser, headerLine() + "Missing texture in HUD inventory:\n" + tex,
        [BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
}

list presetButtons()
{
    return ["$10","$20","$50","$100","$1K","$10K","More",BACK_BTN,HELP_BTN,EXIT_BTN];
}

showAmountPicker(string title, string cmd, string extra, key target)
{
    amtTitle = title;
    queuedCmd = cmd;
    queuedExtra = extra;
    queuedTarget = target;
    queuedAmt = 0.0;

    string who = "";
    if (queuedTarget != NULL_KEY) who = "\nTarget: " + niceName(queuedTarget);

    llDialog(activeUser,
        headerLine()
        + amtTitle + who + "\n"
        + "Pick an amount or press 'More'.",
        presetButtons(),
        MENU_CH);
}

confirmFinalize()
{
    string who = "";
    if (queuedTarget != NULL_KEY) who = "\nTarget: " + niceName(queuedTarget);

    llDialog(activeUser,
        headerLine()
        + amtTitle + who + "\n"
        + "Selected: " + formatMoney(queuedAmt) + "\n"
        + "Press Finalize to apply.",
        ["Finalize", BACK_BTN, HELP_BTN, EXIT_BTN],
        MENU_CH);
}

showUserList(string title)
{
    integer total = llGetListLength(userNames);
    integer start = userPage * USER_PAGE_SIZE;
    integer end = start + USER_PAGE_SIZE - 1;
    list b = [];
    integer i;
    integer pageCount;

    userListTitle = title;
    pageUUIDs = [];
    pageNames = [];

    if (start < 0) start = 0;
    if (start >= total && userPage > 0)
    {
        userPage--;
        start = userPage * USER_PAGE_SIZE;
        end = start + USER_PAGE_SIZE - 1;
    }

    for (i = start; i <= end && i < total; ++i)
    {
        string nm = llList2String(userNames, i);
        b += [nm];
        pageNames += [nm];
        pageUUIDs += [llList2Key(userUUIDs, i)];
    }

    if (end + 1 < total) b += [NEXT_BTN];
    b += [BACK_BTN, EXIT_BTN];

    pageCount = (total + USER_PAGE_SIZE - 1) / USER_PAGE_SIZE;
    if (pageCount < 1) pageCount = 1;

    if (total <= 0)
    {
        llDialog(activeUser, headerLine() + title + "\nNo valid account holders found.", [BACK_BTN, EXIT_BTN], MENU_CH);
        return;
    }

    llDialog(activeUser, headerLine() + title + "\nChoose a user:\nPage " + (string)(userPage + 1) + " of " + (string)pageCount, b, MENU_CH);
}

integer startsWith(string s, string p)
{
    return (llGetSubString(s,0,llStringLength(p)-1) == p);
}

// -------------------------------
// Receipt (chat ONLY after Finalize success)
// -------------------------------
string padRight(string s, integer w)
{
    integer n = llStringLength(s);
    while (n < w)
    {
        s += " ";
        n = llStringLength(s);
    }
    if (n > w) s = llGetSubString(s, 0, w - 1);
    return s;
}

string boxLine(string label, string value)
{
    label = padRight(label, 22);
    return "| " + label + ": " + value;
}

printReceipt()
{
    string action = lastAction;
    if (action == "") action = "Transaction";

    string line = action + " complete";
    if (lastAction == "Request") line = "Request sent";

    string out = DISPLAY_TITLE + "\n"
        + line + ": " + formatMoney(lastAmt) + "\n";

    if (lastTarget != NULL_KEY)
        out += "Target: " + niceName(lastTarget) + "\n";

    out += "Checking: " + formatMoney(checkingBal) + "\n"
        + "Savings: " + formatMoney(savingsBal);

    llRegionSayTo(activeUser, 0, out);
}

// -------------------------------
// Server request helper
// REQ|CMD|USER|UIKEY|AMT|TARGET|EXTRA(optional)
// -------------------------------
sendToServer(string msg)
{
    // A) link-message (works if server is inside same linkset)
    llMessageLinked(LINK_SET, LM_REQ, msg, activeUser);

    // B) region channel (works if server is separate object listening)
    llRegionSay(BANK_CH, msg);
}

req(string cmd, float amt, key target, string extra)
{
    string msg = "REQ|" + cmd + "|" + (string)activeUser + "|" + (string)llGetKey() + "|" + (string)amt;
    msg += "|" + (string)target;
    if (extra != "") msg += "|" + extra;

    sendToServer(msg);
}

requestBalance(){ req("BALANCE", 0.0, NULL_KEY, ""); }
requestUserList(){ req("USERLIST", 0.0, NULL_KEY, ""); }

// -------------------------------
// Handle server replies
// -------------------------------
handleServer(string str)
{
    list p = llParseString2List(str, ["|"], []);
    if (llGetListLength(p) < 5) return;
    if (llList2String(p,0) != "RSP") return;

    string type = llList2String(p,1);
    key user = (key)llList2String(p,2);
    key ui   = (key)llList2String(p,3);

    if (activeUser == NULL_KEY) return;
    if (user != activeUser) return;
    if (ui != llGetKey()) return;

    if (type == "BAL")
    {
        checkingBal = (float)llList2String(p,4);
        savingsBal  = (float)llList2String(p,5);
        updateBalanceDisplay();

        integer i;
        lastIsAdmin = FALSE;
        for (i = 6; i < llGetListLength(p); ++i)
            if (llList2String(p,i) == "ADMIN=1") lastIsAdmin = TRUE;

        if (receiptPending)
        {
            receiptPending = FALSE;
            printReceipt();
        }

        showMain();
        return;
    }

    if (type == "USERLIST")
    {
        integer i2;
        string token;
        list row;
        key k;
        string nm;

        userUUIDs = [];
        userNames = [];
        pageUUIDs = [];
        pageNames = [];
        userPage = 0;

        for (i2 = 4; i2 < llGetListLength(p); ++i2)
        {
            token = llList2String(p,i2);
            if (startsWith(token,"ADMIN=")) jump cont2;

            row = llParseString2List(token, [","], []);
            k = NULL_KEY;
            nm = "";

            if (llGetListLength(row) >= 2)
            {
                k = (key)llList2String(row, 0);
                nm = llBase64ToString(llList2String(row, 1));
            }
            else
            {
                k = (key)token;
                nm = llGetDisplayName(k);
            }

            if (k == NULL_KEY) jump cont2;
            if (k == activeUser || k == hudOwner) jump cont2;
            if (nm == "") jump cont2;
            if (nm == "Resident") jump cont2;
            if (startsWith(nm, "User-")) jump cont2;

            userUUIDs += [k];
            userNames += [dialogUserName(nm, k)];

@cont2;
        }

        if (pendingPick == "SEND_PICK")       { showUserList("Send"); return; }
        if (pendingPick == "XFER_USER_PICK")  { showUserList("Transfer (Checking > User)"); return; }
        if (pendingPick == "REQ_PICK")        { showUserList("Request"); return; }
        if (pendingPick == "ADMIN_SEND_PICK") { showUserList("Admin Send"); return; }
        if (pendingPick == "ADMIN_ADD_PICK")  { showUserList("Add Funds"); return; }

        showMain();
        return;
    }

    if (type == "OK")
    {
        receiptPending = TRUE;
        requestBalance();
        return;
    }

    if (type == "FAIL")
    {
        string reason = llList2String(p,4);

        pendingPick = "";
        amtTitle = "";
        queuedCmd = "";
        queuedExtra = "";
        queuedAmt = 0.0;
        queuedTarget = NULL_KEY;
        receiptPending = FALSE;

        llDialog(activeUser, headerLine() + reason, [BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
        return;
    }
}

// -------------------------------
// default
// -------------------------------
processUIAction(string linkName, key id)
{
    if (id != llGetOwner()) return;

    if (!hasAccess(id))
    {
        setListen(id);
        llSetTimerEvent((float)DIALOG_TIMEOUT);
        llDialog(id, "Land group required.\nWear the land group tag and touch again.", [EXIT_BTN], MENU_CH);
        return;
    }

    activeUser = id;
    setListen(activeUser);
    llSetTimerEvent((float)DIALOG_TIMEOUT);

    pendingPick = "";
    amtTitle = "";
    queuedCmd = "";
    queuedExtra = "";
    queuedAmt = 0.0;
    queuedTarget = NULL_KEY;

    receiptPending = FALSE;
    lastAction = "";
    lastSummary = "";
    lastAmt = 0.0;
    lastTarget = NULL_KEY;

    if (linkName == "UI_OPEN")
    {
        showMain();
        requestBalance();
        return;
    }

    if (linkName == "BTN_HELP") { showHelp(); return; }
    if (linkName == "BTN_EXIT") { cleanup(FALSE); return; }
    if (linkName == "BTN_BALANCE") { requestBalance(); showMain(); return; }
    if (linkName == "BTN_TEXTURE") { showTextureMenu(); return; }
    if (linkName == "BTN_TRANSFER") { showTransferDir(); return; }

    if (linkName == "BTN_REQUEST")
    {
        pendingPick = "REQ_PICK";
        requestUserList();
        showProcessing("Loading users...");
        return;
    }

    if (linkName == "BTN_SEND")
    {
        pendingPick = "SEND_PICK";
        requestUserList();
        showProcessing("Loading users...");
        return;
    }

    if (linkName == "BTN_SETTINGS")
    {
        if (!lastIsAdmin) { showMain(); return; }
        showSettings();
        return;
    }

    showMain();
    requestBalance();
}

default
{
    state_entry()
    {
        hudOwner = llGetOwner();

        // Always listen for region replies from server (if used)
        if (bankListen) llListenRemove(bankListen);
        bankListen = llListen(BANK_CH, "", NULL_KEY, "");

        if (updateListen) llListenRemove(updateListen);
        updateListen = llListen(UPDATE_CH, "", NULL_KEY, "");
        checkForUpdates();
    }

    on_rez(integer p){ llResetScript(); }

    attach(key id)
    {
        if (id) // attached
        {
            hudOwner = llGetOwner();
            cleanup(FALSE);
        }
        else // detached
        {
            cleanup(FALSE);
        }
    }

    timer()
    {
        cleanup(TRUE);
    }

    touch_start(integer total)
    {
        return;
    }

    link_message(integer sender_num, integer num, string str, key id)
    {
        if (num == LM_RSP) handleServer(str);
        if (num == LM_UI) processUIAction(str, id);
    }

    listen(integer ch, string nm, key id, string msg)
    {
        // Region server replies
        if (ch == BANK_CH)
        {
            handleServer(msg);
            return;
        }

        if (ch == UPDATE_CH)
        {
            handleUpdateReply(msg);
            return;
        }

        // Menu replies
        if (activeUser == NULL_KEY) return;
        if (ch != MENU_CH) return;
        if (id != activeUser) return;

        llSetTimerEvent((float)DIALOG_TIMEOUT);

        if (msg == EXIT_BTN) { cleanup(FALSE); return; }
        if (msg == HELP_BTN) { showHelp(); return; }

        if (msg == NEXT_BTN && pendingPick != "")
        {
            userPage++;
            showUserList(userListTitle);
            return;
        }

        if (msg == BACK_BTN)
        {
            if (pendingPick != "" && userPage > 0)
            {
                userPage--;
                showUserList(userListTitle);
                return;
            }
            pendingPick = "";
            showMain();
            return;
        }

        // MAIN
        if (msg == "Balance")  { requestBalance(); showMain(); return; }

        if (msg == "Send")
        {
            pendingPick = "SEND_PICK";
            requestUserList();
            showProcessing("Loading users...");
            return;
        }

        if (msg == "Transfer") { showTransferDir(); return; }

        if (msg == "Request")
        {
            pendingPick = "REQ_PICK";
            requestUserList();
            showProcessing("Loading users...");
            return;
        }

        if (msg == "Texture")
        {
            showTextureMenu();
            return;
        }

        if (msg == "Settings")
        {
            if (!lastIsAdmin) { showMain(); return; }
            showSettings();
            return;
        }

        // Texture menu
        if (uiScreen == "TEX")
        {
            if (msg == "Refresh" || llGetSubString(msg, 0, 4) == "Skin ")
            {
                applySkinByButton(msg);
                return;
            }
        }

        // Transfer direction
        if (msg == "C>S")
        {
            lastAction = "Transfer";
            lastSummary = "Transfer from Checking to Savings";
            lastTarget = NULL_KEY;

            showAmountPicker("Transfer (Checking > Savings)", "XFER", "C>S", NULL_KEY);
            return;
        }

        if (msg == "S>C")
        {
            lastAction = "Transfer";
            lastSummary = "Transfer from Savings to Checking";
            lastTarget = NULL_KEY;

            showAmountPicker("Transfer (Savings > Checking)", "XFER", "S>C", NULL_KEY);
            return;
        }

        if (msg == "C>User")
        {
            pendingPick = "XFER_USER_PICK";
            requestUserList();
            showProcessing("Loading users...");
            return;
        }

        // Settings
        if (uiScreen == "SETTINGS")
        {
            if (!lastIsAdmin) { showMain(); return; }

            if (msg == "Add Funds") { showAddFundsMode(); return; }

            if (msg == "Admin Send")
            {
                pendingPick = "ADMIN_SEND_PICK";
                requestUserList();
                showProcessing("Loading users...");
                return;
            }

            if (msg == "Withdraw Invis")
            {
                lastAction = "Withdraw";
                lastSummary = "Admin withdraw from Invisible account";
                lastTarget = NULL_KEY;

                showAmountPicker("Withdraw (Invisible)", "ADMIN_WD_INV", "", NULL_KEY);
                return;
            }

            if (msg == "Withdraw Sav")
            {
                lastAction = "Withdraw";
                lastSummary = "Admin withdraw from Savings";
                lastTarget = NULL_KEY;

                showAmountPicker("Withdraw (Savings)", "ADMIN_WD_SAV", "", NULL_KEY);
                return;
            }
        }

        if (uiScreen == "ADDMODE")
        {
            if (msg == "To Self")
            {
                lastAction = "Deposit";
                lastSummary = "Admin added funds to self";
                lastTarget = NULL_KEY;

                showAmountPicker("Add Funds (to self)", "ADDFUNDS", "", NULL_KEY);
                return;
            }

            if (msg == "Choose User")
            {
                pendingPick = "ADMIN_ADD_PICK";
                requestUserList();
                showProcessing("Loading users...");
                return;
            }
        }

        // Pick user flows
        if (pendingPick != "")
        {
            integer idx = llListFindList(pageNames, [msg]);
            if (idx != -1)
            {
                key k = llList2Key(pageUUIDs, idx);
                if (k == activeUser || k == hudOwner)
                {
                    llDialog(activeUser, headerLine() + "You cannot send money to yourself.", [BACK_BTN, EXIT_BTN], MENU_CH);
                    return;
                }

                if (pendingPick == "SEND_PICK")
                {
                    pendingPick = "";

                    lastAction = "Send";
                    lastSummary = "User sent funds to another user (to Checking)";
                    lastTarget = k;

                    showAmountPicker("Send (to user checking)", "SEND", "", k);
                    return;
                }

                if (pendingPick == "XFER_USER_PICK")
                {
                    pendingPick = "";

                    lastAction = "Transfer";
                    lastSummary = "Transfer from Checking to another user (to Checking)";
                    lastTarget = k;

                    showAmountPicker("Transfer (Checking > User)", "XFER", "C>U", k);
                    return;
                }

                if (pendingPick == "REQ_PICK")
                {
                    pendingPick = "";

                    lastAction = "Request";
                    lastSummary = "Requested funds from a user (message only)";
                    lastTarget = k;

                    showAmountPicker("Request (message user)", "REQUEST_LOCAL", "", k);
                    return;
                }

                if (pendingPick == "ADMIN_SEND_PICK")
                {
                    pendingPick = "";

                    lastAction = "Send";
                    lastSummary = "Admin sent funds to a user (mint to Checking)";
                    lastTarget = k;

                    showAmountPicker("Admin Send (mint)", "ADMIN_SEND", "", k);
                    return;
                }

                if (pendingPick == "ADMIN_ADD_PICK")
                {
                    pendingPick = "";

                    lastAction = "Deposit";
                    lastSummary = "Admin added funds to a user (mint to Checking)";
                    lastTarget = k;

                    showAmountPicker("Add Funds (to user)", "ADDFUNDS", "", k);
                    return;
                }
            }
        }

        // Amount picking
        if (msg == "More")
        {
            llTextBox(activeUser, "Enter amount (numbers only):", MENU_CH);
            return;
        }

        if (msg == "$10")  { queuedAmt = 10.0;    confirmFinalize(); return; }
        if (msg == "$20")  { queuedAmt = 20.0;    confirmFinalize(); return; }
        if (msg == "$50")  { queuedAmt = 50.0;    confirmFinalize(); return; }
        if (msg == "$100") { queuedAmt = 100.0;   confirmFinalize(); return; }
        if (msg == "$1K")  { queuedAmt = 1000.0;  confirmFinalize(); return; }
        if (msg == "$10K") { queuedAmt = 10000.0; confirmFinalize(); return; }

        // TextBox numeric input
        {
            float tryAmt = round2((float)msg);
            if (tryAmt > 0.0)
            {
                queuedAmt = tryAmt;
                confirmFinalize();
                return;
            }
        }

        if (msg == "Finalize")
        {
            if (queuedCmd == "" || queuedAmt <= 0.0)
            {
                llDialog(activeUser, headerLine() + "Select an amount first.", [BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
                return;
            }

            lastAmt = queuedAmt;

            // Local request (no server money move)
            if (queuedCmd == "REQUEST_LOCAL")
            {
                if (queuedTarget != NULL_KEY)
                {
                    string m = DISPLAY_TITLE + ": " + niceName(activeUser) + " is requesting " + formatMoney(queuedAmt) + " from you.";
                    llRegionSayTo(queuedTarget, 0, m);
                    llInstantMessage(queuedTarget, m);
                }

                // receipt only here
                printReceipt();

                queuedAmt = 0.0;
                queuedCmd = "";
                queuedExtra = "";
                queuedTarget = NULL_KEY;

                showMain();
                return;
            }

            // Server transaction
            showProcessing("Finalizing...");
            req(queuedCmd, queuedAmt, queuedTarget, queuedExtra);

            queuedAmt = 0.0;
            return;
        }

        showMain();
    }
}





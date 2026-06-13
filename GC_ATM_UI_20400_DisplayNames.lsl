// =====================================================
// G Coin System
// ATM Machine - UI + HUD Dispenser
// Build 20400 Product Core
// Blu Core OS: 9869870-0412110914
// Project ID : 9869872-0412110914
// =====================================================

string DISPLAY_TITLE   = "G Coin ATM";
string HUD_ITEM_NAME   = "G Coin Wallet";
string CURRENCY_MARK   = "GC";
string PRODUCT_ID      = "GCOIN_ATM";
integer BUILD_NUMBER   = 20400;

integer ACCESS_GROUP_ONLY = TRUE;
integer DIALOG_TIMEOUT    = 60;

string EXIT_BTN = "Exit";
string BACK_BTN = "Back";
string HELP_BTN = "Help";

integer LM_REQ = 1000;
integer LM_RSP = 2000;

// Region channel fallback for a separate AtlasVault Core object.
integer BANK_CH = -777777;
integer bankListen = 0;
integer UPDATE_CH = -9869870;
integer updateListen = 0;
integer VERBOSE_UPDATES = FALSE;
integer AUTO_GET_UPDATES = TRUE;

integer STATE_OFFLINE = 0;
integer STATE_BOOTING = 1;
integer STATE_ONLINE  = 2;

integer atmState = 0;
integer bootLeft = 0;

key     activeUser = NULL_KEY;
integer MENU_CH = 0;
integer hListen = 0;

float checkingBal = 0.0;
float savingsBal  = 0.0;
integer lastIsAdmin = FALSE;

list userUUIDs;
list userNames;

string uiScreen = "MAIN";     // MAIN, DEPO_DIR, XFER_DIR, SETTINGS
string pendingPick = "";      // SEND_PICK, XFER_USER_PICK, ADMIN_SEND_PICK, ADMIN_ADD_PICK

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

string niceName(key id)
{
    string dn = llGetDisplayName(id);
    if (dn == "") dn = llKey2Name(id);
    if (dn == "") dn = "Resident";
    return dn;
}

string accountNumber(key id){ return llToUpper(llGetSubString((string)id, -6, -1)); }
string shortKey(key id){ return accountNumber(id); }

integer validName(string name)
{
    if (name == "") return FALSE;
    if (name == "Resident") return FALSE;
    if (llGetSubString(name, 0, 4) == "User-") return FALSE;
    return TRUE;
}

string bestName(key id, string serverName)
{
    if (validName(serverName)) return serverName;

    string dn = llGetDisplayName(id);
    if (validName(dn)) return dn;

    dn = llKey2Name(id);
    if (validName(dn)) return dn;

    return "User-" + accountNumber(id);
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
         + "Tap '" + HELP_BTN + "' for help.\n"
         + "-------------------\n";
}

cleanup(integer timedOut)
{
    if (hListen) llListenRemove(hListen);
    hListen = 0;

    if (timedOut && activeUser != NULL_KEY)
        llRegionSayTo(activeUser, 0, " Menu timed out. Touch the ATM again.");

    activeUser = NULL_KEY;

    userUUIDs = [];
    userNames = [];

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

    atmState = STATE_OFFLINE;
    llSetTimerEvent(0.0);
}

showBooting()
{
    llDialog(activeUser,
        " " + DISPLAY_TITLE + "\nBooting...\nWait: " + (string)bootLeft + "s",
        [EXIT_BTN],
        MENU_CH);
}

showProcessing(string label)
{
    llDialog(activeUser, headerLine() + "Processing...\n" + label, [HELP_BTN, EXIT_BTN], MENU_CH);
}

sendToServer(string msg)
{
    // Same-linkset server path.
    llMessageLinked(LINK_SET, LM_REQ, msg, activeUser);

    // Separate server object path.
    llRegionSay(BANK_CH, msg);
}

// Always send target slot so EXTRA never becomes TARGET
req(string cmd, float amt, key target, string extra)
{
    string msg = "REQ|" + cmd + "|" + (string)activeUser + "|" + (string)llGetKey() + "|" + (string)amt;
    msg += "|" + (string)target;
    if (extra != "") msg += "|" + extra;
    sendToServer(msg);
}

requestBalance(){ req("BALANCE", 0.0, NULL_KEY, ""); }
requestUserList(){ req("USERLIST", 0.0, NULL_KEY, ""); }
requestSignup(){ req("SIGNUP", 0.0, NULL_KEY, ""); }

giveHUD(key id)
{
    if (llGetInventoryType(HUD_ITEM_NAME) != INVENTORY_OBJECT)
    {
        llDialog(id, "Missing HUD item:\n" + HUD_ITEM_NAME, [HELP_BTN, EXIT_BTN], MENU_CH);
        return;
    }
    llGiveInventory(id, HUD_ITEM_NAME);
}

showHelp()
{
    string help =
        "G Coin ATM Help\n"
        + "Balance: shows Checking/Savings\n"
        + "Deposit: move money between your accounts (C>S or S>C)\n"
        + "Send: send to another user (goes to their Checking)\n"
        + "Transfer: C>S, S>C, or Checking > User (no Savings > User)\n"
        + "Withdraw: Savings only\n"
        + "Hud: gives G Coin Wallet + signup bonus\n"
        + "More: type custom amount\n"
        + "After you pick an amount, Finalize pops up\n"
        + "Back/Exit: navigation\n";

    if (lastIsAdmin)
        help += "Settings (Admin): Add Funds, Admin Send, Withdraw Invis, Withdraw Sav\n";

    llRegionSayTo(activeUser, 0, help);
    llDialog(activeUser, headerLine() + "Help sent to chat.", [BACK_BTN, EXIT_BTN], MENU_CH);
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

    list buttons = ["Balance","Deposit","Send","Transfer","Withdraw","Hud"];
    if (lastIsAdmin) buttons += ["Settings"];
    buttons += [HELP_BTN, EXIT_BTN];

    llDialog(activeUser, headerLine() + "Choose an option.", buttons, MENU_CH);
}

showDepositDir()
{
    uiScreen = "DEPO_DIR";
    pendingPick = "";

    llDialog(activeUser,
        headerLine() + "Deposit: move money between your accounts.\nPick direction.",
        ["C>S","S>C",BACK_BTN,HELP_BTN,EXIT_BTN],
        MENU_CH);
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

// Presets WITHOUT Finalize
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

showSendList(string title)
{
    integer max = llGetListLength(userNames);
    if (max > 9) max = 9;

    list b = [];
    integer i;
    for (i = 0; i < max; ++i) b += [llList2String(userNames,i)];
    b += [BACK_BTN, HELP_BTN, EXIT_BTN];

    llDialog(activeUser, headerLine() + title + "\nChoose a user:", b, MENU_CH);
}

integer startsWith(string s, string p)
{
    return (llGetSubString(s,0,llStringLength(p)-1) == p);
}

// Box receipt helpers
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

    string out = DISPLAY_TITLE + "\n"
        + line + ": " + formatMoney(lastAmt) + "\n";

    if (lastTarget != NULL_KEY)
        out += "Target: " + niceName(lastTarget) + "\n";

    out += "Checking: " + formatMoney(checkingBal) + "\n"
        + "Savings: " + formatMoney(savingsBal);

    llRegionSayTo(activeUser, 0, out);
}

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
        userUUIDs = [];
        userNames = [];

        integer i2;
        for (i2 = 4; i2 < llGetListLength(p); ++i2)
        {
            string token = llList2String(p,i2);
            if (startsWith(token,"ADMIN=")) jump cont2;

            list row = llParseStringKeepNulls(token, [","], []);
            key k = (key)llList2String(row, 0);
            if (k == NULL_KEY) jump cont2;

            string serverName = "";
            if (llGetListLength(row) > 1)
            {
                serverName = llBase64ToString(llList2String(row, 1));
            }

            userUUIDs += [k];
            userNames += [bestName(k, serverName)];

@cont2;
        }

        if (pendingPick == "SEND_PICK")       { showSendList("Send"); return; }
        if (pendingPick == "XFER_USER_PICK")  { showSendList("Transfer (Checking > User)"); return; }
        if (pendingPick == "ADMIN_SEND_PICK") { showSendList("Admin Send"); return; }
        if (pendingPick == "ADMIN_ADD_PICK")  { showSendList("Add Funds"); return; }

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

default
{
    state_entry()
    {
        atmState = STATE_OFFLINE;
        if (bankListen) llListenRemove(bankListen);
        bankListen = llListen(BANK_CH, "", NULL_KEY, "");

        if (updateListen) llListenRemove(updateListen);
        updateListen = llListen(UPDATE_CH, "", NULL_KEY, "");

        llOwnerSay("G Coin ATM UI Online | Build " + (string)BUILD_NUMBER);
        checkForUpdates();
    }

    on_rez(integer p){ llResetScript(); }

    timer()
    {
        if (atmState == STATE_BOOTING)
        {
            bootLeft -= 1;
            if (bootLeft <= 0)
            {
                atmState = STATE_ONLINE;
                llSetTimerEvent((float)DIALOG_TIMEOUT);
                showProcessing("Connecting...");
                requestBalance();
                return;
            }
            showBooting();
            return;
        }

        cleanup(TRUE);
    }

    touch_start(integer total)
    {
        key id = llDetectedKey(0);
        if (!hasAccess(id)) return;

        if (activeUser != NULL_KEY && id != activeUser)
        {
            llRegionSayTo(id, 0, "ATM in use by: " + niceName(activeUser));
            return;
        }

        activeUser = id;
        setListen(activeUser);

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

        if (atmState == STATE_OFFLINE)
        {
            atmState = STATE_BOOTING;
            bootLeft = 3;
            llSetTimerEvent(1.0);
            showBooting();
            return;
        }

        atmState = STATE_ONLINE;
        llSetTimerEvent((float)DIALOG_TIMEOUT);
        showProcessing("Connecting...");
        requestBalance();
    }

    link_message(integer sn, integer num, string str, key id)
    {
        if (num == LM_RSP) handleServer(str);
    }

    listen(integer ch, string name, key id, string msg)
    {
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

        if (activeUser == NULL_KEY) return;
        if (ch != MENU_CH) return;
        if (id != activeUser) return;

        llSetTimerEvent((float)DIALOG_TIMEOUT);

        if (msg == EXIT_BTN) { cleanup(FALSE); return; }
        if (msg == HELP_BTN) { showHelp(); return; }

        if (msg == BACK_BTN)
        {
            pendingPick = "";
            showMain();
            return;
        }

        if (msg == "Balance")  { showProcessing("Requesting balance..."); requestBalance(); return; }

        if (msg == "Hud")
        {
            giveHUD(activeUser);
            showProcessing("Applying signup bonus...");
            requestSignup();
            return;
        }

        if (msg == "Deposit")  { showDepositDir(); return; }
        if (msg == "Transfer") { showTransferDir(); return; }

        if (msg == "Send")
        {
            pendingPick = "SEND_PICK";
            showProcessing("Loading users...");
            requestUserList();
            return;
        }

        if (msg == "Withdraw")
        {
            lastAction = "Withdraw";
            lastSummary = "Withdraw from Savings";
            lastTarget = NULL_KEY;

            showAmountPicker("Withdraw (Savings only)", "WD", "", NULL_KEY);
            return;
        }

        if (msg == "Settings")
        {
            if (!lastIsAdmin) { showMain(); return; }
            uiScreen = "SETTINGS";
            showSettings();
            return;
        }

        // Deposit direction buttons
        if (msg == "C>S")
        {
            lastAction = "Deposit";
            lastSummary = "Deposit from Checking to Savings";
            lastTarget = NULL_KEY;

            showAmountPicker("Deposit (Checking > Savings)", "DEPO", "C>S", NULL_KEY);
            return;
        }

        if (msg == "S>C")
        {
            lastAction = "Deposit";
            lastSummary = "Deposit from Savings to Checking";
            lastTarget = NULL_KEY;

            showAmountPicker("Deposit (Savings > Checking)", "DEPO", "S>C", NULL_KEY);
            return;
        }

        // Transfer to user
        if (msg == "C>User")
        {
            pendingPick = "XFER_USER_PICK";
            showProcessing("Loading users...");
            requestUserList();
            return;
        }

        // Settings menu actions
        if (uiScreen == "SETTINGS")
        {
            if (!lastIsAdmin) { showMain(); return; }

            if (msg == "Add Funds")
            {
                llDialog(activeUser, headerLine() + "Add Funds:\nChoose target", ["To Self","Choose User",BACK_BTN,HELP_BTN,EXIT_BTN], MENU_CH);
                return;
            }

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
                showProcessing("Loading users...");
                requestUserList();
                return;
            }

            if (msg == "Admin Send")
            {
                pendingPick = "ADMIN_SEND_PICK";
                showProcessing("Loading users...");
                requestUserList();
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

        // Pick user flows
        if (pendingPick != "")
        {
            integer idx = llListFindList(userNames, [msg]);
            if (idx != -1)
            {
                key k = llList2Key(userUUIDs, idx);

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

        // Amount picking (Finalize pops AFTER amount pick)
        if (msg == "More")
        {
            llTextBox(activeUser, "Enter amount (numbers only):", MENU_CH);
            return;
        }

        if (msg == "$10")  { queuedAmt = 10.0;  confirmFinalize(); return; }
        if (msg == "$20")  { queuedAmt = 20.0;  confirmFinalize(); return; }
        if (msg == "$50")  { queuedAmt = 50.0;  confirmFinalize(); return; }
        if (msg == "$100") { queuedAmt = 100.0; confirmFinalize(); return; }
        if (msg == "$1K")  { queuedAmt = 1000.0; confirmFinalize(); return; }
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

            showProcessing("Finalizing...");
            req(queuedCmd, queuedAmt, queuedTarget, queuedExtra);

            queuedAmt = 0.0;
            return;
        }

        showMain();
    }
}








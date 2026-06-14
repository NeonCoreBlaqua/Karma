// =====================================================
// G Coin Wallet Core
// Build 20406 Split Main
//
// Main wallet logic only. User list dialogs are handled by:
// GC_Wallet_UserPicker_20406.lsl
// Keep GC_Wallet_UI_Controller_20401.lsl in the HUD.
// =====================================================

string DISPLAY_TITLE = "G Coin Wallet";
string CURRENCY_MARK = "GC";
string PRODUCT_ID = "GCOIN_WALLET_HUD";
integer BUILD_NUMBER = 20407;

integer ACCESS_GROUP_ONLY = TRUE;
integer DIALOG_TIMEOUT = 60;

string EXIT_BTN = "Exit";
string BACK_BTN = "Back";
string HELP_BTN = "Help";

integer LM_REQ = 1000;
integer LM_RSP = 2000;
integer LM_UI = 3000;
integer LM_PICK = 3100;

integer BANK_CH = -777777;
integer UPDATE_CH = -9869870;
integer DIGIT_FACE = 0;
float DIGIT_ROTATION = 4.712389;
string DIGIT_LOGO_TEXTURE = "GC Logo";

integer bankListen;
integer updateListen;
integer menuListen;
integer MENU_CH;

key hudOwner = NULL_KEY;
key activeUser = NULL_KEY;
key queuedTarget = NULL_KEY;
string queuedTargetName = "";

float checkingBal = 0.0;
float savingsBal = 0.0;
float queuedAmt = 0.0;

integer lastIsAdmin = FALSE;
integer receiptPending = FALSE;
integer displayOnlyRefresh = FALSE;

string uiScreen = "MAIN";
string queuedCmd = "";
string queuedExtra = "";
string amtTitle = "";
string lastAction = "";
string lastSummary = "";

string accountNumber(key id)
{
    return llToUpper(llGetSubString((string)id, -6, -1));
}

string niceName(key id)
{
    string dn = llGetDisplayName(id);
    if (dn == "") dn = llKey2Name(id);
    if (dn == "") dn = "User-" + accountNumber(id);
    return dn;
}

string targetName(key id)
{
    if (id == queuedTarget && queuedTargetName != "") return queuedTargetName;
    return niceName(id);
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
    if (menuListen) llListenRemove(menuListen);
    menuListen = llListen(MENU_CH, "", who, "");
}

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
        out = "," + llGetSubString(s, -3, -1) + out;
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
    string linkName;
    integer link;
    string tex;
    string ch;

    for (i = 0; i < 10; ++i)
    {
        linkName = "DIGIT_";
        if (i + 1 < 10) linkName += "0";
        linkName += (string)(i + 1);

        link = findLinkByName(linkName);
        if (link)
        {
            tex = "";
            if (i == 0)
            {
                tex = DIGIT_LOGO_TEXTURE;
                if (llGetInventoryType(tex) != INVENTORY_TEXTURE) tex = "GC_DIGIT_BLANK";
            }
            else
            {
                ch = llGetSubString(value, i - 1, i - 1);
                tex = digitTextureFor(ch);
            }

            if (llGetInventoryType(tex) == INVENTORY_TEXTURE)
            {
                llSetLinkPrimitiveParamsFast(link, [
                    PRIM_TEXTURE, DIGIT_FACE, tex, <1.0, 1.0, 0.0>, <0.0, 0.0, 0.0>, DIGIT_ROTATION
                ]);
            }
        }
    }
}

string headerLine()
{
    string adminTag = "";
    if (lastIsAdmin) adminTag = " (Admin)";
    return DISPLAY_TITLE + "\n"
        + "User: " + niceName(activeUser) + adminTag + "\n"
        + "C: " + formatMoney(checkingBal) + " | S: " + formatMoney(savingsBal) + "\n"
        + "-------------------\n";
}

cleanup(integer timedOut)
{
    if (menuListen) llListenRemove(menuListen);
    menuListen = 0;
    if (timedOut && activeUser != NULL_KEY) llRegionSayTo(activeUser, 0, "Wallet menu timed out.");

    activeUser = NULL_KEY;
    queuedTarget = NULL_KEY;
    queuedTargetName = "";
    queuedAmt = 0.0;
    queuedCmd = "";
    queuedExtra = "";
    amtTitle = "";
    uiScreen = "MAIN";
    receiptPending = FALSE;
    displayOnlyRefresh = FALSE;
    llSetTimerEvent(0.0);
}

sendToServer(string msg)
{
    llMessageLinked(LINK_SET, LM_REQ, msg, activeUser);
    llRegionSay(BANK_CH, msg);
}

req(string cmd, float amt, key target, string extra)
{
    string msg = "REQ|" + cmd + "|" + (string)activeUser + "|" + (string)llGetKey() + "|" + (string)amt + "|" + (string)target;
    if (extra != "") msg += "|" + extra;
    sendToServer(msg);
}

requestBalance()
{
    req("BALANCE", 0.0, NULL_KEY, "");
}

requestOwnerDisplayBalance()
{
    activeUser = llGetOwner();
    displayOnlyRefresh = TRUE;
    requestBalance();
}

requestUserList(string pickMode, string title)
{
    llMessageLinked(LINK_SET, LM_PICK, "OPEN|" + (string)activeUser + "|" + pickMode + "|" + title, NULL_KEY);
    req("USERLIST", 0.0, NULL_KEY, "");
}

showHelp()
{
    llRegionSayTo(activeUser, 0,
        DISPLAY_TITLE + " Help\n"
        + "Balance checks your GC.\n"
        + "Send pays another resident.\n"
        + "Transfer moves C>S, S>C, or C>User.\n"
        + "Request asks another resident for GC."
    );
    llDialog(activeUser, headerLine() + "Help sent to chat.", [BACK_BTN, EXIT_BTN], MENU_CH);
}

showMain()
{
    uiScreen = "MAIN";
    queuedCmd = "";
    queuedExtra = "";
    queuedTarget = NULL_KEY;
    queuedTargetName = "";
    queuedAmt = 0.0;

    list buttons = ["Balance", "Send", "Transfer", "Request"];
    if (lastIsAdmin) buttons += ["Settings"];
    buttons += [HELP_BTN, EXIT_BTN];
    llDialog(activeUser, headerLine() + "Choose an option.", buttons, MENU_CH);
}

showTransferDir()
{
    uiScreen = "XFER_DIR";
    llDialog(activeUser, headerLine() + "Transfer options:", ["C>S", "S>C", "C>User", BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
}

showSettings()
{
    uiScreen = "SETTINGS";
    llDialog(activeUser, headerLine() + "Settings:", ["Add Funds", "Admin Send", "Withdraw Inv", "Withdraw Sav", BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
}

list presetButtons()
{
    return ["$10", "$20", "$50", "$100", "$1K", "$10K", "More", BACK_BTN, HELP_BTN, EXIT_BTN];
}

showAmountPicker(string title, string cmd, string extra, key target, string targetLabel)
{
    uiScreen = "AMOUNT";
    amtTitle = title;
    queuedCmd = cmd;
    queuedExtra = extra;
    queuedTarget = target;
    queuedTargetName = targetLabel;
    queuedAmt = 0.0;

    string who = "";
    if (target != NULL_KEY) who = "\nTarget: " + targetName(target);
    llDialog(activeUser, headerLine() + title + who + "\nPick amount.", presetButtons(), MENU_CH);
}

showFinalize()
{
    string who = "";
    if (queuedTarget != NULL_KEY) who = "\nTarget: " + targetName(queuedTarget);
    llDialog(activeUser,
        headerLine() + amtTitle + who + "\nSelected: " + formatMoney(queuedAmt) + "\nPress Finalize.",
        ["Finalize", BACK_BTN, HELP_BTN, EXIT_BTN],
        MENU_CH);
}

float amountFromButton(string msg)
{
    if (msg == "$10") return 10.0;
    if (msg == "$20") return 20.0;
    if (msg == "$50") return 50.0;
    if (msg == "$100") return 100.0;
    if (msg == "$1K") return 1000.0;
    if (msg == "$10K") return 10000.0;
    return 0.0;
}

printReceipt()
{
    string out = DISPLAY_TITLE + "\n" + lastAction + " complete: " + formatMoney(queuedAmt) + "\n";
    if (queuedTarget != NULL_KEY) out += "Target: " + targetName(queuedTarget) + "\n";
    out += "Checking: " + formatMoney(checkingBal) + "\nSavings: " + formatMoney(savingsBal);
    llRegionSayTo(activeUser, 0, out);
}

handleServer(string str)
{
    list p = llParseString2List(str, ["|"], []);
    if (llGetListLength(p) < 5) return;
    if (llList2String(p, 0) != "RSP") return;

    string type = llList2String(p, 1);
    key user = (key)llList2String(p, 2);
    key ui = (key)llList2String(p, 3);

    if (activeUser == NULL_KEY) return;
    if (user != activeUser) return;
    if (ui != llGetKey()) return;

    if (type == "BAL")
    {
        checkingBal = (float)llList2String(p, 4);
        savingsBal = (float)llList2String(p, 5);
        updateBalanceDisplay();
        integer i;
        lastIsAdmin = FALSE;
        for (i = 6; i < llGetListLength(p); ++i)
        {
            if (llList2String(p, i) == "ADMIN=1") lastIsAdmin = TRUE;
        }
        if (receiptPending)
        {
            receiptPending = FALSE;
            printReceipt();
        }
        if (displayOnlyRefresh || menuListen == 0)
        {
            displayOnlyRefresh = FALSE;
            return;
        }
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
        llDialog(activeUser, headerLine() + llList2String(p, 4), [BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
    }
}

handlePick(string str)
{
    list p = llParseStringKeepNulls(str, ["|"], []);
    if (llList2String(p, 0) != "PICKED") return;
    string mode = llList2String(p, 1);
    key target = (key)llList2String(p, 2);
    string pickedName = "";
    if (llGetListLength(p) > 4) pickedName = llBase64ToString(llList2String(p, 4));
    if (target == NULL_KEY) return;

    if (mode == "SEND_PICK")
    {
        lastAction = "Send";
        showAmountPicker("Send", "SEND", "", target, pickedName);
        return;
    }
    if (mode == "XFER_USER_PICK")
    {
        lastAction = "Transfer";
        showAmountPicker("Transfer C>User", "XFER", "C>U", target, pickedName);
        return;
    }
    if (mode == "REQ_PICK")
    {
        lastAction = "Request";
        showAmountPicker("Request", "REQUEST_ONLY", "", target, pickedName);
        return;
    }
    if (mode == "ADMIN_SEND_PICK")
    {
        lastAction = "Admin Send";
        showAmountPicker("Admin Send", "ADMIN_SEND", "", target, pickedName);
        return;
    }
    if (mode == "ADMIN_ADD_PICK")
    {
        lastAction = "Add Funds";
        showAmountPicker("Add Funds", "ADDFUNDS", "", target, pickedName);
    }
}

integer activateWallet(key id)
{
    if (!hasAccess(id))
    {
        setListen(id);
        activeUser = id;
        llDialog(id, "Land group required.", [EXIT_BTN], MENU_CH);
        llSetTimerEvent((float)DIALOG_TIMEOUT);
        return FALSE;
    }

    activeUser = id;
    setListen(id);
    llSetTimerEvent((float)DIALOG_TIMEOUT);
    return TRUE;
}

openWallet(key id)
{
    if (activateWallet(id)) requestBalance();
}

processUIAction(string linkName, key id)
{
    if (!activateWallet(id)) return;

    if (linkName == "UI_OPEN")
    {
        requestBalance();
        return;
    }
    if (linkName == "BTN_HELP")
    {
        showHelp();
        return;
    }
    if (linkName == "BTN_EXIT")
    {
        cleanup(FALSE);
        return;
    }
    if (linkName == "BTN_BALANCE")
    {
        requestBalance();
        return;
    }
    if (linkName == "BTN_SEND")
    {
        requestUserList("SEND_PICK", "Send");
        return;
    }
    if (linkName == "BTN_REQUEST")
    {
        requestUserList("REQ_PICK", "Request");
        return;
    }
    if (linkName == "BTN_TRANSFER")
    {
        showTransferDir();
        return;
    }
    if (linkName == "BTN_SETTINGS")
    {
        if (lastIsAdmin) showSettings();
        else showMain();
        return;
    }

    showMain();
}

handleButton(string msg)
{
    if (msg == EXIT_BTN)
    {
        cleanup(FALSE);
        return;
    }
    if (msg == HELP_BTN)
    {
        showHelp();
        return;
    }
    if (msg == BACK_BTN)
    {
        showMain();
        return;
    }

    if (msg == "Balance")
    {
        requestBalance();
        return;
    }
    if (msg == "Send")
    {
        requestUserList("SEND_PICK", "Send");
        return;
    }
    if (msg == "Request")
    {
        requestUserList("REQ_PICK", "Request");
        return;
    }
    if (msg == "Transfer")
    {
        showTransferDir();
        return;
    }
    if (msg == "Settings")
    {
        if (lastIsAdmin) showSettings();
        else showMain();
        return;
    }

    if (msg == "C>S")
    {
        lastAction = "Transfer";
        showAmountPicker("Transfer C>S", "XFER", "C>S", NULL_KEY, "");
        return;
    }
    if (msg == "S>C")
    {
        lastAction = "Transfer";
        showAmountPicker("Transfer S>C", "XFER", "S>C", NULL_KEY, "");
        return;
    }
    if (msg == "C>User")
    {
        requestUserList("XFER_USER_PICK", "Transfer");
        return;
    }

    if (msg == "Add Funds")
    {
        lastAction = "Add Funds";
        showAmountPicker("Add Funds", "ADDFUNDS", "", NULL_KEY, "");
        return;
    }
    if (msg == "Admin Send")
    {
        requestUserList("ADMIN_SEND_PICK", "Admin Send");
        return;
    }
    if (msg == "Withdraw Inv")
    {
        lastAction = "Withdraw";
        showAmountPicker("Withdraw Inv", "ADMIN_WD_INV", "", NULL_KEY, "");
        return;
    }
    if (msg == "Withdraw Sav")
    {
        lastAction = "Withdraw";
        showAmountPicker("Withdraw Sav", "ADMIN_WD_SAV", "", NULL_KEY, "");
        return;
    }

    if (msg == "More")
    {
        llTextBox(activeUser, "Enter amount:", MENU_CH);
        return;
    }
    if (msg == "Finalize")
    {
        if (queuedCmd == "" || queuedAmt <= 0.0)
        {
            llDialog(activeUser, headerLine() + "Select amount first.", [BACK_BTN, HELP_BTN, EXIT_BTN], MENU_CH);
            return;
        }
        if (queuedCmd == "REQUEST_ONLY")
        {
            llInstantMessage(queuedTarget, niceName(activeUser) + " requested " + formatMoney(queuedAmt) + ".");
            llRegionSayTo(activeUser, 0, DISPLAY_TITLE + ": request sent to " + targetName(queuedTarget) + ".");
            showMain();
            return;
        }
        req(queuedCmd, queuedAmt, queuedTarget, queuedExtra);
        llDialog(activeUser, headerLine() + "Processing...", [HELP_BTN, EXIT_BTN], MENU_CH);
        return;
    }

    float picked = amountFromButton(msg);
    if (picked > 0.0)
    {
        queuedAmt = picked;
        showFinalize();
        return;
    }

    float custom = (float)msg;
    if (custom > 0.0)
    {
        queuedAmt = custom;
        showFinalize();
    }
}

default
{
    state_entry()
    {
        hudOwner = llGetOwner();
        if (bankListen) llListenRemove(bankListen);
        bankListen = llListen(BANK_CH, "", NULL_KEY, "");
        if (updateListen) llListenRemove(updateListen);
        updateListen = llListen(UPDATE_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " split main online | Build " + (string)BUILD_NUMBER);
        requestOwnerDisplayBalance();
    }

    on_rez(integer p)
    {
        llResetScript();
    }

    attach(key id)
    {
        if (id) requestOwnerDisplayBalance();
    }

    timer()
    {
        cleanup(TRUE);
    }

    link_message(integer sender, integer num, string str, key id)
    {
        if (num == LM_RSP) handleServer(str);
        if (num == LM_UI) processUIAction(str, id);
        if (num == LM_PICK) handlePick(str);
    }

    listen(integer ch, string nm, key id, string msg)
    {
        if (ch == BANK_CH)
        {
            handleServer(msg);
            return;
        }
        if (ch != MENU_CH || id != activeUser) return;
        llSetTimerEvent((float)DIALOG_TIMEOUT);
        handleButton(msg);
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
    }
}

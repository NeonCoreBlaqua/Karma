// =====================================================
// G Coin System - AtlasVault Core Part 1
// Build 20404
//
// Listener/router, balances, signup, user list, payroll,
// display-name storage, admin add funds, server status.
// Pair with GC_AtlasVault_Core_20404_part2.
// =====================================================

string DISPLAY_TITLE = "G Coin AtlasVault Node";
integer BUILD_NUMBER = 20404;
string PROJECT_ID = "9869872-0412110914";

key BANK_ADMIN = "0f6de87a-d007-46bb-85e5-fceccf6974ae";
float SIGNUP_BONUS = 1000.00;

integer LM_REQ = 1000;
integer LM_RSP = 2000;
integer LM_TXN_REQ = 2101;

integer BANK_CH = -777777;
integer UPDATE_CH = -9869870;

string LSD_ACCTS = "BBS_ACCOUNTS";
string LSD_SIGNUP = "BBS_SIGNUP_CLAIMED";
string LSD_SETTINGS = "BBS_SETTINGS";
string LSD_NAMES = "BBS_NAMES";
string LSD_STATUS = "GC_SERVER_STATUS";
string LSD_AUDIT = "BBS_AUDIT_LOG";
integer MAX_AUDIT_ROWS = 60;

integer ONLINE_FACE = 1;
integer MAINTENANCE_FACE = 2;

string lastReqMsg = "";
integer lastReqTs = 0;

float round2(float v)
{
    return (float)llRound(v);
}

integer isAdmin(key user)
{
    return (user == BANK_ADMIN);
}

integer isLandGroup(key user)
{
    return llSameGroup(user);
}

integer isTrustedPayrollSender(key sender)
{
    if (sender == llGetKey()) return TRUE;
    return (llGetOwnerKey(sender) == BANK_ADMIN);
}

integer isServerOnline()
{
    return (llLinksetDataRead(LSD_STATUS) != "MAINTENANCE");
}

setServerOnline(integer online)
{
    if (online)
    {
        llLinksetDataWrite(LSD_STATUS, "ONLINE");
        llOwnerSay(DISPLAY_TITLE + " ONLINE | Build " + (string)BUILD_NUMBER);
    }
    else
    {
        llLinksetDataWrite(LSD_STATUS, "MAINTENANCE");
        llOwnerSay(DISPLAY_TITLE + " MAINTENANCE MODE | banking requests paused");
    }
}

string defaultSettings()
{
    return "DEP=0|WDR=0|TRN=0|SND=0";
}

list loadAccounts()
{
    string raw = llLinksetDataRead(LSD_ACCTS);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

saveAccounts(list a)
{
    llLinksetDataWrite(LSD_ACCTS, llDumpList2String(a, "|"));
}

list loadSignup()
{
    string raw = llLinksetDataRead(LSD_SIGNUP);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

saveSignup(list s)
{
    llLinksetDataWrite(LSD_SIGNUP, llDumpList2String(s, "|"));
}

integer accIndex(list accts, key id)
{
    return llListFindList(accts, [(string)id]);
}

list ensureAccount(list accts, key id)
{
    if (id == NULL_KEY) return accts;
    if (accIndex(accts, id) == -1) accts += [(string)id, 0.0, 0.0];
    return accts;
}

float getChecking(list accts, key id)
{
    integer i = accIndex(accts, id);
    if (i != -1) return llList2Float(accts, i + 1);
    return 0.0;
}

float getSavings(list accts, key id)
{
    integer i = accIndex(accts, id);
    if (i != -1) return llList2Float(accts, i + 2);
    return 0.0;
}

list setAccount(list accts, key id, float check, float save)
{
    integer i;

    check = round2(check);
    save = round2(save);
    i = accIndex(accts, id);

    if (i != -1) return llListReplaceList(accts, [(string)id, check, save], i, i + 2);
    return accts + [(string)id, check, save];
}

integer hasClaimed(list signup, key id)
{
    return (llListFindList(signup, [(string)id]) != -1);
}

list markClaimed(list signup, key id)
{
    if (!hasClaimed(signup, id)) signup += [(string)id];
    return signup;
}

integer validDisplayName(string name)
{
    if (name == "") return FALSE;
    if (name == "Resident") return FALSE;
    if (llGetSubString(name, 0, 4) == "User-") return FALSE;
    return TRUE;
}

list loadNames()
{
    string raw = llLinksetDataRead(LSD_NAMES);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

saveNames(list rows)
{
    llLinksetDataWrite(LSD_NAMES, llDumpList2String(rows, "|"));
}

integer nameRowIndex(list rows, key id)
{
    string sid = (string)id;
    integer i;
    string row;
    list p;

    for (i = 0; i < llGetListLength(rows); i++)
    {
        row = llList2String(rows, i);
        p = llParseString2List(row, [","], []);
        if (llGetListLength(p) >= 1)
        {
            if (llList2String(p, 0) == sid) return i;
        }
    }
    return -1;
}

rememberDisplayName(key id)
{
    string name;
    string agentName;
    list rows;
    integer idx;
    string row;

    if (id == NULL_KEY) return;

    name = llGetDisplayName(id);
    if (!validDisplayName(name)) return;
    agentName = llGetUsername(id);

    rows = loadNames();
    idx = nameRowIndex(rows, id);
    row = (string)id + "," + llStringToBase64(name) + "," + llStringToBase64(agentName) + "," + (string)llGetUnixTime();

    if (idx == -1) rows += [row];
    else rows = llListReplaceList(rows, [row], idx, idx);

    saveNames(rows);
}

string storedDisplayName64(key id)
{
    list rows;
    integer idx;
    string row;
    list p;

    rows = loadNames();
    idx = nameRowIndex(rows, id);
    if (idx == -1) return "";

    row = llList2String(rows, idx);
    p = llParseString2List(row, [","], []);
    if (llGetListLength(p) < 2) return "";
    return llList2String(p, 1);
}

string auditName64(key id)
{
    string name64;

    if (id == NULL_KEY) return "";
    name64 = storedDisplayName64(id);
    if (name64 == "")
    {
        rememberDisplayName(id);
        name64 = storedDisplayName64(id);
    }
    if (name64 == "") name64 = llStringToBase64((string)id);
    return name64;
}

list loadAudit()
{
    string raw = llLinksetDataRead(LSD_AUDIT);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

saveAudit(list rows)
{
    while (llGetListLength(rows) > MAX_AUDIT_ROWS)
    {
        rows = llDeleteSubList(rows, 0, 0);
    }
    llLinksetDataWrite(LSD_AUDIT, llDumpList2String(rows, "|"));
}

writeAuditLog(string source, key actor, string action, key target, float oldCheck, float oldSave, float newCheck, float newSave, float amount, string memo)
{
    list rows;
    string row;

    rows = loadAudit();
    row = (string)llGetUnixTime()
        + "~" + source
        + "~" + (string)actor
        + "~" + auditName64(actor)
        + "~" + action
        + "~" + (string)target
        + "~" + auditName64(target)
        + "~" + (string)round2(oldCheck)
        + "~" + (string)round2(oldSave)
        + "~" + (string)round2(newCheck)
        + "~" + (string)round2(newSave)
        + "~" + (string)round2(amount)
        + "~" + llStringToBase64(memo);

    rows += [row];
    saveAudit(rows);
}

sendRSP(key user, key uiKey, string msg)
{
    llMessageLinked(LINK_SET, LM_RSP, msg, user);
    if (uiKey != NULL_KEY) llRegionSayTo(uiKey, BANK_CH, msg);
}

replyToUI(string type, key user, key uiKey, string payload)
{
    sendRSP(user, uiKey, "RSP|" + type + "|" + (string)user + "|" + (string)uiKey + "|" + payload);
}

replyBAL(key user, key uiKey, float check, float save)
{
    sendRSP(user, uiKey,
        "RSP|BAL|" + (string)user + "|" + (string)uiKey + "|"
        + (string)round2(check) + "|" + (string)round2(save)
        + "|ADMIN=" + (string)isAdmin(user)
    );
}

replyOK(key user, key uiKey, string extra)
{
    replyToUI("OK", user, uiKey, extra + "|ADMIN=" + (string)isAdmin(user));
}

replyFAIL(key user, key uiKey, string reason)
{
    replyToUI("FAIL", user, uiKey, reason + "|ADMIN=" + (string)isAdmin(user));
}

replyUSERLIST(key user, key uiKey, list accts)
{
    list users = [];
    integer i;
    key id;
    string name64;

    for (i = 0; i < llGetListLength(accts); i += 3)
    {
        id = (key)llList2String(accts, i);
        if (id != NULL_KEY && id != user)
        {
            name64 = storedDisplayName64(id);
            if (name64 == "")
            {
                rememberDisplayName(id);
                name64 = storedDisplayName64(id);
            }
            if (name64 != "") users += [(string)id + "," + name64];
        }
    }

    replyToUI("USERLIST", user, uiKey, llDumpList2String(users, "|") + "|ADMIN=" + (string)isAdmin(user));
}

integer isPart2Command(string cmd)
{
    if (cmd == "DEPO") return TRUE;
    if (cmd == "WD") return TRUE;
    if (cmd == "XFER") return TRUE;
    if (cmd == "SEND") return TRUE;
    if (cmd == "ADMIN_SEND") return TRUE;
    if (cmd == "ADMIN_WD_INV") return TRUE;
    if (cmd == "ADMIN_WD_SAV") return TRUE;
    return FALSE;
}

handleUpdateMessage(string msg, key sender)
{
    list p;
    string pid;
    integer nb;

    if (sender != llGetOwner()) return;

    p = llParseString2List(msg, ["|"], []);
    if (llGetListLength(p) < 3) return;
    if (llList2String(p, 0) != "UPDATE") return;

    pid = llList2String(p, 1);
    nb = (integer)llList2String(p, 2);
    if (pid != PROJECT_ID) return;

    if (nb > BUILD_NUMBER)
        sendRSP(llGetOwner(), NULL_KEY, "RSP|UPDATE|" + (string)llGetOwner() + "|NULL|NEW_BUILD=" + (string)nb);
}

handleReq(string msg, key sender)
{
    list parts;
    integer now;
    string cmd;
    key user;
    key uiKey;
    float amt;
    key target;
    string extra;
    list accts;
    list signup;
    float check;
    float save;
    key who;
    float wC;
    float wS;

    parts = llParseString2List(msg, ["|"], []);
    if (llGetListLength(parts) < 6) return;
    if (llList2String(parts, 0) != "REQ") return;

    now = llGetUnixTime();
    if (msg == lastReqMsg && now - lastReqTs <= 2) return;
    lastReqMsg = msg;
    lastReqTs = now;

    cmd = llList2String(parts, 1);
    user = (key)llList2String(parts, 2);
    uiKey = (key)llList2String(parts, 3);
    amt = round2((float)llList2String(parts, 4));
    target = (key)llList2String(parts, 5);
    extra = "";
    if (llGetListLength(parts) >= 7) extra = llList2String(parts, 6);

    if (cmd == "PAYROLL")
    {
        if (!isTrustedPayrollSender(sender)) { replyFAIL(user, uiKey, "Payroll sender not trusted"); return; }
        if (!isAdmin(user)) { replyFAIL(user, uiKey, "Payroll admin only"); return; }
        if (target == NULL_KEY) { replyFAIL(user, uiKey, "Missing payroll recipient"); return; }
        if (amt <= 0.0) { replyFAIL(user, uiKey, "Invalid payroll amount"); return; }

        accts = loadAccounts();
        accts = ensureAccount(accts, user);
        accts = ensureAccount(accts, target);
        wC = getChecking(accts, target);
        wS = getSavings(accts, target);
        accts = setAccount(accts, target, wC + amt, wS);
        saveAccounts(accts);
        writeAuditLog("WORKFORCE", user, "PAYROLL", target, wC, wS, wC + amt, wS, amt, extra);

        replyOK(user, uiKey, "PAYROLL|" + (string)amt + "|" + (string)target + "|" + extra);
        return;
    }

    if (!isLandGroup(user)) { replyFAIL(user, uiKey, "Land group required"); return; }
    if (!isServerOnline() && !isAdmin(user))
    {
        replyFAIL(user, uiKey, "G Coin System is currently in maintenance. Please try again soon.");
        return;
    }

    rememberDisplayName(user);
    if (target != NULL_KEY) rememberDisplayName(target);

    if (isPart2Command(cmd))
    {
        llMessageLinked(LINK_SET, LM_TXN_REQ, msg, sender);
        return;
    }

    accts = loadAccounts();
    accts = ensureAccount(accts, user);
    if (target != NULL_KEY) accts = ensureAccount(accts, target);
    check = getChecking(accts, user);
    save = getSavings(accts, user);

    if (cmd == "BALANCE")
    {
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "USERLIST")
    {
        replyUSERLIST(user, uiKey, accts);
        return;
    }

    if (cmd == "SIGNUP")
    {
        signup = loadSignup();
        if (hasClaimed(signup, user)) { replyFAIL(user, uiKey, "Signup bonus already claimed"); return; }

        check += SIGNUP_BONUS;
        accts = setAccount(accts, user, check, save);
        signup = markClaimed(signup, user);
        saveAccounts(accts);
        saveSignup(signup);
        writeAuditLog("SYSTEM", user, "SIGNUP_BONUS", user, check - SIGNUP_BONUS, save, check, save, SIGNUP_BONUS, "Signup bonus");

        replyOK(user, uiKey, "SIGNUP|" + (string)SIGNUP_BONUS);
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "ADDFUNDS")
    {
        if (!isAdmin(user)) { replyFAIL(user, uiKey, "Admin only"); return; }
        if (amt <= 0.0) { replyFAIL(user, uiKey, "Invalid amount"); return; }

        who = user;
        if (target != NULL_KEY) who = target;
        accts = ensureAccount(accts, who);
        wC = getChecking(accts, who);
        wS = getSavings(accts, who);
        accts = setAccount(accts, who, wC + amt, wS);
        saveAccounts(accts);
        writeAuditLog("ADMIN", user, "ADMIN_ADD_FUNDS", who, wC, wS, wC + amt, wS, amt, extra);

        replyOK(user, uiKey, "ADDFUNDS|" + (string)amt + "|" + (string)who);
        replyBAL(user, uiKey, getChecking(accts, user), getSavings(accts, user));
        return;
    }

    replyFAIL(user, uiKey, "Unknown command");
}

default
{
    state_entry()
    {
        if (llLinksetDataRead(LSD_SETTINGS) == "") llLinksetDataWrite(LSD_SETTINGS, defaultSettings());
        if (llLinksetDataRead(LSD_STATUS) == "") llLinksetDataWrite(LSD_STATUS, "ONLINE");

        llListen(UPDATE_CH, "", NULL_KEY, "");
        llListen(BANK_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " part 1 online | " + llLinksetDataRead(LSD_STATUS) + " | Build " + (string)BUILD_NUMBER);
    }

    listen(integer ch, string nm, key id, string msg)
    {
        if (ch == UPDATE_CH) { handleUpdateMessage(msg, id); return; }
        if (ch == BANK_CH) { handleReq(msg, id); return; }
    }

    link_message(integer sender_num, integer num, string str, key id)
    {
        if (num == LM_REQ) handleReq(str, llGetKey());
    }

    touch_start(integer total)
    {
        key toucher;
        integer face;
        integer link;
        string name;

        toucher = llDetectedKey(0);
        if (!isAdmin(toucher) && toucher != llGetOwner()) return;

        face = llDetectedTouchFace(0);
        if (face == ONLINE_FACE) { setServerOnline(TRUE); return; }
        if (face == MAINTENANCE_FACE) { setServerOnline(FALSE); return; }

        link = llDetectedLinkNumber(0);
        name = llToUpper(llGetLinkName(link));

        if (llSubStringIndex(name, "ONLINE") != -1 || llSubStringIndex(name, "GREEN") != -1)
        {
            setServerOnline(TRUE);
            return;
        }

        if (llSubStringIndex(name, "MAINT") != -1 || llSubStringIndex(name, "OFFLINE") != -1 || llSubStringIndex(name, "RED") != -1)
        {
            setServerOnline(FALSE);
            return;
        }

        llOwnerSay(DISPLAY_TITLE + " status: " + llLinksetDataRead(LSD_STATUS) + " | Build " + (string)BUILD_NUMBER);
    }

    changed(integer change)
    {
        if (change & CHANGED_REGION_START)
        {
            llOwnerSay(DISPLAY_TITLE + " detected region start | " + llLinksetDataRead(LSD_STATUS) + " | data loaded from Linkset Data");
        }
    }
}

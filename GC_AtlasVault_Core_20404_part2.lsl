// =====================================================
// G Coin System - AtlasVault Core Part 2
// Build 20404
//
// Money transaction worker for AtlasVault.
// Pair with GC_AtlasVault_Core_20404_part1.
// =====================================================

string DISPLAY_TITLE = "G Coin AtlasVault Node";
integer BUILD_NUMBER = 20404;

key BANK_ADMIN = "0f6de87a-d007-46bb-85e5-fceccf6974ae";
float DAILY_LIMIT = 25000.00;
integer DAILY_TXN_LIMIT = 50;

integer LM_RSP = 2000;
integer LM_TXN_REQ = 2101;
integer BANK_CH = -777777;

string LSD_ACCTS = "BBS_ACCOUNTS";
string LSD_SETTINGS = "BBS_SETTINGS";
string LSD_DAILY = "BBS_DAILY";
string LSD_TXNCOUNT = "BBS_TXNCOUNT";
string LSD_NAMES = "BBS_NAMES";
string LSD_AUDIT = "BBS_AUDIT_LOG";
integer MAX_AUDIT_ROWS = 60;

float round2(float v)
{
    return (float)llRound(v);
}

integer isAdmin(key user)
{
    return (user == BANK_ADMIN);
}

string defaultSettings()
{
    return "DEP=0|WDR=0|TRN=0|SND=0";
}

string loadSettings()
{
    string raw = llLinksetDataRead(LSD_SETTINGS);
    if (raw == "") raw = defaultSettings();
    return raw;
}

integer getFlag(string raw, string keyName)
{
    list t;
    integer i;
    string s;
    integer eq;

    t = llParseString2List(raw, ["|"], []);
    for (i = 0; i < llGetListLength(t); i++)
    {
        s = llList2String(t, i);
        if (llGetSubString(s, 0, 2) == keyName)
        {
            eq = llSubStringIndex(s, "=");
            if (eq != -1) return (integer)llGetSubString(s, eq + 1, -1);
        }
    }
    return 0;
}

integer adminOnly(string settingsRaw, string actionKey)
{
    return getFlag(settingsRaw, actionKey);
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

list dailyLoad()
{
    string raw = llLinksetDataRead(LSD_DAILY);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

dailySave(list rows)
{
    llLinksetDataWrite(LSD_DAILY, llDumpList2String(rows, "|"));
}

integer dailyRowIndex(list rows, key id)
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

float dailySent(key id)
{
    list rows;
    integer idx;
    string row;
    list p;
    float amt;
    integer ts;

    rows = dailyLoad();
    idx = dailyRowIndex(rows, id);
    if (idx == -1) return 0.0;

    row = llList2String(rows, idx);
    p = llParseString2List(row, [","], []);
    if (llGetListLength(p) < 3) return 0.0;

    amt = (float)llList2String(p, 1);
    ts = (integer)llList2String(p, 2);

    if (llGetUnixTime() - ts > 86400)
    {
        rows = llListReplaceList(rows, [(string)id + ",0," + (string)llGetUnixTime()], idx, idx);
        dailySave(rows);
        return 0.0;
    }

    return amt;
}

updateDaily(key id, float addAmt)
{
    list rows;
    integer idx;
    integer now;
    string row;
    list p;
    float oldAmt;
    integer ts;
    float newAmt;

    rows = dailyLoad();
    idx = dailyRowIndex(rows, id);
    now = llGetUnixTime();

    if (idx == -1)
    {
        rows += [(string)id + "," + (string)round2(addAmt) + "," + (string)now];
        dailySave(rows);
        return;
    }

    row = llList2String(rows, idx);
    p = llParseString2List(row, [","], []);
    oldAmt = 0.0;
    ts = now;

    if (llGetListLength(p) >= 3)
    {
        oldAmt = (float)llList2String(p, 1);
        ts = (integer)llList2String(p, 2);
    }

    if (now - ts > 86400)
    {
        oldAmt = 0.0;
        ts = now;
    }

    newAmt = round2(oldAmt + addAmt);
    rows = llListReplaceList(rows, [(string)id + "," + (string)newAmt + "," + (string)ts], idx, idx);
    dailySave(rows);
}

list txnCountLoad()
{
    string raw = llLinksetDataRead(LSD_TXNCOUNT);
    if (raw == "") return [];
    return llParseString2List(raw, ["|"], []);
}

txnCountSave(list rows)
{
    llLinksetDataWrite(LSD_TXNCOUNT, llDumpList2String(rows, "|"));
}

integer txnCountRowIndex(list rows, key id)
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

integer txnCountToday(key id)
{
    list rows;
    integer idx;
    string row;
    list p;
    integer count;
    integer ts;

    rows = txnCountLoad();
    idx = txnCountRowIndex(rows, id);
    if (idx == -1) return 0;

    row = llList2String(rows, idx);
    p = llParseString2List(row, [","], []);
    if (llGetListLength(p) < 3) return 0;

    count = (integer)llList2String(p, 1);
    ts = (integer)llList2String(p, 2);

    if (llGetUnixTime() - ts > 86400)
    {
        rows = llListReplaceList(rows, [(string)id + ",0," + (string)llGetUnixTime()], idx, idx);
        txnCountSave(rows);
        return 0;
    }

    return count;
}

incrementTxnCount(key id)
{
    list rows;
    integer idx;
    integer now;
    string row;
    list p;
    integer oldCount;
    integer ts;

    rows = txnCountLoad();
    idx = txnCountRowIndex(rows, id);
    now = llGetUnixTime();

    if (idx == -1)
    {
        rows += [(string)id + ",1," + (string)now];
        txnCountSave(rows);
        return;
    }

    row = llList2String(rows, idx);
    p = llParseString2List(row, [","], []);
    oldCount = 0;
    ts = now;

    if (llGetListLength(p) >= 3)
    {
        oldCount = (integer)llList2String(p, 1);
        ts = (integer)llList2String(p, 2);
    }

    if (now - ts > 86400)
    {
        oldCount = 0;
        ts = now;
    }

    rows = llListReplaceList(rows, [(string)id + "," + (string)(oldCount + 1) + "," + (string)ts], idx, idx);
    txnCountSave(rows);
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

handleTxn(string msg)
{
    list parts;
    string cmd;
    key user;
    key uiKey;
    float amt;
    key target;
    string extra;
    string settingsRaw;
    list accts;
    float check;
    float save;
    float rC;
    float rS;
    float rC2;
    float rS2;
    float tC;
    float tS;
    float oldCheck;
    float oldSave;
    float oldRC;
    float oldRS;

    parts = llParseString2List(msg, ["|"], []);
    if (llGetListLength(parts) < 6) return;
    if (llList2String(parts, 0) != "REQ") return;

    cmd = llList2String(parts, 1);
    user = (key)llList2String(parts, 2);
    uiKey = (key)llList2String(parts, 3);
    amt = round2((float)llList2String(parts, 4));
    target = (key)llList2String(parts, 5);
    extra = "";
    if (llGetListLength(parts) >= 7) extra = llList2String(parts, 6);

    rememberDisplayName(user);
    if (target != NULL_KEY) rememberDisplayName(target);

    if (amt <= 0.0) { replyFAIL(user, uiKey, "Invalid amount"); return; }

    settingsRaw = loadSettings();
    accts = loadAccounts();
    accts = ensureAccount(accts, user);
    if (target != NULL_KEY) accts = ensureAccount(accts, target);
    check = getChecking(accts, user);
    save = getSavings(accts, user);

    if (cmd == "DEPO")
    {
        if (adminOnly(settingsRaw, "DEP") && !isAdmin(user)) { replyFAIL(user, uiKey, "Deposit is admin-only"); return; }

        oldCheck = check;
        oldSave = save;

        if (extra == "C>S")
        {
            if (check < amt) { replyFAIL(user, uiKey, "Insufficient checking"); return; }
            check -= amt;
            save += amt;
        }
        else if (extra == "S>C")
        {
            if (save < amt) { replyFAIL(user, uiKey, "Insufficient savings"); return; }
            save -= amt;
            check += amt;
        }
        else { replyFAIL(user, uiKey, "Bad deposit direction"); return; }

        accts = setAccount(accts, user, check, save);
        saveAccounts(accts);
        writeAuditLog("USER", user, "DEPO_" + extra, user, oldCheck, oldSave, check, save, amt, extra);
        replyOK(user, uiKey, "DEPO|" + extra + "|" + (string)amt);
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "WD")
    {
        if (adminOnly(settingsRaw, "WDR") && !isAdmin(user)) { replyFAIL(user, uiKey, "Withdraw is admin-only"); return; }
        if (save < amt) { replyFAIL(user, uiKey, "Insufficient savings"); return; }

        oldCheck = check;
        oldSave = save;
        save -= amt;
        accts = setAccount(accts, user, check, save);
        saveAccounts(accts);
        writeAuditLog("USER", user, "WD", user, oldCheck, oldSave, check, save, amt, extra);
        replyOK(user, uiKey, "WD|" + (string)amt);
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "XFER")
    {
        if (adminOnly(settingsRaw, "TRN") && !isAdmin(user)) { replyFAIL(user, uiKey, "Transfer is admin-only"); return; }

        if (extra == "C>S")
        {
            if (check < amt) { replyFAIL(user, uiKey, "Insufficient checking"); return; }
            oldCheck = check;
            oldSave = save;
            check -= amt;
            save += amt;
            accts = setAccount(accts, user, check, save);
            saveAccounts(accts);
            writeAuditLog("USER", user, "XFER_C_TO_S", user, oldCheck, oldSave, check, save, amt, extra);
            replyOK(user, uiKey, "XFER|C>S|" + (string)amt);
            replyBAL(user, uiKey, check, save);
            return;
        }

        if (extra == "S>C")
        {
            if (save < amt) { replyFAIL(user, uiKey, "Insufficient savings"); return; }
            oldCheck = check;
            oldSave = save;
            save -= amt;
            check += amt;
            accts = setAccount(accts, user, check, save);
            saveAccounts(accts);
            writeAuditLog("USER", user, "XFER_S_TO_C", user, oldCheck, oldSave, check, save, amt, extra);
            replyOK(user, uiKey, "XFER|S>C|" + (string)amt);
            replyBAL(user, uiKey, check, save);
            return;
        }

        if (extra == "C>U")
        {
            if (target == NULL_KEY) { replyFAIL(user, uiKey, "Missing recipient"); return; }
            if (target == user) { replyFAIL(user, uiKey, "You cannot send money to yourself"); return; }
            if (adminOnly(settingsRaw, "SND") && !isAdmin(user)) { replyFAIL(user, uiKey, "Send is admin-only"); return; }
            if (txnCountToday(user) >= DAILY_TXN_LIMIT) { replyFAIL(user, uiKey, "Daily transaction limit reached. Try again after the daily reset."); return; }
            if (dailySent(user) + amt > DAILY_LIMIT) { replyFAIL(user, uiKey, "Daily limit exceeded"); return; }
            if (check < amt) { replyFAIL(user, uiKey, "Insufficient checking"); return; }

            rC = getChecking(accts, target);
            rS = getSavings(accts, target);
            oldCheck = check;
            oldSave = save;
            oldRC = rC;
            oldRS = rS;
            check -= amt;
            rC += amt;
            accts = setAccount(accts, user, check, save);
            accts = setAccount(accts, target, rC, rS);
            saveAccounts(accts);
            writeAuditLog("USER", user, "XFER_C_TO_USER_DEBIT", user, oldCheck, oldSave, check, save, amt, (string)target);
            writeAuditLog("USER", user, "XFER_C_TO_USER_CREDIT", target, oldRC, oldRS, rC, rS, amt, (string)user);
            updateDaily(user, amt);
            incrementTxnCount(user);
            replyOK(user, uiKey, "XFER|C>U|" + (string)amt + "|" + (string)target);
            replyBAL(user, uiKey, check, save);
            return;
        }

        replyFAIL(user, uiKey, "Bad transfer type");
        return;
    }

    if (cmd == "SEND")
    {
        if (adminOnly(settingsRaw, "SND") && !isAdmin(user)) { replyFAIL(user, uiKey, "Send is admin-only"); return; }
        if (target == NULL_KEY) { replyFAIL(user, uiKey, "Missing recipient"); return; }
        if (target == user) { replyFAIL(user, uiKey, "You cannot send money to yourself"); return; }
        if (txnCountToday(user) >= DAILY_TXN_LIMIT) { replyFAIL(user, uiKey, "Daily transaction limit reached. Try again after the daily reset."); return; }
        if (dailySent(user) + amt > DAILY_LIMIT) { replyFAIL(user, uiKey, "Daily limit exceeded"); return; }
        if (check < amt) { replyFAIL(user, uiKey, "Insufficient checking"); return; }

        rC2 = getChecking(accts, target);
        rS2 = getSavings(accts, target);
        oldCheck = check;
        oldSave = save;
        oldRC = rC2;
        oldRS = rS2;
        check -= amt;
        rC2 += amt;
        accts = setAccount(accts, user, check, save);
        accts = setAccount(accts, target, rC2, rS2);
        saveAccounts(accts);
        writeAuditLog("USER", user, "SEND_DEBIT", user, oldCheck, oldSave, check, save, amt, (string)target);
        writeAuditLog("USER", user, "SEND_CREDIT", target, oldRC, oldRS, rC2, rS2, amt, (string)user);
        updateDaily(user, amt);
        incrementTxnCount(user);
        replyOK(user, uiKey, "SEND|" + (string)amt + "|" + (string)target);
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "ADMIN_SEND")
    {
        if (!isAdmin(user)) { replyFAIL(user, uiKey, "Admin only"); return; }
        if (target == NULL_KEY) { replyFAIL(user, uiKey, "Missing recipient"); return; }

        tC = getChecking(accts, target);
        tS = getSavings(accts, target);
        accts = setAccount(accts, target, tC + amt, tS);
        saveAccounts(accts);
        writeAuditLog("ADMIN", user, "ADMIN_SEND", target, tC, tS, tC + amt, tS, amt, extra);
        replyOK(user, uiKey, "ADMIN_SEND|" + (string)amt + "|" + (string)target);
        replyBAL(user, uiKey, getChecking(accts, user), getSavings(accts, user));
        return;
    }

    if (cmd == "ADMIN_WD_INV")
    {
        if (!isAdmin(user)) { replyFAIL(user, uiKey, "Admin only"); return; }
        writeAuditLog("ADMIN", user, "ADMIN_WD_INV", user, check, save, check, save, amt, extra);
        replyOK(user, uiKey, "ADMIN_WD_INV|" + (string)amt);
        replyBAL(user, uiKey, check, save);
        return;
    }

    if (cmd == "ADMIN_WD_SAV")
    {
        if (!isAdmin(user)) { replyFAIL(user, uiKey, "Admin only"); return; }
        if (save < amt) { replyFAIL(user, uiKey, "Insufficient savings"); return; }

        oldCheck = check;
        oldSave = save;
        save -= amt;
        accts = setAccount(accts, user, check, save);
        saveAccounts(accts);
        writeAuditLog("ADMIN", user, "ADMIN_WD_SAV", user, oldCheck, oldSave, check, save, amt, extra);
        replyOK(user, uiKey, "ADMIN_WD_SAV|" + (string)amt);
        replyBAL(user, uiKey, check, save);
        return;
    }

    replyFAIL(user, uiKey, "Unknown transaction command");
}

default
{
    state_entry()
    {
        llOwnerSay(DISPLAY_TITLE + " part 2 transaction worker online | Build " + (string)BUILD_NUMBER);
    }

    link_message(integer sender_num, integer num, string str, key id)
    {
        if (num == LM_TXN_REQ) handleTxn(str);
    }
}

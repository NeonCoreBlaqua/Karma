// =====================================================
// Neuro G-Coin Wallet Bridge v0.1
//
// Drop into the Neuro-Link HUD/tablet linkset.
// Talks to AtlasVault on BANK_CH and refreshes SL media
// with wallet balances. User-list sync stays off the media URL
// so SL does not reject long PRIM_MEDIA_CURRENT_URL values.
//
// Put this script directly inside the media screen prim.
// It sets media on the same prim it is inside.
// =====================================================

string DISPLAY_TITLE = "Neuro G-Coin Wallet Bridge";
integer BUILD_NUMBER = 1;

string NEURO_URL = "https://vrynos.github.io/Neuro/";
integer MEDIA_FACE = 4;

integer BANK_CH = -777777;
integer HTTP_TIMEOUT = 25;
integer MAX_USERS = 12;

key activeUser = NULL_KEY;
key httpRequestId = NULL_KEY;
string bridgeUrl = "";
integer bankListen = 0;

float checking = 0.0;
float savings = 0.0;
integer isAdmin = FALSE;
string usersPayload = "";
integer lastSync = 0;

string enc(string value)
{
    return llEscapeURL(value);
}

string gcAmount(float amount)
{
    return (string)llRound(amount);
}

string baseUrl()
{
    return NEURO_URL
        + "?profileBridge=sl"
        + "&profileEndpoint=" + enc(bridgeUrl)
        + "&gcDisplayName=" + enc(llGetDisplayName(activeUser))
        + "&gcAccount=" + enc((string)activeUser)
        + "&gcChecking=" + enc(gcAmount(checking))
        + "&gcSavings=" + enc(gcAmount(savings))
        + "&gcAdmin=" + (string)isAdmin
        + "&gcSync=" + (string)lastSync
        + "#wallet";
}

integer mediaFace()
{
    integer sides = llGetNumberOfSides();
    if (MEDIA_FACE < sides) return MEDIA_FACE;
    return 0;
}

setMedia()
{
    integer face;

    if (bridgeUrl == "" || activeUser == NULL_KEY) return;

    face = mediaFace();

    llSetPrimMediaParams(face, [
        PRIM_MEDIA_CURRENT_URL, baseUrl(),
        PRIM_MEDIA_HOME_URL, baseUrl(),
        PRIM_MEDIA_AUTO_PLAY, TRUE,
        PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_OWNER,
        PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_OWNER,
        PRIM_MEDIA_WIDTH_PIXELS, 1024,
        PRIM_MEDIA_HEIGHT_PIXELS, 1024
    ]);
}

ensureListen()
{
    if (!bankListen) bankListen = llListen(BANK_CH, "", NULL_KEY, "");
}

sendBank(string cmd, float amount, key target, string extra)
{
    if (activeUser == NULL_KEY) activeUser = llGetOwner();
    ensureListen();
    llRegionSay(BANK_CH,
        "REQ|" + cmd
        + "|" + (string)activeUser
        + "|" + (string)llGetKey()
        + "|" + (string)llRound(amount)
        + "|" + (string)target
        + "|" + extra
    );
}

refreshWallet()
{
    activeUser = llGetOwner();
    sendBank("BALANCE", 0.0, NULL_KEY, "");
    sendBank("USERLIST", 0.0, NULL_KEY, "");
}

integer startsWith(string value, string prefix)
{
    return llGetSubString(value, 0, llStringLength(prefix) - 1) == prefix;
}

string queryValue(string body, string keyName)
{
    list parts = llParseStringKeepNulls(body, ["&"], []);
    integer i;
    string row;
    integer eq;
    string k;

    for (i = 0; i < llGetListLength(parts); i++)
    {
        row = llList2String(parts, i);
        eq = llSubStringIndex(row, "=");
        if (eq != -1)
        {
            k = llUnescapeURL(llGetSubString(row, 0, eq - 1));
            if (k == keyName) return llUnescapeURL(llGetSubString(row, eq + 1, -1));
        }
    }
    return "";
}

handleBridgeOp(string body, key requestId)
{
    string op = queryValue(body, "op");
    string from;
    string to;
    string resident;
    string amountRaw;
    float amount;
    string reason;

    activeUser = llGetOwner();

    if (op == "gcoin-balance" || op == "gcoin-history")
    {
        refreshWallet();
        llHTTPResponse(requestId, 200, "OK");
        return;
    }

    if (op == "gcoin-transfer")
    {
        from = queryValue(body, "from");
        to = queryValue(body, "to");
        resident = queryValue(body, "resident");
        amountRaw = queryValue(body, "amount");
        amount = (float)amountRaw;

        if (amount <= 0.0)
        {
            llHTTPResponse(requestId, 400, "Bad amount");
            return;
        }

        if (from == "savings" && to == "resident")
        {
            llHTTPResponse(requestId, 400, "Savings cannot pay residents");
            return;
        }

        if (from == "checking" && to == "savings")
        {
            sendBank("XFER", amount, NULL_KEY, "C>S");
            llHTTPResponse(requestId, 200, "OK");
            return;
        }

        if (from == "savings" && to == "checking")
        {
            sendBank("XFER", amount, NULL_KEY, "S>C");
            llHTTPResponse(requestId, 200, "OK");
            return;
        }

        if (from == "checking" && to == "resident")
        {
            sendBank("SEND", amount, (key)resident, "");
            llHTTPResponse(requestId, 200, "OK");
            return;
        }

        llHTTPResponse(requestId, 400, "Bad transfer");
        return;
    }

    if (op == "gcoin-request")
    {
        resident = queryValue(body, "resident");
        amountRaw = queryValue(body, "amount");
        reason = queryValue(body, "reason");
        amount = (float)amountRaw;

        if ((key)resident != NULL_KEY && amount > 0.0)
        {
            llInstantMessage((key)resident,
                llGetDisplayName(activeUser)
                + " requested GC "
                + gcAmount(amount)
                + ". Reason: "
                + reason
            );
            llHTTPResponse(requestId, 200, "OK");
            return;
        }

        llHTTPResponse(requestId, 400, "Bad request");
        return;
    }

    llHTTPResponse(requestId, 200, "OK");
}

handleBankReply(string msg)
{
    list p = llParseStringKeepNulls(msg, ["|"], []);
    string type;
    string payload;
    integer i;
    integer added;

    if (llGetListLength(p) < 5) return;
    if (llList2String(p, 0) != "RSP") return;
    if ((key)llList2String(p, 2) != activeUser) return;
    if ((key)llList2String(p, 3) != llGetKey()) return;

    type = llList2String(p, 1);

    if (type == "BAL")
    {
        checking = (float)llList2String(p, 4);
        savings = (float)llList2String(p, 5);
        isAdmin = FALSE;
        for (i = 6; i < llGetListLength(p); i++)
        {
            if (llList2String(p, i) == "ADMIN=1") isAdmin = TRUE;
        }
        lastSync = llGetUnixTime();
        setMedia();
        return;
    }

    if (type == "USERLIST")
    {
        usersPayload = "";
        added = 0;
        for (i = 4; i < llGetListLength(p); i++)
        {
            payload = llList2String(p, i);
            if (!startsWith(payload, "ADMIN=") && added < MAX_USERS)
            {
                if (usersPayload != "") usersPayload += "|";
                usersPayload += payload;
                added += 1;
            }
        }
        lastSync = llGetUnixTime();
        setMedia();
        return;
    }

    if (type == "OK")
    {
        refreshWallet();
    }
}

default
{
    state_entry()
    {
        activeUser = llGetOwner();
        ensureListen();
        httpRequestId = llRequestURL();
        llOwnerSay(DISPLAY_TITLE + " online. Requesting bridge URL...");
    }

    on_rez(integer startParam)
    {
        llResetScript();
    }

    changed(integer change)
    {
        if (change & (CHANGED_OWNER | CHANGED_REGION_START))
        {
            llResetScript();
        }
    }

    http_request(key requestId, string method, string body)
    {
        string query;

        if (requestId == httpRequestId)
        {
            if (method == URL_REQUEST_GRANTED)
            {
                bridgeUrl = body;
                llOwnerSay(DISPLAY_TITLE + " bridge ready.");
                refreshWallet();
                return;
            }

            if (method == URL_REQUEST_DENIED)
            {
                llOwnerSay(DISPLAY_TITLE + " URL denied: " + body);
                return;
            }
        }

        if (method == "GET")
        {
            query = llGetHTTPHeader(requestId, "x-query-string");
            handleBridgeOp(query, requestId);
            return;
        }

        llHTTPResponse(requestId, 405, "Method not allowed");
    }

    listen(integer ch, string name, key id, string msg)
    {
        if (ch == BANK_CH) handleBankReply(msg);
    }

    touch_start(integer total)
    {
        if (llDetectedKey(0) == llGetOwner())
        {
            refreshWallet();
        }
    }
}

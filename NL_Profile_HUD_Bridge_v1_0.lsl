// =====================================================
// Neuro-Link Profile HUD Bridge v1.0
//
// Drop this into the Neuro Pad HUD linkset.
// Link 2 = media screen, face 4 = media face.
//
// Default behavior:
// - Closed on attach.
// - Touch owner to open/close.
// - Opening refreshes from the SL Profile Server.
// - Media buttons map to LSL ops:
//   profile.refresh, profile.save, profile.reset, profile.close
// =====================================================

string DISPLAY_TITLE = "Neuro-Link Profile Bridge";
integer BUILD_NUMBER = 1;

string APP_URL = "https://vrynos.github.io/Neuro/";
integer MEDIA_LINK = 2;
integer MEDIA_FACE = 4;
integer PROFILE_CH = -73463311;
integer HTTP_TIMEOUT = 25;

key activeUser = NULL_KEY;
key urlRequest = NULL_KEY;
key pendingHttp = NULL_KEY;
string bridgeUrl = "";
integer profileListen = 0;
integer open = FALSE;
integer pendingStarted = 0;

string displayName = "";
string title = "";
string location = "";
string avatarUrl = "";
string bio = "";
integer setup = FALSE;

string cacheKey()
{
    return "NL_PROFILE_CACHE:" + (string)activeUser;
}

string enc(string value)
{
    return llEscapeURL(value);
}

string b64(string value)
{
    return llStringToBase64(value);
}

string ub64(string value)
{
    return llBase64ToString(value);
}

string formDecode(string value)
{
    return llUnescapeURL(llDumpList2String(llParseStringKeepNulls(value, ["+"], []), " "));
}

string packCache()
{
    return llList2Json(JSON_OBJECT, [
        "displayName", displayName,
        "title", title,
        "location", location,
        "avatarUrl", avatarUrl,
        "bio", bio,
        "setup", (string)setup
    ]);
}

saveCache()
{
    if (activeUser != NULL_KEY) llLinksetDataWrite(cacheKey(), packCache());
}

loadCache()
{
    string packed;

    if (activeUser == NULL_KEY) return;
    packed = llLinksetDataRead(cacheKey());
    if (packed == "") return;

    displayName = llJsonGetValue(packed, ["displayName"]);
    title = llJsonGetValue(packed, ["title"]);
    location = llJsonGetValue(packed, ["location"]);
    avatarUrl = llJsonGetValue(packed, ["avatarUrl"]);
    bio = llJsonGetValue(packed, ["bio"]);
    setup = ((integer)llJsonGetValue(packed, ["setup"]) == TRUE);
}

clearCache()
{
    if (activeUser != NULL_KEY) llLinksetDataDelete(cacheKey());
}

integer mediaFace()
{
    integer sides;
    if (MEDIA_LINK > 0 && MEDIA_LINK <= llGetNumberOfPrims())
    {
        sides = llGetLinkNumberOfSides(MEDIA_LINK);
        if (MEDIA_FACE < sides) return MEDIA_FACE;
    }
    return 0;
}

string queryValue(string body, string keyName)
{
    list parts = llParseStringKeepNulls(body, ["&"], []);
    integer i;
    string row;
    integer eq;
    string k;

    for (i = 0; i < llGetListLength(parts); ++i)
    {
        row = llList2String(parts, i);
        eq = llSubStringIndex(row, "=");
        if (eq != -1)
        {
            k = formDecode(llGetSubString(row, 0, eq - 1));
            if (k == keyName) return formDecode(llGetSubString(row, eq + 1, -1));
        }
    }
    return "";
}

ensureListen()
{
    if (!profileListen) profileListen = llListen(PROFILE_CH, "", NULL_KEY, "");
}

string appUrl()
{
    return APP_URL
        + "?profileBridge=sl"
        + "&profileEndpoint=parent"
        + "&uuid=" + enc((string)activeUser)
        + "&agentName=" + enc(llKey2Name(activeUser))
        + "&displayName=" + enc(displayName)
        + "&title=" + enc(title)
        + "&location=" + enc(location)
        + "&avatarUrl=" + enc(avatarUrl)
        + "&bio=" + enc(bio)
        + "&setup=" + (string)setup
        + "#profile";
}

string mediaUrl()
{
    return bridgeUrl + "?screen=profile&t=" + (string)llGetUnixTime();
}

string wrapperHtml()
{
    string src = appUrl();
    return "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
        + "<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020707}iframe{border:0;width:100%;height:100%;display:block}</style>"
        + "</head><body><iframe id='neuro' src='" + src + "'></iframe>"
        + "<script>var f=document.getElementById('neuro');window.addEventListener('message',function(e){var d=String(e.data||'');"
        + "if(d.indexOf('NL_PROFILE|')!==0)return;var q=d.substring(11);"
        + "var x=new XMLHttpRequest();x.open('GET','?'+q+'&bridgeTick='+Date.now(),true);x.send();});</script>"
        + "</body></html>";
}

setMedia()
{
    if (!open || bridgeUrl == "") return;
    llSetLinkMedia(MEDIA_LINK, mediaFace(), [
        PRIM_MEDIA_CURRENT_URL, mediaUrl(),
        PRIM_MEDIA_HOME_URL, mediaUrl(),
        PRIM_MEDIA_AUTO_PLAY, TRUE,
        PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_OWNER,
        PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_OWNER,
        PRIM_MEDIA_WIDTH_PIXELS, 1024,
        PRIM_MEDIA_HEIGHT_PIXELS, 1024
    ]);
}

clearMedia()
{
    llClearLinkMedia(MEDIA_LINK, mediaFace());
}

requestProfile()
{
    ensureListen();
    llRegionSay(PROFILE_CH, "NL_PROFILE|GET|" + (string)activeUser + "|" + (string)llGetKey());
}

saveProfile(string body, key requestId)
{
    displayName = queryValue(body, "displayName");
    title = queryValue(body, "title");
    location = queryValue(body, "location");
    avatarUrl = queryValue(body, "avatarUrl");
    bio = queryValue(body, "bio");
    setup = TRUE;
    saveCache();
    setMedia();

    pendingHttp = requestId;
    pendingStarted = llGetUnixTime();
    llSetTimerEvent(1.0);

    llRegionSay(PROFILE_CH,
        "NL_PROFILE|SAVE|"
        + (string)activeUser + "|"
        + (string)llGetKey() + "|"
        + b64(displayName) + "|"
        + b64(title) + "|"
        + b64(location) + "|"
        + b64(avatarUrl) + "|"
        + b64(bio)
    );
}

resetProfile(key requestId)
{
    displayName = "";
    title = "Resident";
    location = "Camden Falls";
    avatarUrl = "";
    bio = "";
    setup = FALSE;
    clearCache();
    setMedia();

    pendingHttp = requestId;
    pendingStarted = llGetUnixTime();
    llSetTimerEvent(1.0);
    llRegionSay(PROFILE_CH, "NL_PROFILE|RESET|" + (string)activeUser + "|" + (string)llGetKey());
}

openProfile()
{
    activeUser = llGetOwner();
    open = TRUE;
    loadCache();

    if (bridgeUrl == "")
    {
        urlRequest = llRequestURL();
        return;
    }

    requestProfile();
    setMedia();
}

closeProfile()
{
    open = FALSE;
    clearMedia();
}

handleProfileReply(string msg)
{
    list p = llParseStringKeepNulls(msg, ["|"], []);
    string status;

    if (llGetListLength(p) < 4) return;
    if (llList2String(p, 0) != "NL_PROFILE_RSP") return;
    if ((key)llList2String(p, 1) != activeUser) return;
    if ((key)llList2String(p, 2) != llGetKey()) return;

    status = llList2String(p, 3);
    setup = (status != "EMPTY");

    if (llGetListLength(p) >= 9)
    {
        displayName = ub64(llList2String(p, 4));
        title = ub64(llList2String(p, 5));
        location = ub64(llList2String(p, 6));
        avatarUrl = ub64(llList2String(p, 7));
        bio = ub64(llList2String(p, 8));
    }

    if (!setup)
    {
        displayName = "";
        title = "Resident";
        location = "Camden Falls";
        avatarUrl = "";
        bio = "";
        clearCache();
    }
    else
    {
        saveCache();
    }

    if (pendingHttp != NULL_KEY)
    {
        llHTTPResponse(pendingHttp, 200, status);
        pendingHttp = NULL_KEY;
        llSetTimerEvent(0.0);
    }

    setMedia();
}

handleMediaCommand(string query, key requestId)
{
    string op = queryValue(query, "op");

    if (op == "profile.refresh")
    {
        requestProfile();
        llHTTPResponse(requestId, 202, "REFRESHING");
        return;
    }

    if (op == "profile.save")
    {
        saveProfile(query, requestId);
        return;
    }

    if (op == "profile.reset")
    {
        resetProfile(requestId);
        return;
    }

    if (op == "profile.close")
    {
        closeProfile();
        llHTTPResponse(requestId, 200, "CLOSED");
        return;
    }

    llHTTPResponse(requestId, 400, "Unknown profile op");
}

default
{
    state_entry()
    {
        activeUser = llGetOwner();
        loadCache();
        ensureListen();
        closeProfile();
        llOwnerSay(DISPLAY_TITLE + " online | Build " + (string)BUILD_NUMBER + " | closed by default");
    }

    attach(key id)
    {
        activeUser = id;
        if (id != NULL_KEY) loadCache();
        closeProfile();
    }

    on_rez(integer startParam)
    {
        llResetScript();
    }

    touch_start(integer total)
    {
        if (llDetectedKey(0) != llGetOwner()) return;
        if (open) closeProfile();
        else openProfile();
    }

    http_request(key requestId, string method, string body)
    {
        string query;

        if (requestId == urlRequest)
        {
            if (method == URL_REQUEST_GRANTED)
            {
                bridgeUrl = body;
                loadCache();
                setMedia();
                requestProfile();
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
            if (queryValue(query, "op") == "")
            {
                llSetContentType(requestId, CONTENT_TYPE_HTML);
                llHTTPResponse(requestId, 200, wrapperHtml());
                return;
            }

            handleMediaCommand(query, requestId);
            return;
        }

        llHTTPResponse(requestId, 405, "Method not allowed");
    }

    listen(integer channel, string name, key id, string msg)
    {
        if (channel == PROFILE_CH) handleProfileReply(msg);
    }

    timer()
    {
        if (pendingHttp != NULL_KEY && llGetUnixTime() - pendingStarted >= HTTP_TIMEOUT)
        {
            llHTTPResponse(pendingHttp, 504, "Profile server timeout");
            pendingHttp = NULL_KEY;
            llSetTimerEvent(0.0);
        }
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
        if (change & CHANGED_REGION_START)
        {
            bridgeUrl = "";
            if (open) openProfile();
        }
    }
}

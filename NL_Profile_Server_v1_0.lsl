// =====================================================
// Neuro-Link Profile Server v1.0
// Stores profile records by avatar UUID in SL linkset data.
//
// Drop this into the in-world Neuro/Profile server object.
// The HUD bridge talks to it on PROFILE_CH.
// =====================================================

string DISPLAY_TITLE = "Neuro-Link Profile Server";
integer PROFILE_CH = -73463311;
integer BUILD_NUMBER = 1;

integer listenHandle;

string keyName(key avatar)
{
    return "NL_PROFILE:" + (string)avatar;
}

string packProfile(string displayName, string title, string location, string avatarUrl, string bio)
{
    return llList2Json(JSON_OBJECT, [
        "displayName", displayName,
        "title", title,
        "location", location,
        "avatarUrl", avatarUrl,
        "bio", bio,
        "updated", (string)llGetUnixTime()
    ]);
}

string enc(string value)
{
    return llStringToBase64(value);
}

string dec(string value)
{
    return llBase64ToString(value);
}

reply(key bridge, key avatar, string status, string packed)
{
    string displayName = "";
    string title = "";
    string location = "";
    string avatarUrl = "";
    string bio = "";

    if (packed != "")
    {
        displayName = llJsonGetValue(packed, ["displayName"]);
        title = llJsonGetValue(packed, ["title"]);
        location = llJsonGetValue(packed, ["location"]);
        avatarUrl = llJsonGetValue(packed, ["avatarUrl"]);
        bio = llJsonGetValue(packed, ["bio"]);
    }

    llRegionSayTo(bridge, PROFILE_CH,
        "NL_PROFILE_RSP|"
        + (string)avatar + "|"
        + (string)bridge + "|"
        + status + "|"
        + enc(displayName) + "|"
        + enc(title) + "|"
        + enc(location) + "|"
        + enc(avatarUrl) + "|"
        + enc(bio)
    );
}

handleMessage(key sender, string msg)
{
    list p = llParseStringKeepNulls(msg, ["|"], []);
    string cmd;
    key avatar;
    key bridge;
    string packed;

    if (llGetListLength(p) < 4) return;
    if (llList2String(p, 0) != "NL_PROFILE") return;

    cmd = llList2String(p, 1);
    avatar = (key)llList2String(p, 2);
    bridge = (key)llList2String(p, 3);

    if (avatar == NULL_KEY || bridge == NULL_KEY) return;

    if (cmd == "GET")
    {
        packed = llLinksetDataRead(keyName(avatar));
        if (packed == "") reply(bridge, avatar, "EMPTY", "");
        else reply(bridge, avatar, "FOUND", packed);
        return;
    }

    if (cmd == "SAVE")
    {
        if (llGetListLength(p) < 9) return;
        packed = packProfile(
            dec(llList2String(p, 4)),
            dec(llList2String(p, 5)),
            dec(llList2String(p, 6)),
            dec(llList2String(p, 7)),
            dec(llList2String(p, 8))
        );
        llLinksetDataWrite(keyName(avatar), packed);
        reply(bridge, avatar, "SAVED", packed);
        return;
    }

    if (cmd == "RESET")
    {
        llLinksetDataDelete(keyName(avatar));
        reply(bridge, avatar, "EMPTY", "");
    }
}

default
{
    state_entry()
    {
        if (listenHandle) llListenRemove(listenHandle);
        listenHandle = llListen(PROFILE_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " online | Build " + (string)BUILD_NUMBER);
    }

    listen(integer channel, string name, key id, string msg)
    {
        if (channel == PROFILE_CH) handleMessage(id, msg);
    }
}

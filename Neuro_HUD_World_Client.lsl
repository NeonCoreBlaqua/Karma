// Neuro HUD World Client v0.1
// Drop into the Neuro-Link HUD linkset.
// Listens for Camden Falls World Server signals and forwards them internally.
// Other HUD scripts can listen for:
//   llMessageLinked(LINK_SET, 0, "NL_WORLD_ALERT|" + json, avatarKey);

integer NEURO_HUD_CHANNEL = -73463303;
string CDF_TOKEN = "CDF_WORLD_V1";

integer MAX_ALERTS = 12;
string K_WORLD_ALERTS = "NL_WORLD_ALERTS";

integer gListen;

integer validSignal(string message)
{
    if (llJsonGetValue(message, ["token"]) != CDF_TOKEN) return FALSE;
    if (llJsonGetValue(message, ["source"]) != "camden.falls.world.server") return FALSE;
    if (llJsonGetValue(message, ["title"]) == JSON_INVALID) return FALSE;
    if (llJsonGetValue(message, ["message"]) == JSON_INVALID) return FALSE;
    return TRUE;
}

integer isForOwner(string message)
{
    string payload = llJsonGetValue(message, ["payload"]);
    string avatar = llJsonGetValue(payload, ["avatar"]);
    string className = llJsonGetValue(message, ["class"]);

    if (avatar == (string)llGetOwner()) return TRUE;
    if (avatar == "" || avatar == (string)NULL_KEY || avatar == JSON_INVALID)
    {
        // Public/system events are allowed through.
        return TRUE;
    }

    // Presence for other avatars should not become this owner's personal alert.
    if (className == "presence") return FALSE;

    return FALSE;
}

storeAlert(string message)
{
    string current = llLinksetDataRead(K_WORLD_ALERTS);
    list alerts;

    if (current != "")
    {
        alerts = llJson2List(current);
    }

    alerts += [message];
    while (llGetListLength(alerts) > MAX_ALERTS)
    {
        alerts = llDeleteSubList(alerts, 0, 0);
    }

    llLinksetDataWrite(K_WORLD_ALERTS, llList2Json(JSON_ARRAY, alerts));
}

default
{
    state_entry()
    {
        gListen = llListen(NEURO_HUD_CHANNEL, "", NULL_KEY, "");
    }

    listen(integer channel, string name, key id, string message)
    {
        if (!validSignal(message)) return;
        if (!isForOwner(message)) return;

        storeAlert(message);
        llMessageLinked(LINK_SET, 0, "NL_WORLD_ALERT|" + message, llGetOwner());
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }
}


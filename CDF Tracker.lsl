// CDF Tracker v0.1
// Region collector for Breadcrumb and Neurons events.
// Put one tracker in the Camden Falls region. It validates and forwards events
// to the Camden Falls World Server.

integer CDF_TRACKER_CHANNEL = -73463301;
integer CDF_SERVER_CHANNEL = -73463302;
integer COMMAND_CHANNEL = 77;
string CDF_TOKEN = "CDF_WORLD_V1";

integer REQUIRE_SAME_GROUP = TRUE;
integer MAX_CACHE = 80;

integer gListenTracker;
integer gListenCommand;
list gBreadcrumbs;
list gNeurons;
integer gForwarded;
integer gRejected;

integer validPayload(string message)
{
    if (llJsonGetValue(message, ["token"]) != CDF_TOKEN) return FALSE;
    if (llJsonGetValue(message, ["source"]) == JSON_INVALID) return FALSE;
    if (llJsonGetValue(message, ["event"]) == JSON_INVALID) return FALSE;
    return TRUE;
}

integer allowedSender(key sender)
{
    if (!REQUIRE_SAME_GROUP) return TRUE;
    return llSameGroup(sender);
}

cacheUnique(string value, integer isNeuron)
{
    if (value == "" || value == (string)NULL_KEY) return;

    if (isNeuron)
    {
        if (llListFindList(gNeurons, [value]) == -1) gNeurons += [value];
        if (llGetListLength(gNeurons) > MAX_CACHE) gNeurons = llDeleteSubList(gNeurons, 0, 0);
    }
    else
    {
        if (llListFindList(gBreadcrumbs, [value]) == -1) gBreadcrumbs += [value];
        if (llGetListLength(gBreadcrumbs) > MAX_CACHE) gBreadcrumbs = llDeleteSubList(gBreadcrumbs, 0, 0);
    }
}

forwardToServer(string payload, key sender)
{
    string wrapped = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "cdf.tracker",
        "tracker", (string)llGetKey(),
        "sender", (string)sender,
        "payload", payload,
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_SERVER_CHANNEL, wrapped);
    ++gForwarded;
}

status(key avatar)
{
    llRegionSayTo(avatar, 0,
        "CDF Tracker"
        + "\nBreadcrumbs: " + (string)llGetListLength(gBreadcrumbs)
        + "\nNeurons: " + (string)llGetListLength(gNeurons)
        + "\nForwarded: " + (string)gForwarded
        + "\nRejected: " + (string)gRejected
    );
}

default
{
    state_entry()
    {
        gListenTracker = llListen(CDF_TRACKER_CHANNEL, "", NULL_KEY, "");
        gListenCommand = llListen(COMMAND_CHANNEL, "", llGetOwner(), "");
        llOwnerSay("CDF Tracker online. Listening for Breadcrumbs and Neurons.");
    }

    listen(integer channel, string name, key id, string message)
    {
        if (channel == COMMAND_CHANNEL)
        {
            if (llToLower(message) == "cdf tracker status") status(id);
            return;
        }

        if (!validPayload(message) || !allowedSender(id))
        {
            ++gRejected;
            return;
        }

        string source = llJsonGetValue(message, ["source"]);
        string objectKey = llJsonGetValue(message, ["objectKey"]);
        string avatar = llJsonGetValue(message, ["avatar"]);

        if (source == "breadcrumb") cacheUnique(objectKey, FALSE);
        if (source == "neurons") cacheUnique(avatar, TRUE);

        forwardToServer(message, id);
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }
}

// Camden Falls World Server v0.1
// Receives validated CDF Tracker events and produces Neuro-ready signals.
// This is the in-world server scaffold. Later it can forward to an external
// database/API, but the event contract starts here.

integer CDF_SERVER_CHANNEL = -73463302;
integer NEURO_HUD_CHANNEL = -73463303;
integer COMMAND_CHANNEL = 77;
string CDF_TOKEN = "CDF_WORLD_V1";

integer MAX_EVENTS = 60;

integer gListenServer;
integer gListenCommand;
list gRecentEvents;
integer gReceived;
integer gRejected;

integer validTrackerPayload(string message)
{
    if (llJsonGetValue(message, ["token"]) != CDF_TOKEN) return FALSE;
    if (llJsonGetValue(message, ["source"]) != "cdf.tracker") return FALSE;
    if (llJsonGetValue(message, ["payload"]) == JSON_INVALID) return FALSE;
    return TRUE;
}

string innerPayload(string trackerPayload)
{
    return llJsonGetValue(trackerPayload, ["payload"]);
}

string classify(string payload)
{
    string eventName = llJsonGetValue(payload, ["event"]);
    string typeName = llJsonGetValue(payload, ["type"]);
    string lowerEvent = llToLower(eventName);

    if (llSubStringIndex(lowerEvent, "rent") != -1 || typeName == "rent") return "housing";
    if (
        typeName == "wallet"
        || typeName == "vendor"
        || typeName == "tip"
        || typeName == "payout"
        || llSubStringIndex(lowerEvent, "gcoin") != -1
        || llSubStringIndex(lowerEvent, "pay") != -1
        || llSubStringIndex(lowerEvent, "purchase") != -1
        || llSubStringIndex(lowerEvent, "payout") != -1
        || llSubStringIndex(lowerEvent, "tip") != -1
    ) return "wallet";
    if (typeName == "work") return "job";
    if (typeName == "food" || typeName == "drink" || typeName == "bed" || typeName == "shower" || typeName == "bath") return "care";
    if (llJsonGetValue(payload, ["source"]) == "neurons") return "presence";
    return "notification";
}

string titleForClass(string className)
{
    if (className == "housing") return "Housing";
    if (className == "wallet") return "Wallet";
    if (className == "job") return "Job";
    if (className == "care") return "Care";
    if (className == "presence") return "Presence";
    return "System";
}

string messageForPayload(string payload)
{
    string label = llJsonGetValue(payload, ["label"]);
    string eventName = llJsonGetValue(payload, ["event"]);
    string detail = llJsonGetValue(payload, ["detail"]);

    if (label == JSON_INVALID || label == "") label = "Camden Falls";
    if (detail == JSON_INVALID || detail == "") detail = eventName;

    return label + ": " + detail;
}

storeEvent(string payload)
{
    gRecentEvents += [payload];
    if (llGetListLength(gRecentEvents) > MAX_EVENTS)
    {
        gRecentEvents = llDeleteSubList(gRecentEvents, 0, 0);
    }
}

broadcastNeuroSignal(string payload)
{
    string className = classify(payload);
    string signal = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "camden.falls.world.server",
        "class", className,
        "title", titleForClass(className),
        "message", messageForPayload(payload),
        "payload", payload,
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(NEURO_HUD_CHANNEL, signal);
}

status(key avatar)
{
    llRegionSayTo(avatar, 0,
        "Camden Falls World Server"
        + "\nReceived: " + (string)gReceived
        + "\nRejected: " + (string)gRejected
        + "\nRecent Events: " + (string)llGetListLength(gRecentEvents)
    );
}

default
{
    state_entry()
    {
        gListenServer = llListen(CDF_SERVER_CHANNEL, "", NULL_KEY, "");
        gListenCommand = llListen(COMMAND_CHANNEL, "", llGetOwner(), "");
        llOwnerSay("Camden Falls World Server online.");
    }

    listen(integer channel, string name, key id, string message)
    {
        if (channel == COMMAND_CHANNEL)
        {
            if (llToLower(message) == "cdf server status") status(id);
            return;
        }

        if (!validTrackerPayload(message))
        {
            ++gRejected;
            return;
        }

        string payload = innerPayload(message);
        storeEvent(payload);
        broadcastNeuroSignal(payload);
        ++gReceived;
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }
}

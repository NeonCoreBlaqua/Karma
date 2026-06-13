// Neurons v0.1
// Wear this script in an attachment. It announces the avatar to the CDF Tracker.
// Breadcrumbs report object use; Neurons identify participating avatars.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";
integer HEARTBEAT_SECONDS = 120;

sendNeuronEvent(string eventName, string detail)
{
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "neurons",
        "event", eventName,
        "avatar", (string)llGetOwner(),
        "displayName", llGetDisplayName(llGetOwner()),
        "legacyName", llKey2Name(llGetOwner()),
        "attachment", (string)llGetKey(),
        "detail", detail,
        "region", llGetRegionName(),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

default
{
    state_entry()
    {
        sendNeuronEvent("neuron.online", "state_entry");
        llSetTimerEvent((float)HEARTBEAT_SECONDS);
    }

    attach(key id)
    {
        if (id)
        {
            sendNeuronEvent("neuron.online", "attached");
            llSetTimerEvent((float)HEARTBEAT_SECONDS);
        }
        else
        {
            sendNeuronEvent("neuron.offline", "detached");
            llSetTimerEvent(0.0);
        }
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }

    timer()
    {
        sendNeuronEvent("neuron.heartbeat", "alive");
    }
}


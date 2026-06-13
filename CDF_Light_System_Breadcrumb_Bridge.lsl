// CDF Light System Breadcrumb Bridge v0.1
// Drop into Camden Falls light switches, scanners, or light controllers.
// Listens to existing Camden light channels and reports public world activity.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

integer STREET_CHANNEL = -20260525;
integer HOME_BUSINESS_CHANNEL = -20260523;
integer UPDATE_CHANNEL = -202605;
integer HEARTBEAT_SECONDS = 300;

integer nextHeartbeat;

sendLightEvent(string eventName, key avatar, string detail, string systemName)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", "world.light",
        "label", llGetObjectName(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "light.system", systemName,
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

string cleanCommand(string message)
{
    list p = llParseStringKeepNulls(message, ["|"], []);
    string command = llList2String(p, 1);
    string value = llList2String(p, 2);
    if (value != "") return command + " " + value;
    return command;
}

default
{
    state_entry()
    {
        llListen(STREET_CHANNEL, "", NULL_KEY, "");
        llListen(HOME_BUSINESS_CHANNEL, "", NULL_KEY, "");
        llListen(UPDATE_CHANNEL, "", NULL_KEY, "");
        sendLightEvent("breadcrumb.register", NULL_KEY, "light bridge online", "light");
        nextHeartbeat = llGetUnixTime() + HEARTBEAT_SECONDS;
        llSetTimerEvent(30.0);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
    }

    listen(integer channel, string name, key id, string message)
    {
        if (channel == STREET_CHANNEL)
        {
            if (llSubStringIndex(message, "CAMDEN_STREET_STATUS|") == 0)
            {
                sendLightEvent("light.street.status", NULL_KEY, message, "street");
                return;
            }

            if (llSubStringIndex(message, "CAMDEN_STREET|") == 0)
            {
                sendLightEvent("light.street.command", id, cleanCommand(message), "street");
                return;
            }
        }

        if (channel == HOME_BUSINESS_CHANNEL)
        {
            sendLightEvent("light.home_business.command", id, message, "home_business");
            return;
        }

        if (channel == UPDATE_CHANNEL)
        {
            if (llSubStringIndex(message, "CAMDEN_LIGHT_VERSION|") == 0)
            {
                sendLightEvent("light.update.version", NULL_KEY, message, "street");
            }
            else if (message == "CAMDEN_LIGHT_PING")
            {
                sendLightEvent("light.update.scan", id, "Street light scan ping", "street");
            }
        }
    }

    timer()
    {
        if (llGetUnixTime() >= nextHeartbeat)
        {
            sendLightEvent("breadcrumb.heartbeat", NULL_KEY, "light alive", "light");
            nextHeartbeat = llGetUnixTime() + HEARTBEAT_SECONDS;
        }
    }
}

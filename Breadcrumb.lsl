// Breadcrumb v0.1
// Drop into Camden Falls objects that should report world activity to Neuro.
// Breadcrumbs do not track avatars by themselves; they report object use.
// Avatars that participate should wear Neurons.lsl.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

// Configure per object before dropping the script in.
string BREADCRUMB_TYPE = "generic"; // food, bed, couch, bath, shower, drink, work, rent, dispenser, vendor
string BREADCRUMB_LABEL = "";
integer HEARTBEAT_SECONDS = 300;

string safeLabel()
{
    if (BREADCRUMB_LABEL != "") return BREADCRUMB_LABEL;
    return llGetObjectName();
}

sendEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", BREADCRUMB_TYPE,
        "label", safeLabel(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

default
{
    state_entry()
    {
        sendEvent("breadcrumb.register", NULL_KEY, "online");
        llSetTimerEvent((float)HEARTBEAT_SECONDS);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    touch_start(integer total_number)
    {
        integer i;
        for (i = 0; i < total_number; ++i)
        {
            sendEvent("object.used", llDetectedKey(i), "touch");
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
        sendEvent("breadcrumb.heartbeat", NULL_KEY, "alive");
    }
}


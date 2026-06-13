// Breadcrumb Furniture Auto v0.1
// Drop into beds, couches, chairs, baths, tubs, showers, or similar furniture.
// Reports furniture use to CDF Tracker.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

// Configure per furniture object.
string FURNITURE_LABEL = "";
string FURNITURE_TYPE = "furniture"; // bed, couch, chair, bath, tub, shower
integer REST_VALUE = 15;
integer COMFORT_VALUE = 10;
integer HEARTBEAT_SECONDS = 300;

string safeLabel()
{
    if (FURNITURE_LABEL != "") return FURNITURE_LABEL;
    return llGetObjectName();
}

sendFurnitureEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", FURNITURE_TYPE,
        "label", safeLabel(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "stat.rest", (string)REST_VALUE,
        "stat.comfort", (string)COMFORT_VALUE,
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
        sendFurnitureEvent("breadcrumb.register", NULL_KEY, FURNITURE_TYPE + " online");
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
            sendFurnitureEvent("furniture.used", llDetectedKey(i), "auto use");
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
        sendFurnitureEvent("breadcrumb.heartbeat", NULL_KEY, FURNITURE_TYPE + " alive");
    }
}


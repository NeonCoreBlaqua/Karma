// Breadcrumb Product Auto v0.1
// Drop into products such as meds, fem products, dispensers, or vendor-given items.
// Reports product use to CDF Tracker.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

// Configure per product.
string PRODUCT_LABEL = "";
string PRODUCT_TYPE = "product"; // meds, fem, hygiene, wellness, dispenser
integer HEALTH_VALUE = 10;
integer CARE_VALUE = 10;
integer CONSUME_ON_TOUCH = FALSE;
integer HEARTBEAT_SECONDS = 300;

string safeLabel()
{
    if (PRODUCT_LABEL != "") return PRODUCT_LABEL;
    return llGetObjectName();
}

sendProductEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", PRODUCT_TYPE,
        "label", safeLabel(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "stat.health", (string)HEALTH_VALUE,
        "stat.care", (string)CARE_VALUE,
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
        sendProductEvent("breadcrumb.register", NULL_KEY, PRODUCT_TYPE + " online");
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
            key avatar = llDetectedKey(i);
            sendProductEvent("product.used", avatar, "auto use");
            llRegionSayTo(avatar, 0, safeLabel() + " used.");
        }

        if (CONSUME_ON_TOUCH)
        {
            llDie();
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
        sendProductEvent("breadcrumb.heartbeat", NULL_KEY, PRODUCT_TYPE + " alive");
    }
}


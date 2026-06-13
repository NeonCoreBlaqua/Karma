// Breadcrumb Food Auto v0.1
// Drop into food or drink objects.
// Sends two Neuro stats: hunger and thirst.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

// Configure per item.
string FOOD_LABEL = "";
integer HUNGER_VALUE = 20;
integer THIRST_VALUE = 0;
integer CONSUME_ON_TOUCH = FALSE;
integer HEARTBEAT_SECONDS = 300;

string safeLabel()
{
    if (FOOD_LABEL != "") return FOOD_LABEL;
    return llGetObjectName();
}

sendFoodEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", "food",
        "label", safeLabel(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "stat.hunger", (string)HUNGER_VALUE,
        "stat.thirst", (string)THIRST_VALUE,
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
        sendFoodEvent("breadcrumb.register", NULL_KEY, "food online");
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
            sendFoodEvent("food.used", avatar, "auto use");
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
        sendFoodEvent("breadcrumb.heartbeat", NULL_KEY, "food alive");
    }
}


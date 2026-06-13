// =====================================================
// G Coin Workforce Global Manager
// Build 20401 + Neuro Breadcrumb Bridge
//
// One in-world manager for all workforce kiosks in the region.
// Enforces one active shift per avatar across separate kiosk objects.
// Emits workforce events to CDF Tracker.
// =====================================================

string DISPLAY_TITLE = "G Coin Workforce Global Manager";
integer BUILD_NUMBER = 20401;
integer WF_GLOBAL_CH = -9869871;

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

string K_GLOBAL_SHIFT = "GWF_GLOBAL_SHIFT_";

string keyGlobalShift(key id)
{
    return K_GLOBAL_SHIFT + (string)id;
}

sendWorkEvent(string eventName, key avatar, key kiosk, string biz, string bname)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", "work",
        "label", bname,
        "objectKey", (string)kiosk,
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", biz,
        "work.businessId", biz,
        "work.businessName", bname,
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
        llListen(WF_GLOBAL_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " online | Build " + (string)BUILD_NUMBER + " | Neuro breadcrumbs active");
    }

    listen(integer ch, string name, key sender, string msg)
    {
        if (ch != WF_GLOBAL_CH) return;

        list p = llParseStringKeepNulls(msg, ["|"], []);
        string cmd = llList2String(p, 0);

        if (cmd == "REQ_CLOCKIN")
        {
            if (llGetListLength(p) < 5) return;

            key kiosk = (key)llList2String(p, 1);
            key user = (key)llList2String(p, 2);
            string biz = llList2String(p, 3);
            string bname = llList2String(p, 4);

            string existing = llLinksetDataRead(keyGlobalShift(user));
            if (existing != "")
            {
                list e = llParseStringKeepNulls(existing, ["|"], []);
                string ebiz = llList2String(e, 0);
                string ebname = llList2String(e, 1);
                llRegionSay(WF_GLOBAL_CH, "RSP_CLOCKIN|" + (string)kiosk + "|" + (string)user + "|BUSY|" + ebiz + "|" + ebname);
                return;
            }

            llLinksetDataWrite(keyGlobalShift(user), biz + "|" + bname + "|" + (string)kiosk + "|" + (string)llGetUnixTime());
            llRegionSay(WF_GLOBAL_CH, "RSP_CLOCKIN|" + (string)kiosk + "|" + (string)user + "|OK|" + biz + "|" + bname);
            sendWorkEvent("work.clockin", user, kiosk, biz, bname);
            return;
        }

        if (cmd == "REQ_STATUS")
        {
            if (llGetListLength(p) < 3) return;

            key kioskStatus = (key)llList2String(p, 1);
            key userStatus = (key)llList2String(p, 2);

            string active = llLinksetDataRead(keyGlobalShift(userStatus));
            if (active != "")
            {
                list a = llParseStringKeepNulls(active, ["|"], []);
                llRegionSay(WF_GLOBAL_CH, "RSP_STATUS|" + (string)kioskStatus + "|" + (string)userStatus + "|BUSY|" + llList2String(a, 0) + "|" + llList2String(a, 1));
                return;
            }

            llRegionSay(WF_GLOBAL_CH, "RSP_STATUS|" + (string)kioskStatus + "|" + (string)userStatus + "|OK||");
            return;
        }

        if (cmd == "CLOCKOUT" || cmd == "QUIT")
        {
            if (llGetListLength(p) < 3) return;
            key user2 = (key)llList2String(p, 1);
            string biz2 = llList2String(p, 2);
            string raw = llLinksetDataRead(keyGlobalShift(user2));
            if (raw == "") return;

            list r = llParseStringKeepNulls(raw, ["|"], []);
            if (llList2String(r, 0) == biz2)
            {
                llLinksetDataDelete(keyGlobalShift(user2));
                sendWorkEvent("work.clockout", user2, (key)llList2String(r, 2), biz2, llList2String(r, 1));
            }
            return;
        }

        if (cmd == "CLEAR_USER")
        {
            if (llGetListLength(p) < 2) return;
            key user3 = (key)llList2String(p, 1);
            llLinksetDataDelete(keyGlobalShift(user3));
            sendWorkEvent("work.clear", user3, NULL_KEY, "", "Workforce");
            return;
        }
    }
}


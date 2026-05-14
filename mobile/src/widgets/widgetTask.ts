import React from "react";
import { Linking } from "react-native";
import { registerWidgetTaskHandler, requestWidgetUpdate } from "react-native-android-widget";
import { RotinaWidget } from "./RotinaWidget";
import { loadWidgetData } from "../services/widgetData";

const FALLBACK_DATA = {
  userName: "usuario",
  streakDays: 0,
  completionRate: 0,
  reminders: [] as Array<{ time: string; title: string; done: boolean }>,
};

async function widgetTaskHandler(props: any) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = (await loadWidgetData()) ?? FALLBACK_DATA;

      await requestWidgetUpdate({
        widgetName: "RotinaWidget",
        renderWidget: () => React.createElement(RotinaWidget, data),
        widgetNotFound: () => {},
      });
      break;
    }

    case "WIDGET_CLICK": {
      if (props.clickAction === "OPEN_APP") {
        Linking.openURL("rotinaai://").catch(() => {});
      }
      break;
    }

    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);

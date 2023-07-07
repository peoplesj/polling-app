import { Trigger } from "deno-slack-api/types.ts";
import PollingWorkflow from "../workflows/polling_workflow.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/future/triggers
 */
const pollingTrigger: Trigger<typeof PollingWorkflow.definition> = {
  type: "shortcut",
  name: "Start a poll",
  description: "Start a poll in a selected channel",
  workflow: "#/workflows/polling_workflow",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
    channel: {
      value: "{{data.channel_id}}",
    },
  },
};

export default pollingTrigger;

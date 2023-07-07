import { Manifest } from "deno-slack-sdk/mod.ts";
import PollingWorkflow from "./workflows/polling_workflow.ts";
import { PollingFunctionDefinition } from "./functions/polling_function.ts";
import { PollResultsDatastore } from "./datastores/polling_datastore.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/future/manifest
 */
export default Manifest({
  name: "polling-app",
  description: "Create a poll and vote on the options",
  icon: "assets/default_new_app_icon.png",
  functions: [PollingFunctionDefinition],
  workflows: [PollingWorkflow],
  datastores: [PollResultsDatastore],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "reactions:write",
    "reactions:read",
    "datastore:read",
    "datastore:write",
  ],
});

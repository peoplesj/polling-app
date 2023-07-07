import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const PollResultsDatastore = DefineDatastore({
  name: "poll_results",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    creator: { type: Schema.slack.types.user_id },
    question: { type: Schema.types.string },
    responses: { type: Schema.types.string },
  },
});

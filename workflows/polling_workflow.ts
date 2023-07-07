import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { PollingFunctionDefinition } from "../functions/polling_function.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/future/workflows
 */
const PollingWorkflow = DefineWorkflow({
  callback_id: "polling_workflow",
  title: "Start a poll",
  description: "Start a poll in a selected channel",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: [],
  },
});

/**
 * For collecting input from users, we recommend the
 * built-in OpenForm function as a first step.
 * https://api.slack.com/future/functions#open-a-form
 */
const inputForm = PollingWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Start a poll",
    submit_label: "Start poll",
    interactivity: PollingWorkflow.inputs.interactivity,
    fields: {
      elements: [{
        name: "channel",
        title: "Channel to send poll to",
        type: Schema.slack.types.channel_id,
        default: PollingWorkflow.inputs.channel,
      }, {
        name: "poll_question",
        title: "Question to poll",
        type: Schema.types.string,
        long: false,
      }, {
        name: "option_1",
        title: "Option 1",
        type: Schema.types.string,
        long: false,
      }, {
        name: "option_2",
        title: "Option 2",
        type: Schema.types.string,
        long: false,
      }, {
        name: "option_3",
        title: "Option 3",
        type: Schema.types.string,
        long: false,
      }],
      required: [
        "channel",
        "poll_question",
        "option_1",
        "option_2",
        "option_3",
      ],
    },
  },
);

PollingWorkflow.addStep(
  PollingFunctionDefinition,
  {
    channel_id: inputForm.outputs.fields.channel,
    poll_question: inputForm.outputs.fields.poll_question,
    option_1: inputForm.outputs.fields.option_1,
    option_2: inputForm.outputs.fields.option_2,
    option_3: inputForm.outputs.fields.option_3,
    interactivity: inputForm.outputs.interactivity,
  },
);

export default PollingWorkflow;

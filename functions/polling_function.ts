import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/future/functions/custom
 */
export const PollingFunctionDefinition = DefineFunction({
  callback_id: "polling_function",
  title: "Generate poll",
  description: "Generate poll",
  source_file: "functions/polling_function.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Channel ID",
      },
      poll_question: {
        type: Schema.types.string,
        description: "Question to ask",
      },
      option_1: {
        type: Schema.types.string,
        description: "Option 1",
      },
      option_2: {
        type: Schema.types.string,
        description: "Option 2",
      },
      option_3: {
        type: Schema.types.string,
        description: "Option 3",
      },
    },
    required: [
      "channel_id",
      "poll_question",
      "option_1",
      "option_2",
      "option_3",
    ],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

// add this after the function definition
export default SlackFunction(
  PollingFunctionDefinition,
  async ({ client, inputs }) => {
    try {
      const {
        channel_id,
        poll_question,
        option_1,
        option_2,
        option_3,
        interactivity,
      } = inputs;

      const blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text":
              `<@${interactivity?.interactor.id}> posed the following question:`,
          },
        },
        {
          "type": "divider",
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${poll_question}*`,
          },
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": `:one:  ${option_1}`,
            "emoji": true,
          },
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": `:two:  ${option_2}`,
            "emoji": true,
          },
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": `:three:  ${option_3}`,
            "emoji": true,
          },
        },
        {
          "type": "divider",
        },
        {
          "type": "actions",
          "block_id": "actions_block",
          "elements": [
            {
              type: "button",
              text: { type: "plain_text", text: "Close poll" },
              action_id: "close_poll",
            },
          ],
        },
      ];

      // Post the poll in channel
      const msgResp = await client.chat.postMessage({
        channel: channel_id,
        blocks,
      });

      // Plant emojis to encourage measurable responses
      for (const reacji of ["one", "two", "three"]) {
        try {
          const res = await client.reactions.add({
            channel: msgResp.channel,
            timestamp: msgResp.message.ts,
            name: reacji,
          });

          if (!res.ok) throw new Error(res.error);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      return {
        error:
          `An error was encountered during poll generation: \`${err.message}\``,
      };
    }

    // IMPORTANT! Set `completed` to false in order to keep the interactivity
    // points (the approve/deny buttons) "alive"
    // We will set the function's complete state in the button handlers below.
    return { completed: false };
  },
).addBlockActionsHandler(
  "close_poll",
  async ({ client, body, inputs }) => {
    const {
      interactivity,
      channel_id,
      poll_question,
      option_1,
      option_2,
      option_3,
    } = inputs;

    try {
      const { message } = body;

      // If the user that created the poll is the same user
      // trying to close the poll..
      if (interactivity?.interactor.id === body.user.id) {
        const reacjiResults = await client.reactions.get({
          channel: channel_id,
          timestamp: message!.ts,
        });

        // Tally the results
        const results: { [key: string]: string } = {};
        ["three", "two", "one"].forEach((emoji) => {
          // deno-lint-ignore no-explicit-any
          reacjiResults.message.reactions.forEach((reacji: any) => {
            if (emoji === reacji.name) {
              // Subtract 1 from reacji count to not count bot votes
              const reacjiCountNumber = parseInt(reacji.count) - 1;
              // convert reacji count back to expected type, a string
              results[emoji] = reacjiCountNumber.toString();
            }
          });
        });

        // Update the original poll message with the results
        const updateRes = await client.chat.update({
          channel: channel_id,
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text":
                  `:tada: Poll closed! The people have spoken. When it comes to *"${poll_question}"*:`,
              },
            },
            {
              "type": "section",
              "text": {
                "type": "plain_text",
                "text": `:one:  ${option_1} - ${results.one} vote(s)`,
                "emoji": true,
              },
            },
            {
              "type": "section",
              "text": {
                "type": "plain_text",
                "text": `:two:  ${option_2} - ${results.two} vote(s)`,
                "emoji": true,
              },
            },
            {
              "type": "section",
              "text": {
                "type": "plain_text",
                "text": `:three:  ${option_3} - ${results.three} vote(s)`,
                "emoji": true,
              },
            },
          ],
          ts: message!.ts,
        });

        if (!updateRes.ok) console.error(updateRes.error);

        // Save the results to the database
        const uuid = crypto.randomUUID();
        const response = await client.apps.datastore.put({
          datastore: "poll_results",
          item: {
            id: uuid,
            creator: inputs.interactivity?.interactor.id,
            question: inputs.poll_question,
            responses: JSON.stringify(results),
          },
        });

        if (!response.ok) {
          const error = `Failed to save a row in datastore: ${response.error}`;
          return { error };
        } else {
          console.log("A new row saved:");
          console.table(response);
          return { outputs: {} };
        }
      }
    } catch (err) {
      return {
        error:
          `An error was encountered during poll closure: \`${err.message}\``,
      };
    }
  },
);

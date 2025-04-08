"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";

export async function generateEmail(context: string, prompt: string) {
  const stream = createStreamableValue();
  (async () => {
    const { textStream } = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: `
        You are a helpful AI embedded in a email client app that is used to answer questions about the emails in the inbox.
        prompt:
        ${prompt}

        context:
        ${context}
        `,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

export async function generate(input: string) {
  const stream = createStreamableValue();
  (async () => {
    console.log(input)
    const { textStream } = await streamText({
      model: openai("gpt-4-turbo"),
      prompt: `
      ALWAYS RESPOND IN PLAIN TEXT, no html or markdown.
      You are a helpful AI embedded in a email client app that is used to autocomplete sentences, similar to google gmai
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      I am writing a piece of text in a notion text editor app.
      Help me complete my train of thought here: <input>${input}</input>
      keep the tone of the text consistent with the rest of the text.
      keep the response short and sweet. Act like a copilot, finish my sentence if need be, but don’t generate a
      Do not add fluff like "I'm here to help you" or "I'm a helpful AI" or anything like that.

      Example:
      Dear Alice, I'm sorry to hear that you are feeling down.

      Output: Unfortunately, I can't help you with that.
        `,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

import { defineAgent } from "eve";
import {openai} from "@ai-sdk/openai"

export default defineAgent({
	model: openai("gpt-6-luna"),
});

import {
  analyzeMessage,
  generateAiTurn,
  isSafeAssistantText,
  type AiConversationContext,
  type AiTurnResult,
} from "@/lib/ai-assistant";

export interface AssistantRequest {
  priorPatientMessages: number;
  message: string;
  context: AiConversationContext;
  history: { sender: "PATIENT" | "AI"; content: string }[];
}

/**
 * Where a language model plugs in. The default provider is the deterministic
 * rule engine. Any other provider (e.g. one calling an LLM API server-side with
 * a key from the environment) is wrapped by `respondSafely`, which keeps
 * emergencies away from the model and rejects unsafe output.
 */
export interface AssistantProvider {
  readonly name: string;
  respond(request: AssistantRequest): Promise<AiTurnResult>;
}

export const ruleBasedProvider: AssistantProvider = {
  name: "rule-based",
  async respond({ priorPatientMessages, message, context }) {
    return generateAiTurn(priorPatientMessages, message, context);
  },
};

export function getAssistantProvider(): AssistantProvider {
  return ruleBasedProvider;
}

/**
 * Runs a provider inside the safety envelope:
 *  1. emergencies and urgent presentations never reach a model — the fixed rules answer;
 *  2. a provider's text is used only if it passes `isSafeAssistantText`
 *     (no diagnosis, drug names, doses or medication changes);
 *  3. any provider failure falls back to the fixed rules.
 */
export async function respondSafely(provider: AssistantProvider, request: AssistantRequest): Promise<AiTurnResult> {
  const fallback = () => generateAiTurn(request.priorPatientMessages, request.message, request.context);

  const { urgency } = analyzeMessage(request.message);
  if (urgency === "EMERGENCY" || urgency === "HIGH" || provider === ruleBasedProvider) return fallback();

  try {
    const turn = await provider.respond(request);
    return isSafeAssistantText(turn.reply) ? turn : fallback();
  } catch {
    return fallback();
  }
}

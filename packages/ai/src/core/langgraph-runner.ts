import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import type { BaseAgentState } from "./base-state";

interface BoundedAgentGraphOptions<TState extends BaseAgentState> {
  name: string;
  initialState: TState;
  validateScope: (state: TState) => TState;
  run: (state: TState) => Promise<TState> | TState;
  handleError: (state: TState) => TState;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown agent graph error.";
}

export async function runBoundedAgentGraph<TState extends BaseAgentState>({
  name,
  initialState,
  validateScope,
  run,
  handleError,
}: BoundedAgentGraphOptions<TState>): Promise<TState> {
  const GraphState = Annotation.Root({
    state: Annotation<TState>(),
  });

  type WrappedState = typeof GraphState.State;

  const graph = new StateGraph(GraphState)
    .addNode("validate_scope", (input: WrappedState) => {
      try {
        return { state: validateScope(input.state) };
      } catch (error) {
        return {
          state: {
            ...input.state,
            error: toErrorMessage(error),
            updated_at: new Date().toISOString(),
          },
        };
      }
    })
    .addNode("run", async (input: WrappedState) => ({ state: await run(input.state) }))
    .addNode("handle_error", (input: WrappedState) => ({ state: handleError(input.state) }))
    .addEdge(START, "validate_scope")
    .addConditionalEdges(
      "validate_scope",
      (input: WrappedState) => (input.state.error && !input.state.final_output ? "handle_error" : "run"),
      { handle_error: "handle_error", run: "run" }
    )
    .addConditionalEdges(
      "run",
      (input: WrappedState) => (input.state.error && !input.state.final_output ? "handle_error" : "end"),
      { handle_error: "handle_error", end: END }
    )
    .addEdge("handle_error", END)
    .compile({ checkpointer: new MemorySaver(), name });

  const result = await graph.invoke(
    { state: initialState },
    { configurable: { thread_id: initialState.thread_id } }
  );

  return result.state;
}

/** Transforms the graph state while traversing an edge. */

export type StateMapping<TState extends object> = (state: TState) => TState

/** Shared identity mapping used when an edge does not declare a transformation. */
export const identityMapping = <TState extends object>(state: TState): TState => state

export function isIdentityMapping<TState extends object>(
    mapping: StateMapping<TState>
): boolean {
    return mapping === (identityMapping as StateMapping<TState>)
}

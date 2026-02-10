import type { FlowType } from '@fluxpolis/types';
import type { IFluxHandler } from './IFluxHandler';

/**
 * Registry for flux handlers, mapping flow types to their implementations.
 * Provides O(1) dispatch for fill/deliver operations.
 */
export class FluxHandlerRegistry {
	private handlers = new Map<FlowType, IFluxHandler>();

	/**
	 * Register a handler for a specific flow type
	 */
	register(flowType: FlowType, handler: IFluxHandler): void {
		this.handlers.set(flowType, handler);
	}

	/**
	 * Get handler for a flow type
	 */
	get(flowType: FlowType): IFluxHandler | undefined {
		return this.handlers.get(flowType);
	}

	/**
	 * Check if handler exists for a flow type
	 */
	has(flowType: FlowType): boolean {
		return this.handlers.has(flowType);
	}
}

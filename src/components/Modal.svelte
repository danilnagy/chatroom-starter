<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let title = '';
	export let showHeader = false;

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={handleOverlayClick}>
		<div class="modal-container">
			<div class="modal-content">
				{#if showHeader}<div class="modal-header">
						<h2>{title}</h2>
						<button class="modal-close" on:click={closeModal}>&times;</button>
					</div>
				{/if}
				<div class="modal-body">
					<slot></slot>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		cursor: pointer;
		/* backdrop-filter: blur(2px); */
	}
	.modal-container {
		background-color: black;
		color: white;
		overflow: clip;
		width: 800px;
		max-width: 800px;
		margin: 0 auto;
		cursor: auto;
	}
	.modal-content {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: -1rem;
	}

	.modal-header h2 {
		margin: 0;
	}

	.modal-close {
		background: none;
		color: white;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
	}

	@media (max-width: 700px) {
		.modal-container {
			max-width: 100vw;
		}
		.modal-content {
			padding: 2rem 1rem;
		}
	}
</style>

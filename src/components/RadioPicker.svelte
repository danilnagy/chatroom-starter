<script lang="ts">
	export let options: string[] = [];
	export let selectedIndex = -1;
</script>

<div>
	<form class="rating-form">
		{#each options as option, index}
			<label>
				<input
					type="radio"
					name="options"
					bind:group={selectedIndex}
					value={index}
					on:change={() => (selectedIndex = index)}
				/>
				<span class="custom-radio"></span>
				<span class="option-label">{option}</span>
			</label>
		{/each}
	</form>
</div>

<style lang="scss">
	form {
		color: white;
	}

	.rating-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.custom-radio {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 1px solid white;
		// border-radius: 50%;
		position: relative;
		cursor: pointer;
	}

	/* Hidden radio input */
	input[type='radio'] {
		display: none;
	}

	/* Filled circle when selected */
	.custom-radio::after {
		content: '';
		display: none;
		width: 8px;
		height: 8px;
		background-color: white;
		// border-radius: 50%;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	/* Show the filled circle if checked */
	input[type='radio']:checked + .custom-radio::after {
		display: block;
	}

	.option-label {
		margin-left: 12px;
		cursor: pointer;
	}
</style>

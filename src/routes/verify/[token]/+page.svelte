<script lang="ts">
	import { onMount } from 'svelte';

	import { openModal } from '../../../store/modalStore';
	import { goHome } from '../../../lib/utils';

	export let data: { email: string; registered: string } | undefined;

	onMount(() => {
		if (!data?.email) {
			goHome();
		} else if (data.registered) {
			openModal('AUTH', () => {}, goHome);
		} else {
			openModal('REGISTER', () => {}, goHome);
		}
	});
</script>

<!-- {#if data?.email}
	<p>Your email {data.email} has been successfully verified!</p>
{:else}
	<p>Invalid or expired activation link.</p>
{/if} -->

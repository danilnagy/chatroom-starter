<script lang="ts">
	import { logOut } from '../lib/auth';
	import userStore from '../store/userStore';
	import { openModal } from '../store/modalStore';
	import { reloadPage } from '../lib/utils';
	import '../app.css';

	async function handleLogOut() {
		try {
			await logOut();
			reloadPage();
		} catch (e) {
			if (e instanceof Error) {
				alert('LogOut Failed: ' + e.message);
			} else {
				alert('LogOut Failed: An unknown error occurred');
			}
		}
	}

	$: user = $userStore;
</script>

<div class="wrapper">
	<div class="container">
		<div><h2>tincann.ing</h2></div>
		{#if user}
			<div class="login-form">
				<div>{user.userName || user.email}</div>
				<button on:click={handleLogOut}>Log Out</button>
			</div>
		{:else}
			<div class="login-form">
				<div class="button-group">
					<button on:click={() => openModal(false, () => {})}><strong>Log In</strong></button>
					<span>|</span>
					<button on:click={() => openModal(true, () => {})}>Sign Up</button>
				</div>
			</div>
		{/if}
	</div>

	<slot />
</div>

<style lang="scss">
	.wrapper {
		margin: 0 2rem;
	}
	.container {
		background-color: white;
		padding: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		border-bottom: 2px solid rgba(0, 0, 0, 0.8);
		max-width: 800px;
		margin: 0 auto;
	}
	.login-form {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.button-group {
		display: flex;
		align-items: center;
		button {
			border: none;
		}
	}
	input {
		max-width: 160px;
	}

	@media (max-width: 700px) {
		.login-form {
			flex-direction: column;
		}
		.wrapper {
			margin: 0 1rem;
		}
	}

	@media (max-width: 800px) {
		.container {
			flex-direction: column;
		}
	}
</style>

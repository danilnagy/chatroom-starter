<script lang="ts">
	import { logOut } from '../lib/auth';
	import userStore from '../store/userStore';
	import { openModal } from '../store/modalStore';
	import { reloadPage } from '../lib/utils';
	import '../app.css';

	let menuOpen: boolean = false;

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

	function handleMenuToggle() {
		console.log('Menu toggle');
		menuOpen = !menuOpen;
	}

	$: user = $userStore;
</script>

<div class="wrapper">
	<div class="container">
		<div><h2>tincann.ing</h2></div>
		{#if user}
			<div class="login-form">
				<div>{user.userName || user.email}</div>
				<!-- <button on:click={handleLogOut}>Log Out</button> -->
				<button class="no-border" on:click={handleMenuToggle}>
					<div class={`${menuOpen ? 'rotate-45' : ''} trans`}>
						<!-- {#if menuOpen}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
						{:else} -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						<!-- {/if} -->
					</div>
				</button>
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
	<div class={`${menuOpen ? 'show-menu' : ''} menu`}>
		<div class="menu-content">
			<!-- <div>Change user name</div> -->
			<button class="link-dark" on:click={handleLogOut}>Log out</button>
		</div>
	</div>
	<div class={`${menuOpen ? 'show-menu' : ''} content`}><slot /></div>
</div>

<style lang="scss">
	.menu {
		position: fixed;
		top: 4px;
		left: 0;
		right: 0;
		width: 100%;
		min-height: 80px;
		max-height: 80px;
		background-color: #0e0e0e;
		color: #fff;
		text-align: center;
		transition: top 0.5s ease-in-out;
		z-index: 10;
		max-width: 800px;
		margin: 0 auto;

		.menu-content {
			height: 100%;
			padding: 1rem;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 0.5rem;
		}
	}

	.menu a {
		display: block;
		color: #fff;
		text-decoration: none;
		margin: 10px 0;
		font-size: 18px;
	}

	.menu a:hover {
		background-color: #555;
	}

	.show-menu.menu {
		top: 80px; /* Adjust this value to match the height of your top bar */
	}

	.show-menu.content {
		margin-top: 70px; /* Adjust this value to match the height of the menu */
	}

	.rotate-45 {
		transform: rotate(45deg);
	}
	.trans {
		transition: transform 0.5s;
	}
	.size-6 {
		width: 24px;
		height: 24px;
	}
	.wrapper {
		margin: 0 2rem;
	}
	.container {
		height: 48px;
		background-color: white;
		padding: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		// border-bottom: 2px solid rgba(0, 0, 0, 0.8);
		max-width: 800px;
		margin: 0 auto;
		position: relative;
		z-index: 20;
	}
	.content {
		transition: margin-top 1s;
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

<script lang="ts">
	import { logIn, logOut, signUp } from '../lib/auth';
	import userStore from '../lib/userStore';
	import '../app.css';

	let email: string = '';
	let password: string = '';
	let error = '';

	async function handleSignUp() {
		try {
			await signUp(email, password);
			email = '';
			password = '';
			error = '';
		} catch (e) {
			if (e instanceof Error) {
				alert('SignUp Failed: ' + e.message);
			} else {
				alert('SignUp Failed: An unknown error occurred');
			}
		}
	}

	async function handleLogIn() {
		try {
			await logIn(email, password);
			email = '';
			password = '';
			error = '';
		} catch (e) {
			if (e instanceof Error) {
				alert('LogIn Failed: ' + e.message);
			} else {
				alert('LogIn Failed: An unknown error occurred');
			}
		}
	}

	async function handleLogOut() {
		try {
			await logOut();
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
				<input
					type="email"
					bind:value={email}
					placeholder="Email"
					on:keyup={(event) => {
						if (event.key === 'Enter') handleLogIn();
					}}
				/>
				<input
					type="password"
					bind:value={password}
					placeholder="Password"
					on:keyup={(event) => {
						if (event.key === 'Enter') handleLogIn();
					}}
				/>
				<div class="button-group">
					<button on:click={handleLogIn}>Log In</button>
					<button on:click={handleSignUp}>Sign Up</button>
				</div>
			</div>
		{/if}
	</div>

	<slot />
</div>

<style>
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
		gap: 1rem;
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

	@media (max-width: 900px) {
		.container {
			flex-direction: column;
		}
	}
</style>

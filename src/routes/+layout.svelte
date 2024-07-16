<script lang="ts">
	import { logIn, logOut, signUp } from '../lib/auth';
	import userStore from '../lib/userStore';

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

<div>
	{#if user}
		<div class="login-form">
			<div>Welcome, {user.email}</div>
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
			<button on:click={handleLogIn}>Log In</button>
			<button on:click={handleSignUp}>Sign Up</button>
		</div>
	{/if}
</div>

<slot />

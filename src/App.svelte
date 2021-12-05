<script lang="ts">	
	import Buttons from "./components/Buttons.svelte"
</script>

<body class="t1 t1-start bg-c-blue-100 m-0">
	
	<main>
		<Buttons/>
	</main>
	
</body>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
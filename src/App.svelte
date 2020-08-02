<script>
	import Chart from "chart.xkcd-svelte";
	import chartXkcd from 'chart.xkcd';
    import "chota";
	import "chota";
	import {
		Row,
		Col,
		Container,
	} from 'svelte-chota';

	let available_types = ["pie","bar","stacked","XY","radar","line"]
	let bar_chart = {
		title: 'github stars VS patron number', // optional
		data: {
			labels: ['github stars', 'patrons'],
			datasets: [{
				data: [10, 5]
			}],
		},
		options: { // optional
			yTickCount: 2,
		},
	}
	let xy_chart = {

		title: 'Pokemon farms', //optional
		xLabel: 'Coordinate', //optional
		yLabel: 'Count', //optional
		data: {
			datasets: [{
				label: 'Pikachu',
				data: [{
					x: 3,
					y: 10
				}, {
					x: 4,
					y: 122
				}, {
					x: 10,
					y: 100
				}, {
					x: 1,
					y: 2
				}, {
					x: 2,
					y: 4
				}],
			}, {
				label: 'Squirtle',
				data: [{
					x: 3,
					y: 122
				}, {
					x: 4,
					y: 212
				}, {
					x: -3,
					y: 100
				}, {
					x: 1,
					y: 1
				}, {
					x: 1.5,
					y: 12
				}],
			}],
		},
		options: { //optional
			xTickCount: 5,
			yTickCount: 5,
			legendPosition: chartXkcd.config.positionType.upRight,

		},

	}

	let pie_chart = {
		title: 'What people think', // optional
		data: {
			labels: ['work', 'sleep', 'social'],
			datasets: [{
				data: [30, 10, 60],
			}],
		},
		options: { // optional
			innerRadius: 0,
			legendPosition: chartXkcd.config.positionType.upLeft,
		},
	}

	let stacked_chart = {
		title: 'Issues and PR Submissions',
		xLabel: 'Month',
		yLabel: 'Count',
		data: {
			labels: ['Jan', 'Feb', 'Mar', 'April', 'May'],
			datasets: [{
				label: 'Issues',
				data: [12, 19, 11, 29, 17],
			}, {
				label: 'PRs',
				data: [3, 5, 2, 4, 1],
			}, {
				label: 'Merges',
				data: [2, 3, 0, 1, 1],
			}],
		},
	}
	let radar_chart = {
		title: 'Letters in random words', // optional
		data: {
			labels: ['c', 'h', 'a', 'r', 't'],
			datasets: [{
				label: 'ccharrrt', // optional
				data: [2, 1, 1, 3, 1],
			}, {
				label: 'chhaart', // optional
				data: [1, 2, 2, 1, 1],
			}],
		},
		options: { // optional
			showLegend: true,
			dotSize: .8,
			showLabels: true,
			legendPosition: chartXkcd.config.positionType.upRight,
		},
	}
	let line_chart = {
		title: 'Monthly income of an indie developer', // optional
		xLabel: 'Month', // optional
		yLabel: '$ Dollars', // optional
		data: {
			labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
			datasets: [{
				label: 'Plan',
				data: [30, 70, 200, 300, 500, 800, 1500, 2900, 5000, 8000],
			}, {
				label: 'Reality',
				data: [0, 1, 30, 70, 80, 100, 50, 80, 40, 150],
			}],
		},
		options: { // optional
			yTickCount: 3,
			legendPosition: chartXkcd.config.positionType.upLeft
		}
	}

</script>


<main>
	<Container>
		<Row>
			<Col>
			<p>
				A svelte wrapper for <a href="https://timqian.com/chart.xkcd">Tim Qian XKCD charts</a>. To use in <a href="https://www.npmjs.com/package/chart.xkcd-svelte">svelte</a>. For bugs and suggestions please file issue <a href="https://github.com/peopledrivemecrazy/chart.xkcd-svelte">here</a>
			</p>
			
			<p>Available <code>types</code></p>
			<ul>
				{#each available_types as type }
					<li>{type}</li>
				{/each}
			</ul>


			<p>General usage in svelte</p>
			<p class="text-success">
				&lt;Chart type="<code>type</code>" <code>options</code> /&gt;
			</p>
			<p>For <code>options</code> follow <a href="https://timqian.com/chart.xkcd">xkcd.charts</a></p>
			</Col>
		</Row>
		<hr>
		<Row>
			<Col size="6">
			<Chart type="bar" options={bar_chart} />
			<hr>
			<p class="is-center">Bar Chart</p>
			</Col>
			<Col size="6">
			<Chart type="XY" options={xy_chart} />
			<hr>
			<p class="is-center">XY Chart</p>
			</Col>
			<Col size="6">
			<Chart type="pie" options={pie_chart} />
			<hr>
			<p class="is-center">Pie Chart</p>
			</Col>
			<Col size="6">
			<Chart type="stacked" options={stacked_chart} />
			<hr>
			<p class="is-center">Stacked Bar Chart</p>
			</Col>
			<Col size="6">
			<Chart type="radar" options={radar_chart} />
			<hr>
			<p class="is-center">Radar Chart</p>
			</Col>

			<Col size="6">
			<Chart type="line" options={line_chart} />
			<hr>
			<p class="is-center">Line Chart </p>
			</Col>
		</Row>

	</Container>

</main>

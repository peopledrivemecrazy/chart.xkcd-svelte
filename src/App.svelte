<script>
	import chartXkcd from 'chart.xkcd';
	import "chota";
	import {
		Row,
		Col,
		Container,
	} from 'svelte-chota';
	import {Pie, XY, Bar, Radar, StackedBar, Line} from './charts'




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
	let doughnut = {
		title: 'The Reality', // optional
		data: {
			labels: ["Lab", "Reading", "Writing", "Analysis", "That's Broken", "Planning", "Worrying", "More reading",
				"Shit that didn't work", "Crying", "Deciding to quit", "Fear", "I'll use Dr on my email"
			],
			datasets: [{
				data: [7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6],
			}]
		},
		options: { // optional
			innerRadius: 0.5,
			legendPosition: chartXkcd.config.positionType.upRight,
			dataColors: ["#f582ae", "#001858", "#8bd3dd", "#ff8906", "#7f5af0", "#2cb67d", "#010101", "#94a1b2",
				"#ade498", "#fa1616", "#e7dfd5", "#ffd31d", "#ccafaf"
			]

		},
	}
	let stacked = {
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
	let radar = {
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
	let line = {
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
					<a href="https://timqian.com/chart.xkcd">Tim Qian XKCD charts</a> but with <a href="https://svelte.dev" class="text-warning">svelte</a>. You can check out the article on dev.
				</p>
			</Col>
		</Row>
		<hr>
		<Row>
			<Col size="6">
			<svg use:Bar={bar_chart}></svg>
			<hr>
			<p class="is-center">Bar Chart</p>
			</Col>
			<Col size="6">
			<svg use:XY={xy_chart}></svg>
			<hr>
			<p class="is-center">XY Chart</p>

			</Col>
			<Col size="6">
			<svg use:Pie={pie_chart}></svg>
			<hr>
			<p class="is-center">Pie Chart</p>
			</Col>
			<Col size="6">
			<svg use:StackedBar={stacked}></svg>
			<hr>
			<p class="is-center">Stacked Bar Chart</p>
			</Col>
			<Col size="6">
			<svg use:Radar={radar}></svg>
			<hr>
			<p class="is-center">Radar Chart</p>
			</Col>
			<Col size="6">
				<svg use:Pie={doughnut}></svg>
				<hr>
				<p class="is-center">Doughnut Chart  <code>innerRadius is set to 0.5</code> </p>
			</Col>
			<Col size="6">
				<svg use:Line={line}></svg>
				<hr>
				<p class="is-center">Line Chart </p>
			</Col>
		</Row>

	</Container>


</main>
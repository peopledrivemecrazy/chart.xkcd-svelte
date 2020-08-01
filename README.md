# chart.xkcd-svelte

## Svelte wrapper around [chart.xkcd](https://github.com/timqian/chart.xkcd)

Check [chart.xkcd](https://github.com/timqian/chart.xkcd) for detailed documentation.


[![](https://raw.githubusercontent.com/timqian/images/master/20190819131226.gif)](https://timqian.com/chart.xkcd/)

docs for configurations you can find in the official library [page](https://timqian.com/chart.xkcd/)

## Dependencies
`chart.xkcd@^1.1.12` must be installed to use this library

## Quick Start

Install `npm i chart.xkcd-svelte`

```js
<script>
import chartXkcd from 'chart.xkcd';
import Chart from "chart.xkcd-svelte";

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
</script>

<Chart type="bar" options={bar_chart}></Chart>
```
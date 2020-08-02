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

import Chart from 'chart.xkcd-svelte';
import chartXkcd from 'chart.xkcd';
	
let options = {
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
let type = "pie";
</script>
<Chart type={type} options={options} />

```
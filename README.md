# chart.xkcd on svelte

Svelte integration using actions.

Check [chart.xkcd](https://github.com/timqian/chart.xkcd) for detailed documentation.


[![](https://raw.githubusercontent.com/timqian/images/master/20190819131226.gif)](https://timqian.com/chart.xkcd/)

docs for configurations you can find in the official library [page](https://timqian.com/chart.xkcd/)

## Usage

Install `npm i chart.xkcd`

```js
import chartXkcd from 'chart.xkcd';
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

<svg use:Bar={bar_chart}></svg>
```
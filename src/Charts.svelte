<script>

import chartXkcd from 'chart.xkcd';
import Piechart from './Piechart.svelte';
    
    let options = {
		title: 'What people think', // optional
		data: {
			labels: ['work', 'sleep', 'social'],
			datasets: [{
				data: [30, 30, 60],
			}],
		},
		options: { // optional
			innerRadius: 0,
			legendPosition: chartXkcd.config.positionType.upLeft,
		},
	}
</script>

<Piechart {options}/>

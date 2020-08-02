<script>
    import chartXkcd from 'chart.xkcd';
	import {Pie, XY, Bar, Radar, StackedBar, Line} from './charts'

    export let type, options;

</script>
{options}
{#if type == 'line'}
<svg use:Line={options}></svg>
{/if}
{#if type == 'bar'}
<svg use:Bar={options}></svg>
{/if}
{#if type == 'XY'}
<svg use:XY={options}></svg>
{/if}
{#if type == 'radar'}
<svg use:Radar={options}></svg>
{/if}
{#if type == 'pie'}
<svg use:Pie={options}></svg>
{/if}
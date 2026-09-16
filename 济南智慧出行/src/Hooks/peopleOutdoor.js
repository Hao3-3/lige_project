import {ref} from 'vue'
export const usePeopleOutdoor=()=>{

const green = '#00B96B';
const yellow = '#fd7e14';
const red = '#dc3545';
const config = {
  xField: "type",
  yField: "value",
  seriesField: "value",
  columnWidthRatio: 0.35,
  label: {
    position: "top",
    style: {
      fill: "#FFFFFF",
      opacity: 0.6,
    },
  },
  color: ({ value }) => {
    if (value > 40000) {
      return red;
    } else if (value > 20000 && value < 40000) {
      return yellow;
    } else {
      return green;
    }
  },
  legend: false,
  height: 240,
  yAxis: {
    grid: {
      line: {
        style: { stroke: 'rgba(255,255,255,0.08)', lineDash: [2,3] }
      }
    }
  },
  xAxis: {
    label: { style: { fill: 'rgba(255,255,255,0.7)' } }
  }
};

const data = ref([
  { type: "历下区", value: 50000 },
  { type: "市中区", value: 40000 },
  { type: "槐荫区", value: 25000 },
  { type: "天桥区", value: 30000 },
  { type: "历城区", value: 20000 },
  { type: "其他", value: 40000 },
]);
return {config ,data}
}

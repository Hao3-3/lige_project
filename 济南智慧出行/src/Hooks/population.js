export const usePopulation = () => {
    const data = [
          { type: "历下", value: 161 },
          { type: "市中", value: 167 },
          { type: "槐荫", value: 117 },
          { type: "天桥", value: 352 },
          { type: "历城", value: 379 },
          { type: "长清", value: 464 },
          { type: "章丘", value: 452 },
          { type: "济阳", value: 605 },


    ];
    const config = {
          appendPadding: 10,
          angleField: "value",
          colorField: "type",
          radius: 0.9,
          label: {
                type: 'spider',
                labelHeight: 28,
                content: '{name}\n{percentage}',
                style: {
                      /* 设置标注的颜色 */
                      fill: '#fff',
                      stroke: 'black',
                      shadowColor: '#652e80',
                      shadowBlur: 20,
                      cursor: 'pointer'
                }
          },
          interactions: [{ type: "element-active" }],
          data,
          height: 220,
          legend: {
                position: 'top',
                itemName:{
                      style:{
                            fill:"#fff"
                      }
                }
          },
    }
    return {
          config,
                    data	
    }
}
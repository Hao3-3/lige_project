export const useBusOnline = () => {
    const data = [
          { type: "历下区", value: 27 },
          { type: "市中区", value: 25 },
          { type: "槐荫区", value: 18 },
          { type: "天桥区", value: 15 },
          { type: "历城区", value: 15 },
          { type: "其他", value: 12 },
    ];
    const config = {
          appendPadding: 10,
          xField: "type",
          yField: "value",
          seriesField: "type",
          radius: 0.9,
          label: {
                offset: -15
          },
          interactions: [{ type: "element-active" }],
          height: 220
    };
    return {
          data,
          config
    }
}
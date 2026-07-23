/**
 * 图表渲染器 - 支持ECharts
 */

import Taro from '@tarojs/taro';

export class ChartRenderer {
  constructor() {
    this.chartTypes = {
      line: this.generateLineChart.bind(this),
      bar: this.generateBarChart.bind(this),
      pie: this.generatePieChart.bind(this),
      scatter: this.generateScatterChart.bind(this),
      area: this.generateAreaChart.bind(this),
      radar: this.generateRadarChart.bind(this),
    };
  }

  /**
   * 生成图表配置
   */
  async generateChartConfig(chartData, chartType = 'line') {
    const generator = this.chartTypes[chartType];
    if (!generator) {
      throw new Error(`不支持的图表类型: ${chartType}`);
    }

    return generator(chartData);
  }

  /**
   * 生成折线图配置
   */
  generateLineChart(data) {
    const { xAxis, yAxis, series } = this.parseChartData(data);

    return {
      type: 'line',
      option: {
        title: {
          text: data.title || '折线图',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: series.map((s) => s.name),
          bottom: 10,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxis,
        },
        yAxis: {
          type: 'value',
        },
        series: series.map((s) => ({
          name: s.name,
          type: 'line',
          data: s.data,
          smooth: true,
        })),
      },
    };
  }

  /**
   * 生成柱状图配置
   */
  generateBarChart(data) {
    const { xAxis, yAxis, series } = this.parseChartData(data);

    return {
      type: 'bar',
      option: {
        title: {
          text: data.title || '柱状图',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        legend: {
          data: series.map((s) => s.name),
          bottom: 10,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: xAxis,
        },
        yAxis: {
          type: 'value',
        },
        series: series.map((s) => ({
          name: s.name,
          type: 'bar',
          data: s.data,
        })),
      },
    };
  }

  /**
   * 生成饼图配置
   */
  generatePieChart(data) {
    const seriesData = this.parsePieData(data);

    return {
      type: 'pie',
      option: {
        title: {
          text: data.title || '饼图',
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: seriesData.map((item) => item.name),
        },
        series: [{
          name: data.seriesName || '数据',
          type: 'pie',
          radius: '50%',
          data: seriesData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        }],
      },
    };
  }

  /**
   * 生成散点图配置
   */
  generateScatterChart(data) {
    const { xAxis, yAxis, series } = this.parseChartData(data);

    return {
      type: 'scatter',
      option: {
        title: {
          text: data.title || '散点图',
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
        },
        xAxis: {
          type: 'value',
          scale: true,
        },
        yAxis: {
          type: 'value',
          scale: true,
        },
        series: [{
          name: series[0]?.name || '数据',
          type: 'scatter',
          data: series[0]?.data || [],
        }],
      },
    };
  }

  /**
   * 生成面积图配置
   */
  generateAreaChart(data) {
    const { xAxis, yAxis, series } = this.parseChartData(data);

    return {
      type: 'area',
      option: {
        title: {
          text: data.title || '面积图',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: series.map((s) => s.name),
          bottom: 10,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxis,
        },
        yAxis: {
          type: 'value',
        },
        series: series.map((s) => ({
          name: s.name,
          type: 'line',
          data: s.data,
          areaStyle: {},
          smooth: true,
        })),
      },
    };
  }

  /**
   * 生成雷达图配置
   */
  generateRadarChart(data) {
    const { indicators, series } = this.parseRadarData(data);

    return {
      type: 'radar',
      option: {
        title: {
          text: data.title || '雷达图',
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
        },
        legend: {
          data: series.map((s) => s.name),
          bottom: 10,
        },
        radar: {
          indicator: indicators,
        },
        series: [{
          name: '数据',
          type: 'radar',
          data: series,
        }],
      },
    };
  }

  /**
   * 解析图表数据
   */
  parseChartData(data) {
    let xAxis = [];
    let yAxis = [];
    let series = [];

    if (data.xAxis) {
      xAxis = data.xAxis;
    } else if (data.data && data.data.length > 0) {
      xAxis = data.data.map((item) => item.x || item.name || item.label);
    }

    if (data.yAxis) {
      yAxis = data.yAxis;
    }

    if (data.series) {
      series = data.series;
    } else if (data.data && data.data.length > 0) {
      // 单系列数据
      series = [{
        name: data.seriesName || '数据',
        data: data.data.map((item) => item.y || item.value || item.data),
      }];
    }

    return { xAxis, yAxis, series };
  }

  /**
   * 解析饼图数据
   */
  parsePieData(data) {
    if (data.series && data.series.length > 0) {
      return data.series[0].data;
    } else if (data.data && data.data.length > 0) {
      return data.data.map((item) => ({
        name: item.name || item.label,
        value: item.value || item.data,
      }));
    }
    return [];
  }

  /**
   * 解析雷达图数据
   */
  parseRadarData(data) {
    let indicators = [];
    let series = [];

    if (data.indicators) {
      indicators = data.indicators;
    } else if (data.data && data.data.length > 0) {
      indicators = data.data.map((item) => ({
        name: item.name || item.label,
        max: item.max || 100,
      }));
    }

    if (data.series) {
      series = data.series;
    } else if (data.data && data.data.length > 0) {
      series = [{
        name: data.seriesName || '数据',
        value: data.data.map((item) => item.value || item.data),
      }];
    }

    return { indicators, series };
  }

  /**
   * 渲染图表到小程序
   */
  renderChart(chartConfig, canvasId) {
    return new Promise((resolve, reject) => {
      try {
        // 这里需要引入ECharts小程序版本
        // 由于小程序环境的限制，需要特殊处理
        const ecComponent = {
          canvasId,
          ec: {
            option: chartConfig.option,
          },
        };

        resolve(ecComponent);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取图表样式
   */
  getChartStyles() {
    return `
      .chart-container {
        width: 100%;
        height: 400rpx;
        margin: 20rpx 0;
      }
      
      .chart-canvas {
        width: 100%;
        height: 100%;
      }
    `;
  }
}

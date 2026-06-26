// 使用 Node.js 生成 Excel 开发任务清单
const fs = require('fs');
const path = require('path');

// 简单的 Excel XML 格式生成函数
function generateExcelXML(tasks) {
  let excelXML = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>系统生成</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>运动促进健康项目组</Company>
 </DocumentProperties>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>9000</WindowHeight>
  <WindowWidth>13860</WindowWidth>
  <WindowTopX>240</WindowTopX>
  <WindowTopY>75</WindowTopY>
  <ProtectStructure>False</ProtectStructure>
  <ProtectWindows>False</ProtectWindows>
 </ExcelWorkbook>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="宋体" x:CharSet="134" ss:Size="11"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s62">
   <Font ss:FontName="宋体" x:CharSet="134" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="s63">
   <Font ss:FontName="宋体" x:CharSet="134" ss:Size="11" ss:Color="#FF0000"/>
  </Style>
  <Style ss:ID="s64">
   <Font ss:FontName="宋体" x:CharSet="134" ss:Size="11" ss:Color="#008000"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="开发任务清单">
  <Table ss:ExpandedColumnCount="9" ss:ExpandedRowCount="${tasks.length + 1}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="15">
   <Column ss:Width="30"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Column ss:Width="300"/>
   <Column ss:Width="50"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="200"/>
   <Row ss:StyleID="s62">
    <Cell><Data ss:Type="String">序号</Data></Cell>
    <Cell><Data ss:Type="String">模块</Data></Cell>
    <Cell><Data ss:Type="String">功能点</Data></Cell>
    <Cell><Data ss:Type="String">页面/组件</Data></Cell>
    <Cell><Data ss:Type="String">任务描述</Data></Cell>
    <Cell><Data ss:Type="String">优先级</Data></Cell>
    <Cell><Data ss:Type="String">工作量(人天)</Data></Cell>
    <Cell><Data ss:Type="String">负责人</Data></Cell>
    <Cell><Data ss:Type="String">状态</Data></Cell>
    <Cell><Data ss:Type="String">备注</Data></Cell>
   </Row>
`;

  tasks.forEach(task => {
    const priorityStyle = task.优先级 === 'P0' ? ' ss:StyleID="s63"' : (task.优先级 === 'P1' ? ' ss:StyleID="s64"' : '');
    excelXML += `   <Row>
    <Cell><Data ss:Type="Number">${task.序号}</Data></Cell>
    <Cell><Data ss:Type="String">${task.模块}</Data></Cell>
    <Cell><Data ss:Type="String">${task.功能点}</Data></Cell>
    <Cell${priorityStyle}><Data ss:Type="String">${task['页面/组件']}</Data></Cell>
    <Cell><Data ss:Type="String">${task.任务描述}</Data></Cell>
    <Cell${priorityStyle}><Data ss:Type="String">${task.优先级}</Data></Cell>
    <Cell><Data ss:Type="Number">${task['工作量(人天)']}</Data></Cell>
    <Cell><Data ss:Type="String">${task.负责人}</Data></Cell>
    <Cell><Data ss:Type="String">${task.状态}</Data></Cell>
    <Cell><Data ss:Type="String">${task.备注}</Data></Cell>
   </Row>
`;
  });

  excelXML += `  </Table>
 </Worksheet>
</Workbook>`;

  return excelXML;
}

// 任务数据
const tasks = [
  {序号: 1, 模块: '系统流程图', 功能点: '系统流程图展示', '页面/组件': '系统流程图', 任务描述: '实现系统整体流程的可视化展示，包含各角色之间的业务流程关系', 优先级: 'P0', '工作量(人天)': 2, 负责人: '', 状态: '待开始', 备注: '需要与产品确认流程细节'},
  {序号: 2, 模块: '省体育局群体处', 功能点: '省级管理后台', '页面/组件': '省体育局群体处模块', 任务描述: '实现省体育局群体处的管理功能，包括项目管理、申报管理等', 优先级: 'P0', '工作量(人天)': 5, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 3, 模块: '运动促进健康中心管理', 功能点: '模板管理', '页面/组件': '设计模板列表', 任务描述: '实现申报模板的管理功能，包括模板的创建、编辑、删除', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: '区分处室视图和开发视图'},
  {序号: 4, 模块: '运动促进健康中心管理', 功能点: '模板管理-设计模板（处室看）', '页面/组件': '设计模板（处室看）页面', 任务描述: '面向处室人员的模板展示页面，展示模板配置信息', 优先级: 'P1', '工作量(人天)': 1, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 5, 模块: '运动促进健康中心管理', 功能点: '模板管理-设计模板（开发看）', '页面/组件': '设计模板（开发看）页面', 任务描述: '面向开发人员的模板展示页面，展示技术实现相关配置', 优先级: 'P1', '工作量(人天)': 1, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 6, 模块: '运动促进健康中心管理', 功能点: '申报设置', '页面/组件': '申报设置页面', 任务描述: '实现申报相关参数配置功能，包括申报周期、申报条件等', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 7, 模块: '运动促进健康中心管理', 功能点: '资格初审', '页面/组件': '资格初审页面', 任务描述: '实现申报单位资格的初审功能，包括查看、审核、驳回', 优先级: 'P0', '工作量(人天)': 4, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 8, 模块: '运动促进健康中心管理', 功能点: '书面评审', '页面/组件': '书面评审页面', 任务描述: '实现书面材料评审功能，包括专家分配、评审进度跟踪', 优先级: 'P0', '工作量(人天)': 5, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 9, 模块: '运动促进健康中心管理', 功能点: '书面评审评分汇总', '页面/组件': '书面评审评分汇总页面', 任务描述: '实现书面评审分数的汇总统计功能，支持导出报表', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 10, 模块: '运动促进健康中心管理', 功能点: '实地考察', '页面/组件': '实地考察页面', 任务描述: '实现实地考察安排和记录功能，包括考察组管理、考察报告', 优先级: 'P0', '工作量(人天)': 5, 负责人: '', 状态: '待开始', 备注: '涉及小程序端'},
  {序号: 11, 模块: '运动促进健康中心管理', 功能点: '实地考察评分汇总', '页面/组件': '实地考察评分汇总页面', 任务描述: '实现实地考察分数的汇总统计功能', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 12, 模块: '运动促进健康中心管理', 功能点: '评分汇总', '页面/组件': '评分汇总页面', 任务描述: '实现综合评分汇总功能，汇总书面评审和实地考察分数', 优先级: 'P0', '工作量(人天)': 4, 负责人: '', 状态: '待开始', 备注: '需要支持分数导出和公示'},
  {序号: 13, 模块: '运动促进健康机构-法人', 功能点: '首页', '页面/组件': '机构首页', 任务描述: '实现机构端首页，展示申报通知、当前申报状态等信息', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 14, 模块: '运动促进健康机构-法人', 功能点: '运促中心专项资金补助申请', '页面/组件': '补助申请表单页面', 任务描述: '实现专项资金补助申请功能，包括在线表单填写、保存、提交', 优先级: 'P0', '工作量(人天)': 6, 负责人: '', 状态: '待开始', 备注: '表单校验、暂存、提交功能'},
  {序号: 15, 模块: '运动促进健康机构-法人', 功能点: '申请书pdf生成及佐证文件上传', '页面/组件': 'PDF生成页面', 任务描述: '实现申请书PDF生成功能，支持佐证文件上传和管理', 优先级: 'P0', '工作量(人天)': 5, 负责人: '', 状态: '待开始', 备注: '需要PDF生成库支持'},
  {序号: 16, 模块: '市体育部门', 功能点: '市级报送', '页面/组件': '市级报送管理', 任务描述: '实现市级报送管理功能，汇总本地区申报材料并报送', 优先级: 'P0', '工作量(人天)': 4, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 17, 模块: '市体育部门', 功能点: '待审核', '页面/组件': '待审核列表页面', 任务描述: '实现待审核申报材料的列表展示和审核功能', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 18, 模块: '市体育部门', 功能点: '待报送', '页面/组件': '待报送列表页面', 任务描述: '实现待报送申报材料的列表展示和报送功能', 优先级: 'P0', '工作量(人天)': 3, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 19, 模块: '市体育部门', 功能点: '已报送', '页面/组件': '已报送列表页面', 任务描述: '实现已报送申报材料的列表展示和查看功能', 优先级: 'P1', '工作量(人天)': 2, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 20, 模块: '市体育部门', 功能点: '已驳回', '页面/组件': '已驳回列表页面', 任务描述: '实现已驳回申报材料的列表展示和重新申报功能', 优先级: 'P1', '工作量(人天)': 2, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 21, 模块: '市体育部门', 功能点: '不通过', '页面/组件': '不通过列表页面', 任务描述: '实现评审不通过申报材料的列表展示', 优先级: 'P1', '工作量(人天)': 2, 负责人: '', 状态: '待开始', 备注: ''},
  {序号: 22, 模块: '专家', 功能点: '书面评审', '页面/组件': '专家书面评审页面', 任务描述: '实现专家在线书面评审功能，支持打分和填写评审意见', 优先级: 'P0', '工作量(人天)': 5, 负责人: '', 状态: '待开始', 备注: '需要专家账号体系'},
  {序号: 23, 模块: '专家', 功能点: '小程序-实地考察', '页面/组件': '实地考察小程序页面', 任务描述: '实现实地考察小程序功能，支持现场打分和拍照记录', 优先级: 'P0', '工作量(人天)': 8, 负责人: '', 状态: '待开始', 备注: '需要小程序开发'}
];

// 生成Excel文件
const excelXML = generateExcelXML(tasks);
const outputFile = '运动促进健康_开发任务清单.xls';
fs.writeFileSync(outputFile, excelXML, 'utf8');

const totalWork = tasks.reduce((sum, t) => sum + t['工作量(人天)'], 0);
console.log(`Excel文件已生成: ${outputFile}`);
console.log(`共 ${tasks.length} 个开发任务`);
console.log(`预计总工作量: ${totalWork} 人天`);

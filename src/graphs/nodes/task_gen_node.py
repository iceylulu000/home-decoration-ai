from src.graphs.state import GlobalState

def task_gen_node(state: GlobalState) -> GlobalState:
    """学生任务生成节点"""
    tasks = [
        {
            "任务ID": "task_001",
            "任务名称": "平面图设计",
            "任务描述": "根据项目需求完成120平方米三居室平面方案设计，体现现代简约风格",
            "截止时间": "7天",
            "难度": "中级"
        },
        {
            "任务ID": "task_002",
            "任务名称": "效果图渲染",
            "任务描述": "完成客厅和主卧的3D效果图制作，包含灯光和材质表现",
            "截止时间": "14天",
            "难度": "高级"
        },
        {
            "任务ID": "task_003",
            "任务名称": "施工图绘制",
            "任务描述": "绘制完整的施工图纸，包括平面布置图、天花图、立面图",
            "截止时间": "10天",
            "难度": "中级"
        }
    ]
    
    state.student_tasks = tasks
    return state

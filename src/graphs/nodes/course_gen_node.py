from src.graphs.state import GlobalState

def course_gen_node(state: GlobalState) -> GlobalState:
    """AI课程生成节点"""
    course_content = """课程内容

【课程名称】基于真实项目的家装设计实战

【教学目标】
1. 理解项目需求与客户沟通
2. 掌握现代简约风格设计要点
3. 学会平面布局与空间规划

【课程内容】
本课程基于企业真实项目「现代简约风格三居室家装设计」展开，
涵盖从需求分析到方案呈现的全流程实战训练。

项目信息：
{}

【实战任务】
学生将完成平面图设计、效果图渲染、施工图绘制等核心任务。
""".format(state.project_info.get('原始内容', ''))
    
    state.course_content = course_content
    return state

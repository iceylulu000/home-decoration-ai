from src.graphs.state import FileOps, GlobalState

def project_parse_node(state: GlobalState) -> GlobalState:
    """项目资料解析节点"""
    content = FileOps.extract_text(state.project_material)
    
    project_info = {
        "原始内容": content,
        "解析时间": "自动生成",
        "状态": "已解析"
    }
    
    state.project_info = project_info
    return state
